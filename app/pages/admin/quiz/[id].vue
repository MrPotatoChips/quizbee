<template>
  <div class="min-h-screen bg-elevated">
    <AppHeader title="Quiz Control" back-to="/admin/rooms" back-label="Rooms" />

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div v-if="loading" class="flex items-center justify-center gap-2 py-16 text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
        Loading quiz...
      </div>

      <UAlert
        v-else-if="!quiz"
        color="error"
        variant="soft"
        title="Quiz not found"
        description="Go back to the room and open the quiz from there."
      />

      <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 class="text-xl font-semibold">{{ quiz.title }}</h2>
                  <p class="text-muted">{{ quiz.description || 'Live session' }}</p>
                </div>
                <UBadge :color="statusColor" variant="soft">{{ quizStatus }}</UBadge>
              </div>
            </template>

            <div class="space-y-4">
              <div>
                <div class="mb-2 flex justify-between text-sm">
                  <span class="text-muted">Progress</span>
                  <span class="font-medium">{{ progressLabel }}</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-accented">
                  <div class="h-full bg-primary transition-all" :style="{ width: `${progress}%` }" />
                </div>
              </div>

              <UAlert v-if="connectionError" color="error" variant="soft" :title="connectionError" />

              <div v-if="currentQuestion" class="rounded-lg border border-default bg-default p-4">
                <h3 class="mb-2 font-medium">Question {{ displayedQuestionNumber }}</h3>
                <p class="mb-4 text-lg">{{ currentQuestion.question }}</p>
                <ul class="space-y-2">
                  <li
                    v-for="(option, index) in currentQuestion.options"
                    :key="index"
                    class="rounded-md border px-3 py-2"
                    :class="option === currentQuestion.correctAnswer ? 'border-success bg-success/10' : 'border-default'"
                  >
                    {{ option }}
                    <span v-if="option === currentQuestion.correctAnswer" class="ml-2 text-sm text-success">Correct</span>
                  </li>
                </ul>
              </div>

              <UButton
                v-if="quizStatus === 'waiting'"
                color="success"
                size="lg"
                block
                icon="i-lucide-play"
                :disabled="!connected"
                @click="startQuiz"
              >
                Start Quiz
              </UButton>

              <UButton
                v-else-if="quizStatus === 'active'"
                size="lg"
                block
                icon="i-lucide-skip-forward"
                :disabled="!connected"
                @click="nextQuestion"
              >
                {{ currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz' }}
              </UButton>

              <UButton v-else to="/admin" size="lg" block icon="i-lucide-layout-dashboard">
                Back to Dashboard
              </UButton>
            </div>
          </UCard>

          <UCard v-if="quizStatus === 'completed'">
            <template #header>
              <h3 class="font-semibold">Final Leaderboard</h3>
            </template>
            <p v-if="leaderboard.length === 0" class="py-4 text-center text-muted">No scored participants</p>
            <ol v-else class="space-y-2">
              <li
                v-for="(entry, index) in leaderboard"
                :key="entry.userId"
                class="flex items-center justify-between rounded-lg px-3 py-3"
                :class="rankClass(index)"
              >
                <span class="font-medium">{{ index + 1 }}. {{ entry.username }}</span>
                <span class="text-lg font-bold">{{ entry.score }}</span>
              </li>
            </ol>
          </UCard>
        </div>

        <div class="space-y-6">
          <UCard>
            <template #header>
              <h3 class="font-semibold">Participants</h3>
            </template>
            <div class="py-2 text-center">
              <p class="text-4xl font-bold text-primary">{{ participants }}</p>
              <p class="text-sm text-muted">{{ participants === 1 ? 'player connected' : 'players connected' }}</p>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="font-semibold">Recent Submissions</h3>
            </template>
            <p v-if="recentSubmissions.length === 0" class="py-4 text-center text-sm text-muted">No submissions yet</p>
            <ul v-else class="max-h-96 space-y-2 overflow-y-auto">
              <li
                v-for="(submission, index) in recentSubmissions.slice(0, 12)"
                :key="index"
                class="rounded-md px-3 py-2 text-sm"
                :class="submission.isCorrect ? 'bg-success/10' : 'bg-error/10'"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ submission.username || 'Player' }}</span>
                  <UIcon :name="submission.isCorrect ? 'i-lucide-check' : 'i-lucide-x'" class="size-4" />
                </div>
                <p class="text-xs text-muted">Question {{ submission.questionIndex + 1 }}</p>
              </li>
            </ul>
          </UCard>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-admin']
})

const route = useRoute()
const { user, sessionId } = useAuth()
const { initSocket } = useSocket()
const { notifyError } = useFeedback()

const quizId = computed(() => String(route.params.id))
const roomId = computed(() => String(route.query.roomId || ''))

const quiz = ref(null)
const loading = ref(true)
const quizSessionId = ref(null)
const quizStatus = ref('waiting')
const currentQuestionIndex = ref(0)
const currentQuestion = ref(null)
const participants = ref(0)
const leaderboard = ref([])
const recentSubmissions = ref([])
const connected = ref(false)
const connectionError = ref('')
const socket = ref(null)

const statusColor = computed(() => {
  if (quizStatus.value === 'active') return 'success'
  if (quizStatus.value === 'completed') return 'info'
  return 'neutral'
})

const displayedQuestionNumber = computed(() => currentQuestionIndex.value + 1)

const progress = computed(() => {
  if (!quiz.value?.questions.length) return 0
  if (quizStatus.value === 'waiting') return 0
  if (quizStatus.value === 'completed') return 100
  return Math.round((displayedQuestionNumber.value / quiz.value.questions.length) * 100)
})

const progressLabel = computed(() => {
  if (!quiz.value) return ''
  if (quizStatus.value === 'waiting') return `0 / ${quiz.value.questions.length}`
  if (quizStatus.value === 'completed') return `${quiz.value.questions.length} / ${quiz.value.questions.length}`
  return `${displayedQuestionNumber.value} / ${quiz.value.questions.length}`
})

const rankClass = (index) => {
  if (index === 0) return 'bg-warning/15'
  if (index === 1) return 'bg-elevated'
  if (index === 2) return 'bg-warning/10'
  return 'border border-default'
}

const applyQuestion = (question) => {
  if (!quiz.value || !question) return
  currentQuestionIndex.value = question.index
  currentQuestion.value = {
    ...quiz.value.questions[question.index],
    index: question.index
  }
}

const loadQuiz = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/quizzes/by-room', {
      params: { sessionId: sessionId.value, roomId: roomId.value }
    })
    quiz.value = response.quizzes.find(item => item.id === quizId.value) || null
    if (quiz.value?.questions.length) {
      currentQuestion.value = quiz.value.questions[0]
    }
  } catch (error) {
    notifyError(error, 'Could not load quiz')
  } finally {
    loading.value = false
  }
}

const startQuiz = () => {
  socket.value?.emit('start-quiz', { quizId: quizId.value, roomId: roomId.value })
}

const nextQuestion = () => {
  if (!socket.value || !quizSessionId.value) return
  socket.value.emit('next-question', {
    sessionId: quizSessionId.value,
    questionIndex: currentQuestionIndex.value + 1
  })
}

const bindSocket = (client) => {
  client.emit('join-room', { roomId: roomId.value, userId: user.value?.id, observe: true })

  client.on('quiz-started', (data) => {
    quizSessionId.value = data.sessionId
    quizStatus.value = 'active'
  })

  client.on('new-question', (data) => {
    quizSessionId.value = data.sessionId
    quizStatus.value = 'active'
    applyQuestion(data.question)
  })

  client.on('quiz-state', (data) => {
    quizSessionId.value = data.sessionId
    quizStatus.value = data.status
    participants.value = data.participants
    if (data.question) applyQuestion(data.question)
    if (data.status === 'completed') leaderboard.value = data.leaderboard || []
  })

  client.on('quiz-completed', (data) => {
    quizStatus.value = 'completed'
    leaderboard.value = data.leaderboard || []
  })

  client.on('room-update', (data) => {
    participants.value = data.participants
  })

  client.on('answer-submitted', (data) => {
    recentSubmissions.value.unshift(data)
  })

  client.on('error', (data) => {
    notifyError({ message: data?.message }, 'Quiz error')
  })
}

onMounted(async () => {
  await loadQuiz()
  if (!roomId.value) {
    connectionError.value = 'Missing room. Open this quiz from the room page.'
    return
  }

  try {
    socket.value = await initSocket()
    connected.value = true
    bindSocket(socket.value)
  } catch (error) {
    connectionError.value = 'Live connection failed. Refresh and try again.'
    notifyError(error, 'Could not connect')
  }
})

onUnmounted(() => {
  socket.value?.emit('leave-room', roomId.value)
})
</script>
