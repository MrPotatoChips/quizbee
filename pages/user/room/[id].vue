<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <UButton @click="handleBack" icon="i-heroicons-arrow-left" variant="ghost">
            Back
          </UButton>
          <h1 class="text-2xl font-bold text-gray-900">{{ room?.name || 'Room' }}</h1>
          <div class="w-20"></div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- Waiting for quiz -->
      <div v-if="quizStatus === 'waiting'" class="max-w-2xl mx-auto">
        <UCard>
          <div class="text-center py-12">
            <div class="text-6xl mb-4">⏳</div>
            <h2 class="text-2xl font-semibold mb-2">Waiting for Quiz to Start</h2>
            <p class="text-gray-600 mb-4">The admin will start the quiz shortly</p>
            <UBadge color="blue" size="lg">{{ participants }} participants connected</UBadge>
          </div>
        </UCard>
      </div>

      <!-- Active quiz -->
      <div v-else-if="quizStatus === 'active'" class="max-w-2xl mx-auto">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-semibold">Question {{ currentQuestionNumber }} of {{ totalQuestions }}</h3>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-blue-600">{{ timeRemaining }}s</div>
              </div>
            </div>
          </template>

          <div v-if="currentQuestion" class="space-y-6">
            <div>
              <p class="text-xl font-medium mb-6">{{ currentQuestion.question }}</p>
            </div>

            <div v-if="!answered" class="space-y-3">
              <button
                v-for="(option, idx) in currentQuestion.options"
                :key="idx"
                @click="selectAnswer(option)"
                class="w-full p-4 text-left rounded-lg border-2 transition-all"
                :class="selectedAnswer === option 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'"
              >
                {{ option }}
              </button>
              
              <UButton 
                @click="submitAnswer"
                :disabled="!selectedAnswer || submitting"
                :loading="submitting"
                size="lg"
                block
              >
                Submit Answer
              </UButton>
            </div>

            <div v-else class="space-y-4">
              <div class="p-4 rounded-lg" :class="answerResult?.isCorrect ? 'bg-green-50' : 'bg-red-50'">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ answerResult?.isCorrect ? '✓' : '✗' }}</span>
                  <span class="font-semibold">
                    {{ answerResult?.isCorrect ? 'Correct!' : 'Incorrect' }}
                  </span>
                </div>
                <p class="text-sm">
                  Correct answer: <strong>{{ answerResult?.correctAnswer }}</strong>
                </p>
              </div>
              
              <div class="text-center py-4">
                <p class="text-gray-600">Waiting for next question...</p>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Quiz completed -->
      <div v-else-if="quizStatus === 'completed'" class="max-w-2xl mx-auto">
        <UCard>
          <template #header>
            <div class="text-center">
              <h2 class="text-2xl font-semibold">🏆 Quiz Completed!</h2>
            </div>
          </template>

          <div class="space-y-6">
            <div class="text-center">
              <p class="text-gray-600 mb-4">Final Results</p>
            </div>

            <!-- Leaderboard -->
            <div class="space-y-2">
              <div 
                v-for="(entry, idx) in leaderboard" 
                :key="entry.userId"
                class="flex items-center justify-between p-4 rounded-lg"
                :class="[
                  idx === 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 
                  idx === 1 ? 'bg-gray-100 border-2 border-gray-400' : 
                  idx === 2 ? 'bg-orange-100 border-2 border-orange-400' : 
                  'bg-white border border-gray-200',
                  entry.userId === user?.id ? 'ring-2 ring-blue-500' : ''
                ]"
              >
                <div class="flex items-center gap-4">
                  <span class="text-2xl font-bold text-gray-500">
                    {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}` }}
                  </span>
                  <div>
                    <p class="font-semibold">
                      {{ entry.username }}
                      <span v-if="entry.userId === user?.id" class="text-blue-600">(You)</span>
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-bold">{{ entry.score }}</p>
                  <p class="text-xs text-gray-500">points</p>
                </div>
              </div>
            </div>

            <div class="pt-4">
              <UButton @click="handleBack" block size="lg">Back to Dashboard</UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-user']
})

const route = useRoute()
const router = useRouter()
const { user, sessionId } = useAuth()
const { getSocket } = useSocket()

const roomId = route.params.id

const room = ref(null)
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

const socket = ref(null)
let timerInterval = null

const handleBack = () => {
  if (socket.value) {
    socket.value.emit('leave-room', roomId)
  }
  router.push('/user')
}

const selectAnswer = (option) => {
  if (!answered.value) {
    selectedAnswer.value = option
  }
}

const submitAnswer = async () => {
  if (!selectedAnswer.value || submitting.value || !socket.value) return
  
  submitting.value = true
  answered.value = true
  
  const timeTaken = questionStartTime.value 
    ? Math.floor((Date.now() - questionStartTime.value) / 1000)
    : 0
  
  socket.value.emit('submit-answer', {
    sessionId: quizSessionId.value,
    questionIndex: currentQuestion.value.index,
    answer: selectedAnswer.value,
    timeTaken
  })
}

const resetQuestion = () => {
  selectedAnswer.value = null
  answered.value = false
  answerResult.value = null
  submitting.value = false
  timeRemaining.value = 30
  questionStartTime.value = Date.now()
  
  if (timerInterval) {
    clearInterval(timerInterval)
  }
}

const startTimer = (seconds) => {
  timeRemaining.value = seconds
  
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  
  timerInterval = setInterval(() => {
    timeRemaining.value--
    if (timeRemaining.value <= 0) {
      clearInterval(timerInterval)
      if (!answered.value) {
        // Auto-submit when time runs out
        answered.value = true
      }
    }
  }, 1000)
}

onMounted(async () => {
  socket.value = getSocket()
  
  // Join room
  socket.value.emit('join-room', { roomId, userId: user.value.id })
  
  // Listen for events
  socket.value.on('quiz-started', (data) => {
    quizSessionId.value = data.sessionId
    quizStatus.value = 'active'
    totalQuestions.value = data.totalQuestions
  })
  
  socket.value.on('new-question', (data) => {
    resetQuestion()
    currentQuestion.value = data.question
    currentQuestionNumber.value = data.questionNumber
    totalQuestions.value = data.totalQuestions
    startTimer(data.question.timeLimit || 30)
  })
  
  socket.value.on('answer-result', (data) => {
    answerResult.value = data
    submitting.value = false
  })
  
  socket.value.on('quiz-completed', (data) => {
    quizStatus.value = 'completed'
    leaderboard.value = data.leaderboard
    if (timerInterval) {
      clearInterval(timerInterval)
    }
  })
  
  socket.value.on('room-update', (data) => {
    participants.value = data.participants
  })
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  if (socket.value) {
    socket.value.emit('leave-room', roomId)
  }
})
</script>
