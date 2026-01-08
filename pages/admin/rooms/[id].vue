<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <UButton @click="router.push('/admin/rooms')" icon="i-heroicons-arrow-left" variant="ghost">
              Back to Rooms
            </UButton>
            <h1 class="text-2xl font-bold text-gray-900">{{ room?.name || 'Manage Room' }}</h1>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">{{ user?.username }}</span>
            <UButton @click="handleLogout" color="red" variant="soft">Logout</UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div v-if="!room" class="text-center py-8">
        <p class="text-gray-500">Loading room...</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Room Details -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Room Details</h3>
          </template>
          <div class="space-y-3">
            <div>
              <p class="text-sm text-gray-500">Name</p>
              <p class="font-medium">{{ room.name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Description</p>
              <p>{{ room.description || 'No description' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Invited Users</p>
              <p class="font-medium">{{ room.invitedUsers.length }}</p>
            </div>
          </div>
        </UCard>

        <!-- Invite Users -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Invite Users</h3>
          </template>
          <div class="space-y-3">
            <div v-for="u in availableUsersForInvite" :key="u.id" class="flex justify-between items-center">
              <span>{{ u.username }}</span>
              <UButton @click="inviteUser(u.id)" size="sm">Invite</UButton>
            </div>
            <div v-if="availableUsersForInvite.length === 0" class="text-center py-4 text-gray-500">
              All users invited
            </div>
          </div>
        </UCard>

        <!-- Quizzes -->
        <UCard class="lg:col-span-2">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-semibold">Quizzes</h3>
              <UButton @click="createQuizForRoom" size="sm" icon="i-heroicons-plus">
                Create Quiz
              </UButton>
            </div>
          </template>
          <div v-if="loadingQuizzes" class="text-center py-4">
            <p class="text-gray-500">Loading quizzes...</p>
          </div>
          <div v-else-if="quizzes.length === 0" class="text-center py-4 text-gray-500">
            No quizzes created yet
          </div>
          <div v-else class="space-y-3">
            <div v-for="quiz in quizzes" :key="quiz.id" class="border rounded-lg p-4 hover:bg-gray-50">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-medium">{{ quiz.title }}</h4>
                  <p class="text-sm text-gray-600">{{ quiz.description }}</p>
                  <p class="text-sm text-gray-500 mt-1">{{ quiz.questions.length }} questions</p>
                </div>
                <UButton @click="startQuiz(quiz)" color="green">Start Quiz</UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Create Quiz Modal -->
    <UModal v-model="showQuizModal">
      <UCard>
        <template #header>
          <h3 class="font-semibold">Create Quiz</h3>
        </template>
        <form @submit.prevent="handleCreateQuiz" class="space-y-4">
          <UFormGroup label="Quiz Title" required>
            <UInput v-model="newQuiz.title" placeholder="Enter quiz title" />
          </UFormGroup>
          <UFormGroup label="Description">
            <UTextarea v-model="newQuiz.description" placeholder="Enter description" />
          </UFormGroup>
          
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h4 class="font-medium">Questions</h4>
              <UButton @click="addQuestion" size="sm" icon="i-heroicons-plus">Add Question</UButton>
            </div>
            
            <div v-for="(q, idx) in newQuiz.questions" :key="idx" class="border rounded p-4 space-y-3">
              <div class="flex justify-between items-start">
                <h5 class="font-medium">Question {{ idx + 1 }}</h5>
                <UButton @click="removeQuestion(idx)" color="red" size="xs" icon="i-heroicons-trash" />
              </div>
              
              <UFormGroup label="Question" required>
                <UInput v-model="q.question" placeholder="Enter question" />
              </UFormGroup>
              
              <UFormGroup label="Options (one per line)" required>
                <UTextarea 
                  :model-value="q.options.join('\n')" 
                  @update:model-value="q.options = $event.split('\n').filter(o => o.trim())"
                  placeholder="Option 1&#10;Option 2&#10;Option 3&#10;Option 4" 
                  rows="4"
                />
              </UFormGroup>
              
              <UFormGroup label="Correct Answer" required>
                <UInput v-model="q.correctAnswer" placeholder="Enter correct answer" />
              </UFormGroup>
              
              <UFormGroup label="Time Limit (seconds)">
                <UInput v-model.number="q.timeLimit" type="number" placeholder="30" />
              </UFormGroup>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton type="submit" :loading="submitting" :disabled="newQuiz.questions.length === 0">
              Create Quiz
            </UButton>
            <UButton @click="showQuizModal = false" color="gray" variant="ghost">Cancel</UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-admin']
})

const { user, sessionId, logout } = useAuth()
const router = useRouter()
const route = useRoute()

const roomId = route.params.id

const room = ref(null)
const users = ref([])
const quizzes = ref([])
const loadingQuizzes = ref(false)
const submitting = ref(false)
const showQuizModal = ref(false)

const newQuiz = ref({
  title: '',
  description: '',
  questions: []
})

const availableUsersForInvite = computed(() => {
  if (!room.value) return []
  return users.value.filter(u => 
    u.role === 'user' && !room.value.invitedUsers.includes(u.id)
  )
})

const handleLogout = () => {
  logout()
  router.push('/')
}

const loadRoom = async () => {
  try {
    const response = await $fetch('/api/rooms/my-rooms', {
      params: { sessionId: sessionId.value }
    })
    room.value = response.rooms.find(r => r.id === roomId)
  } catch (error) {
    console.error('Failed to load room:', error)
  }
}

const loadUsers = async () => {
  try {
    const response = await $fetch('/api/users/list', {
      params: { sessionId: sessionId.value }
    })
    users.value = response.users
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

const loadQuizzes = async () => {
  loadingQuizzes.value = true
  try {
    const response = await $fetch('/api/quizzes/by-room', {
      params: { sessionId: sessionId.value, roomId }
    })
    quizzes.value = response.quizzes
  } catch (error) {
    console.error('Failed to load quizzes:', error)
  }
  loadingQuizzes.value = false
}

const inviteUser = async (userId) => {
  try {
    await $fetch('/api/rooms/invite', {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        roomId,
        userId
      }
    })
    await loadRoom()
  } catch (error) {
    console.error('Failed to invite user:', error)
  }
}

const createQuizForRoom = () => {
  newQuiz.value = {
    title: '',
    description: '',
    questions: []
  }
  showQuizModal.value = true
}

const addQuestion = () => {
  newQuiz.value.questions.push({
    question: '',
    options: [],
    correctAnswer: '',
    timeLimit: 30
  })
}

const removeQuestion = (index) => {
  newQuiz.value.questions.splice(index, 1)
}

const handleCreateQuiz = async () => {
  submitting.value = true
  try {
    await $fetch('/api/quizzes/create', {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        roomId,
        title: newQuiz.value.title,
        description: newQuiz.value.description,
        questions: newQuiz.value.questions
      }
    })
    showQuizModal.value = false
    await loadQuizzes()
  } catch (error) {
    console.error('Failed to create quiz:', error)
  }
  submitting.value = false
}

const startQuiz = (quiz) => {
  router.push(`/admin/quiz/${quiz.id}?roomId=${roomId}`)
}

onMounted(async () => {
  await loadRoom()
  await loadUsers()
  await loadQuizzes()
})
</script>
