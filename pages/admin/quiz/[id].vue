<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div>
            <UButton @click="router.push('/admin')" icon="i-heroicons-arrow-left" variant="ghost">
              Back
            </UButton>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Quiz Control Panel</h1>
          <div class="w-20"></div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div v-if="!quiz" class="text-center py-12">
        <p class="text-gray-500">Loading quiz...</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Quiz Control -->
        <div class="lg:col-span-2 space-y-6">
          <UCard>
            <template #header>
              <div>
                <h2 class="text-xl font-semibold">{{ quiz.title }}</h2>
                <p class="text-gray-600">{{ quiz.description }}</p>
              </div>
            </template>

            <div class="space-y-4">
              <!-- Status -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Status:</span>
                <UBadge :color="quizStatus === 'waiting' ? 'gray' : quizStatus === 'active' ? 'green' : 'blue'">
                  {{ quizStatus }}
                </UBadge>
              </div>

              <!-- Progress -->
              <div>
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-gray-500">Progress:</span>
                  <span class="font-medium">{{ currentQuestionIndex }} / {{ quiz.questions.length }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-blue-600 h-2 rounded-full transition-all"
                    :style="{ width: `${(currentQuestionIndex / quiz.questions.length) * 100}%` }"
                  ></div>
                </div>
              </div>

              <!-- Current Question -->
              <div v-if="currentQuestion" class="border rounded-lg p-4 bg-gray-50">
                <h3 class="font-medium mb-3">Question {{ currentQuestionIndex + 1 }}</h3>
                <p class="text-lg mb-4">{{ currentQuestion.question }}</p>
                <div class="space-y-2">
                  <div 
                    v-for="(option, idx) in currentQuestion.options" 
                    :key="idx"
                    class="p-3 rounded border"
                    :class="option === currentQuestion.correctAnswer ? 'bg-green-50 border-green-500' : 'bg-white'"
                  >
                    {{ option }}
                    <span v-if="option === currentQuestion.correctAnswer" class="text-green-600 ml-2">✓ Correct</span>
                  </div>
                </div>
              </div>

              <!-- Controls -->
              <div class="flex gap-2">
                <UButton 
                  v-if="quizStatus === 'waiting'"
                  @click="startQuiz"
                  color="green"
                  size="lg"
                  block
                >
                  Start Quiz
                </UButton>
                
                <UButton 
                  v-if="quizStatus === 'active' && currentQuestionIndex < quiz.questions.length"
                  @click="nextQuestion"
                  size="lg"
                  block
                >
                  {{ currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz' }}
                </UButton>

                <UButton
                  v-if="quizStatus === 'completed'"
                  @click="router.push('/admin')"
                  size="lg"
                  block
                >
                  Back to Dashboard
                </UButton>
              </div>
            </div>
          </UCard>

          <!-- Leaderboard -->
          <UCard v-if="quizStatus === 'completed'">
            <template #header>
              <h3 class="font-semibold">🏆 Final Leaderboard</h3>
            </template>
            <div v-if="leaderboard.length === 0" class="text-center py-4 text-gray-500">
              No participants
            </div>
            <div v-else class="space-y-2">
              <div 
                v-for="(entry, idx) in leaderboard" 
                :key="entry.userId"
                class="flex items-center justify-between p-3 rounded"
                :class="idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-100' : idx === 2 ? 'bg-orange-50' : 'bg-white border'"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl font-bold text-gray-400">{{ idx + 1 }}</span>
                  <span class="font-medium">{{ entry.username }}</span>
                </div>
                <span class="text-lg font-bold">{{ entry.score }}</span>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Participants & Activity -->
        <div class="space-y-6">
          <UCard>
            <template #header>
              <h3 class="font-semibold">Participants ({{ participants }})</h3>
            </template>
            <div v-if="participants === 0" class="text-center py-4 text-gray-500">
              Waiting for participants...
            </div>
            <div v-else class="text-center py-2">
              <p class="text-3xl font-bold text-blue-600">{{ participants }}</p>
              <p class="text-sm text-gray-500">Connected</p>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="font-semibold">Recent Submissions</h3>
            </template>
            <div v-if="recentSubmissions.length === 0" class="text-center py-4 text-gray-500">
              No submissions yet
            </div>
            <div v-else class="space-y-2 max-h-96 overflow-y-auto">
              <div 
                v-for="(submission, idx) in recentSubmissions.slice(0, 10)" 
                :key="idx"
                class="p-2 rounded text-sm"
                :class="submission.isCorrect ? 'bg-green-50' : 'bg-red-50'"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ submission.username }}</span>
                  <span>{{ submission.isCorrect ? '✓' : '✗' }}</span>
                </div>
                <div class="text-xs text-gray-500">Q{{ submission.questionIndex + 1 }}</div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-admin']
})

const route = useRoute()
const router = useRouter()
const { sessionId } = useAuth()
const { getSocket } = useSocket()

const quizId = route.params.id
const roomId = route.query.roomId

const quiz = ref(null)
const quizSessionId = ref(null)
const quizStatus = ref('waiting')
const currentQuestionIndex = ref(0)
const currentQuestion = ref(null)
const participants = ref(0)
const leaderboard = ref([])
const recentSubmissions = ref([])

const socket = ref(null)

const loadQuiz = async () => {
  try {
    const response = await $fetch('/api/quizzes/by-room', {
      params: { sessionId: sessionId.value, roomId }
    })
    quiz.value = response.quizzes.find(q => q.id === quizId)
    if (quiz.value && quiz.value.questions.length > 0) {
      currentQuestion.value = quiz.value.questions[0]
    }
  } catch (error) {
    console.error('Failed to load quiz:', error)
  }
}

const startQuiz = () => {
  if (!socket.value) return
  
  socket.value.emit('start-quiz', { quizId, roomId })
}

const nextQuestion = () => {
  if (!socket.value) return
  
  const nextIndex = currentQuestionIndex.value + 1
  socket.value.emit('next-question', { 
    sessionId: quizSessionId.value,
    questionIndex: nextIndex
  })
}

onMounted(async () => {
  await loadQuiz()
  
  socket.value = getSocket()
  
  // Join room as admin
  socket.value.emit('join-room', { roomId, userId: 'admin' })
  
  // Listen for quiz events
  socket.value.on('quiz-started', (data) => {
    quizSessionId.value = data.sessionId
    quizStatus.value = 'active'
    currentQuestionIndex.value = 0
    currentQuestion.value = quiz.value.questions[0]
  })
  
  socket.value.on('new-question', (data) => {
    currentQuestionIndex.value = data.question.index
    currentQuestion.value = quiz.value.questions[data.question.index]
  })
  
  socket.value.on('quiz-completed', (data) => {
    quizStatus.value = 'completed'
    leaderboard.value = data.leaderboard
  })
  
  socket.value.on('room-update', (data) => {
    participants.value = data.participants
  })
  
  socket.value.on('answer-submitted', (data) => {
    recentSubmissions.value.unshift(data)
  })
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.emit('leave-room', roomId)
  }
})
</script>
