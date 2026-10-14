<template>
  <div class="min-h-screen bg-elevated">
    <AppHeader :title="room?.name || 'Manage Room'" back-to="/admin/rooms" back-label="Rooms" />

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div v-if="loadingRoom" class="flex items-center justify-center gap-2 py-16 text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
        Loading room...
      </div>

      <UAlert v-else-if="!room" color="error" variant="soft" title="Room not found" description="This room is not on your account." />

      <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UCard>
          <template #header>
            <h3 class="font-semibold">Room Details</h3>
          </template>
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="text-muted">Name</dt>
              <dd class="font-medium">{{ room.name }}</dd>
            </div>
            <div>
              <dt class="text-muted">Description</dt>
              <dd>{{ room.description || 'No description' }}</dd>
            </div>
            <div>
              <dt class="text-muted">Invited players</dt>
              <dd class="font-medium">{{ room.invitedUsers.length }}</dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">Invite Users</h3>
          </template>
          <div v-if="availableUsers.length === 0" class="py-6 text-center text-sm text-muted">
            Every player account is already invited.
          </div>
          <ul v-else class="space-y-2">
            <li v-for="account in availableUsers" :key="account.id" class="flex items-center justify-between gap-3">
              <span>{{ account.username }}</span>
              <UButton size="sm" icon="i-lucide-mail" :loading="invitingId === account.id" @click="inviteUser(account.id)">
                Invite
              </UButton>
            </li>
          </ul>
        </UCard>

        <UCard class="lg:col-span-2">
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h3 class="font-semibold">Quizzes</h3>
              <UButton size="sm" icon="i-lucide-plus" @click="openQuizModal">Create Quiz</UButton>
            </div>
          </template>

          <div v-if="loadingQuizzes" class="py-6 text-center text-sm text-muted">Loading quizzes...</div>
          <div v-else-if="quizzes.length === 0" class="py-6 text-center text-sm text-muted">
            No quizzes yet. Add questions, then start the live session.
          </div>
          <ul v-else class="space-y-3">
            <li v-for="quiz in quizzes" :key="quiz.id" class="rounded-lg border border-default p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 class="font-medium">{{ quiz.title }}</h4>
                  <p class="text-sm text-muted">{{ quiz.description || 'No description' }}</p>
                  <p class="mt-1 text-sm text-muted">{{ quiz.questions.length }} question{{ quiz.questions.length === 1 ? '' : 's' }}</p>
                </div>
                <UButton color="success" icon="i-lucide-play" :to="`/admin/quiz/${quiz.id}?roomId=${roomId}`">
                  Start Quiz
                </UButton>
              </div>
            </li>
          </ul>
        </UCard>
      </div>
    </main>

    <UModal v-model:open="showQuizModal" title="Create Quiz" description="Add at least one question with two options." scrollable :ui="{ content: 'sm:max-w-2xl' }">
      <template #body>
        <UForm id="create-quiz-form" :state="newQuiz" class="space-y-4" @submit="handleCreateQuiz">
          <UFormField label="Quiz Title" name="title" required>
            <UInput v-model="newQuiz.title" class="w-full" placeholder="Round one" />
          </UFormField>
          <UFormField label="Description" name="description">
            <UTextarea v-model="newQuiz.description" class="w-full" placeholder="Optional intro for the host" :rows="2" />
          </UFormField>

          <div class="flex items-center justify-between">
            <h4 class="font-medium">Questions</h4>
            <UButton type="button" size="sm" icon="i-lucide-plus" color="neutral" variant="soft" @click="addQuestion">
              Add Question
            </UButton>
          </div>

          <div v-if="newQuiz.questions.length === 0" class="rounded-lg border border-dashed border-default p-4 text-sm text-muted">
            No questions yet.
          </div>

          <div v-for="(question, index) in newQuiz.questions" :key="index" class="space-y-3 rounded-lg border border-default p-4">
            <div class="flex items-center justify-between">
              <h5 class="font-medium">Question {{ index + 1 }}</h5>
              <UButton type="button" color="error" size="xs" icon="i-lucide-trash-2" variant="ghost" @click="removeQuestion(index)" />
            </div>

            <UFormField label="Question" required>
              <UInput v-model="question.question" class="w-full" placeholder="What is the capital of France?" />
            </UFormField>

            <UFormField label="Options" required help="One option per line. At least two.">
              <UTextarea v-model="question.optionsText" class="w-full" :rows="4" placeholder="Paris&#10;Lyon&#10;Nice" />
            </UFormField>

            <UFormField label="Correct Answer" required>
              <USelect
                v-model="question.correctAnswer"
                class="w-full"
                placeholder="Select the correct option"
                :items="optionItems(question)"
                :disabled="optionItems(question).length === 0"
              />
            </UFormField>

            <UFormField label="Time Limit (seconds)">
              <UInput v-model.number="question.timeLimit" class="w-full" type="number" min="5" max="300" />
            </UFormField>
          </div>
        </UForm>
      </template>
      <template #footer>
        <div class="flex gap-2">
          <UButton type="submit" form="create-quiz-form" :loading="submitting" :disabled="newQuiz.questions.length === 0">
            Create Quiz
          </UButton>
          <UButton type="button" color="neutral" variant="ghost" @click="showQuizModal = false">Cancel</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-admin']
})

const { sessionId } = useAuth()
const route = useRoute()
const { notifyError, notifySuccess } = useFeedback()

const roomId = computed(() => String(route.params.id))

const room = ref(null)
const users = ref([])
const quizzes = ref([])
const loadingRoom = ref(true)
const loadingQuizzes = ref(false)
const submitting = ref(false)
const invitingId = ref(null)
const showQuizModal = ref(false)

const blankQuestion = () => ({
  question: '',
  optionsText: '',
  correctAnswer: '',
  timeLimit: 30
})

const newQuiz = reactive({
  title: '',
  description: '',
  questions: []
})

const availableUsers = computed(() => {
  if (!room.value) return []
  return users.value.filter(account =>
    account.role === 'user' && !room.value.invitedUsers.includes(account.id)
  )
})

const optionItems = (question) => question.optionsText
  .split('\n')
  .map(option => option.trim())
  .filter(Boolean)
  .map(option => ({ label: option, value: option }))

const loadRoom = async () => {
  loadingRoom.value = true
  try {
    const response = await $fetch('/api/rooms/my-rooms', {
      params: { sessionId: sessionId.value }
    })
    room.value = response.rooms.find(item => item.id === roomId.value) || null
  } catch (error) {
    notifyError(error, 'Could not load room')
  } finally {
    loadingRoom.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await $fetch('/api/users/list', {
      params: { sessionId: sessionId.value }
    })
    users.value = response.users
  } catch (error) {
    notifyError(error, 'Could not load users')
  }
}

const loadQuizzes = async () => {
  loadingQuizzes.value = true
  try {
    const response = await $fetch('/api/quizzes/by-room', {
      params: { sessionId: sessionId.value, roomId: roomId.value }
    })
    quizzes.value = response.quizzes
  } catch (error) {
    notifyError(error, 'Could not load quizzes')
  } finally {
    loadingQuizzes.value = false
  }
}

const inviteUser = async (userId) => {
  invitingId.value = userId
  try {
    await $fetch('/api/rooms/invite', {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        roomId: roomId.value,
        userId
      }
    })
    notifySuccess('Invitation sent')
    await loadRoom()
  } catch (error) {
    notifyError(error, 'Could not invite user')
  } finally {
    invitingId.value = null
  }
}

const openQuizModal = () => {
  newQuiz.title = ''
  newQuiz.description = ''
  newQuiz.questions = [blankQuestion()]
  showQuizModal.value = true
}

const addQuestion = () => {
  newQuiz.questions.push(blankQuestion())
}

const removeQuestion = (index) => {
  newQuiz.questions.splice(index, 1)
}

const handleCreateQuiz = async () => {
  const questions = newQuiz.questions.map((question) => {
    const options = question.optionsText.split('\n').map(option => option.trim()).filter(Boolean)
    return {
      question: question.question.trim(),
      options,
      correctAnswer: question.correctAnswer,
      timeLimit: Number(question.timeLimit) || 30
    }
  })

  const invalid = !newQuiz.title.trim() || questions.some(question =>
    !question.question || question.options.length < 2 || !question.options.includes(question.correctAnswer)
  )

  if (invalid) {
    notifyError({
      message: 'Each question needs text, at least two options, and a correct answer chosen from those options.'
    }, 'Quiz is incomplete')
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/quizzes/create', {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        roomId: roomId.value,
        title: newQuiz.title.trim(),
        description: newQuiz.description.trim(),
        questions
      }
    })
    showQuizModal.value = false
    notifySuccess('Quiz created')
    await loadQuizzes()
  } catch (error) {
    notifyError(error, 'Could not create quiz')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadRoom(), loadUsers(), loadQuizzes()])
})
</script>
