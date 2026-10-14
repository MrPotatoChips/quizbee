<template>
  <div class="min-h-screen bg-elevated">
    <AppHeader :title="roomName" back-to="/user" back-label="Invites" />

    <main class="mx-auto max-w-2xl px-4 py-8">
      <UAlert v-if="connectionError" class="mb-4" color="error" variant="soft" :title="connectionError" />

      <UCard v-if="quizStatus === 'waiting'">
        <div class="py-12 text-center">
          <UIcon name="i-lucide-hourglass" class="mx-auto size-12 text-muted" />
          <h2 class="mt-4 text-2xl font-semibold">Waiting for the quiz to start</h2>
          <p class="mt-2 text-muted">Stay on this page. The first question appears when the host starts.</p>
          <UBadge class="mt-4" color="info" variant="soft" size="lg">
            {{ participants }} participant{{ participants === 1 ? '' : 's' }} connected
          </UBadge>
        </div>
      </UCard>

      <UCard v-else-if="quizStatus === 'active'">
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <h3 class="font-semibold">Question {{ currentQuestionNumber }} of {{ totalQuestions }}</h3>
            <p class="text-2xl font-bold" :class="timeRemaining <= 5 ? 'text-error' : 'text-primary'">
              {{ timeRemaining }}s
            </p>
          </div>
        </template>

        <div v-if="currentQuestion" class="space-y-6">
          <p class="text-xl font-medium">{{ currentQuestion.question }}</p>

          <div v-if="!answered" class="space-y-3">
            <UButton
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              block
              size="lg"
              class="justify-start"
              :variant="selectedAnswer === option ? 'solid' : 'outline'"
              :color="selectedAnswer === option ? 'primary' : 'neutral'"
              @click="selectAnswer(option)"
            >
              {{ option }}
            </UButton>

            <UButton
              size="lg"
              block
              icon="i-lucide-send"
              :disabled="!selectedAnswer || submitting"
              :loading="submitting"
              @click="submitAnswer()"
            >
              Submit Answer
            </UButton>
          </div>

          <div v-else class="space-y-4">
            <div class="rounded-lg p-4" :class="answerResult?.isCorrect ? 'bg-success/10' : 'bg-error/10'">
              <p class="font-semibold">
                {{ answerResult?.isCorrect ? 'Correct!' : answerResult ? 'Incorrect' : 'Answer locked in' }}
              </p>
              <p v-if="answerResult?.correctAnswer" class="mt-1 text-sm">
                Correct answer: <strong>{{ answerResult.correctAnswer }}</strong>
              </p>
            </div>
            <p class="text-center text-muted">Waiting for the next question...</p>
          </div>
        </div>
      </UCard>

      <UCard v-else>
        <template #header>
          <h2 class="text-center text-2xl font-semibold">Quiz completed</h2>
        </template>

        <div class="space-y-3">
          <p v-if="leaderboard.length === 0" class="py-6 text-center text-muted">No scores were recorded.</p>
          <div
            v-for="(entry, index) in leaderboard"
            :key="entry.userId"
            class="flex items-center justify-between rounded-lg border px-4 py-3"
            :class="entry.userId === user?.id ? 'border-primary ring-2 ring-primary/40' : 'border-default'"
          >
            <div>
              <p class="font-semibold">
                {{ index + 1 }}. {{ entry.username }}
                <span v-if="entry.userId === user?.id" class="text-primary">(You)</span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold">{{ entry.score }}</p>
              <p class="text-xs text-muted">points</p>
            </div>
          </div>

          <UButton to="/user" block size="lg" class="mt-4" icon="i-lucide-arrow-left">
            Back to Dashboard
          </UButton>
        </div>
      </UCard>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-user']
})

const route = useRoute()
const { user, sessionId } = useAuth()
const { initSocket } = useSocket()
const { notifyError } = useFeedback()

const roomId = computed(() => String(route.params.id))
const roomName = ref('Quiz Room')

const loadRoomName = async () => {
  try {
    const response = await $fetch('/api/rooms/invites', {
      params: { sessionId: sessionId.value }
    })
    const match = response.rooms.find(room => room.id === roomId.value)
    if (match?.name) roomName.value = match.name
  } catch (error) {
    notifyError(error, 'Could not load this room')
  }
}

const quizStatus = ref('waiting')
const participants = ref(0)
const currentQuestion = ref(null)
const currentQuestionNumber = ref(0)
const totalQuestions = ref(0)
const timeRemaining = ref(30)
const selectedAnswer = ref(null)
const answered = ref(false)
const answerResult = ref(null)
const submitting = ref(false)
const leaderboard = ref([])
const quizSessionId = ref(null)
const questionStartTime = ref(null)
const connectionError = ref('')

const socket = ref(null)
let timerInterval = null

const selectAnswer = (option) => {
  if (!answered.value) {
    selectedAnswer.value = option
  }
}

const submitAnswer = (forcedAnswer = undefined) => {
  if (answered.value || !socket.value || !currentQuestion.value) return

  const answer = forcedAnswer === undefined ? selectedAnswer.value : forcedAnswer
  if (!answer && forcedAnswer === undefined) return

  submitting.value = true
  answered.value = true

  const timeTaken = questionStartTime.value
    ? Math.floor((Date.now() - questionStartTime.value) / 1000)
    : 0

  socket.value.emit('submit-answer', {
    sessionId: quizSessionId.value,
    questionIndex: currentQuestion.value.index,
    answer: answer || '',
    timeTaken
  })
}

const clearTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resetQuestion = () => {
  selectedAnswer.value = null
  answered.value = false
  answerResult.value = null
  submitting.value = false
  questionStartTime.value = Date.now()
  clearTimer()
}

const startTimer = (seconds) => {
  timeRemaining.value = seconds || 30
  clearTimer()

  timerInterval = setInterval(() => {
    timeRemaining.value -= 1
    if (timeRemaining.value <= 0) {
      clearTimer()
      timeRemaining.value = 0
      if (!answered.value) {
        submitAnswer(selectedAnswer.value || '')
      }
    }
  }, 1000)
}

const showQuestion = (data) => {
  resetQuestion()
  currentQuestion.value = data.question
  currentQuestionNumber.value = data.questionNumber
  totalQuestions.value = data.totalQuestions
  quizSessionId.value = data.sessionId
  quizStatus.value = 'active'
  startTimer(data.question?.timeLimit || 30)
}

onMounted(async () => {
  await loadRoomName()

  try {
    socket.value = await initSocket()
  } catch (error) {
    connectionError.value = 'Could not connect to the live quiz. Refresh and try again.'
    notifyError(error, 'Connection failed')
    return
  }

  const client = socket.value
  client.emit('join-room', { roomId: roomId.value, userId: user.value?.id })

  client.on('quiz-started', (data) => {
    quizSessionId.value = data.sessionId
    totalQuestions.value = data.totalQuestions
    quizStatus.value = 'active'
  })

  client.on('new-question', showQuestion)

  client.on('quiz-state', (data) => {
    participants.value = data.participants
    totalQuestions.value = data.totalQuestions
    quizSessionId.value = data.sessionId

    if (data.status === 'completed') {
      quizStatus.value = 'completed'
      leaderboard.value = data.leaderboard || []
      clearTimer()
      return
    }

    if (data.status === 'active' && data.question) {
      showQuestion(data)
    }
  })

  client.on('answer-result', (data) => {
    answerResult.value = data
    submitting.value = false
  })

  client.on('quiz-completed', (data) => {
    quizStatus.value = 'completed'
    leaderboard.value = data.leaderboard || []
    clearTimer()
  })

  client.on('room-update', (data) => {
    participants.value = data.participants
  })

  client.on('error', (data) => {
    submitting.value = false
    notifyError({ message: data?.message }, 'Quiz error')
  })
})

onUnmounted(() => {
  clearTimer()
  socket.value?.emit('leave-room', roomId.value)
})
</script>
