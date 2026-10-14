import { Server as SocketIOServer } from 'socket.io'
import {
  joinRoom,
  leaveRoom,
  getRoomParticipants,
  createQuizSession,
  getQuizSession,
  updateQuizSession,
  submitAnswer,
  getLeaderboard,
  getQuiz,
  getUserById,
  setActiveRoomSession,
  getActiveRoomSession,
  ensureQuizParticipant
} from '../utils/store'

function publicQuestion(question, index) {
  return {
    index,
    question: question.question,
    options: question.options,
    timeLimit: question.timeLimit || 30
  }
}

function emitQuizState(socket, roomId) {
  const session = getActiveRoomSession(roomId)
  if (!session) return

  const quiz = getQuiz(session.quizId)
  if (!quiz) return

  const questionIndex = Math.min(session.currentQuestionIndex, Math.max(quiz.questions.length - 1, 0))
  const question = quiz.questions[questionIndex]

  socket.emit('quiz-state', {
    status: session.status,
    sessionId: session.id,
    quizId: session.quizId,
    question: question ? publicQuestion(question, questionIndex) : null,
    questionNumber: questionIndex + 1,
    totalQuestions: quiz.questions.length,
    participants: getRoomParticipants(roomId).length,
    leaderboard: session.status === 'completed' ? getLeaderboard(session.id) : []
  })
}

let io

export default defineEventHandler((event) => {
  if (!io) {
    const httpServer = event.node.res.socket?.server
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      // Join room
      socket.on('join-room', (data) => {
        const { roomId, userId, observe } = data || {}
        if (!roomId) return

        socket.join(roomId)
        socket.userId = userId
        socket.roomId = roomId
        socket.observe = Boolean(observe)

        if (!observe && userId) {
          joinRoom(roomId, userId)
          const session = getActiveRoomSession(roomId)
          if (session && session.status === 'active') {
            ensureQuizParticipant(session.id, userId)
          }
        }

        const participants = getRoomParticipants(roomId)
        console.log(`User ${userId || 'observer'} joined room ${roomId}`)

        io.to(roomId).emit('room-update', {
          participants: participants.length,
          newUser: observe ? null : userId
        })

        emitQuizState(socket, roomId)
      })

      // Leave room
      socket.on('leave-room', (roomId) => {
        const targetRoom = roomId || socket.roomId
        if (!targetRoom) return

        if (socket.userId && !socket.observe) {
          leaveRoom(targetRoom, socket.userId)
        }

        socket.leave(targetRoom)
        const participants = getRoomParticipants(targetRoom)
        io.to(targetRoom).emit('room-update', {
          participants: participants.length,
          leftUser: socket.observe ? null : socket.userId
        })
      })

      // Start quiz session
      socket.on('start-quiz', async (data) => {
        const { quizId, roomId } = data
        
        const quiz = getQuiz(quizId)
        if (!quiz) {
          socket.emit('error', { message: 'Quiz not found' })
          return
        }

        if (!quiz.questions.length) {
          socket.emit('error', { message: 'Quiz has no questions' })
          return
        }

        const session = createQuizSession(quizId, roomId)
        
        // Initialize participants
        const participants = getRoomParticipants(roomId)
        participants.forEach(userId => {
          session.participants.set(userId, 0)
        })
        
        updateQuizSession(session.id, { 
          status: 'active',
          currentQuestionIndex: 0,
          startedAt: new Date().toISOString()
        })
        setActiveRoomSession(roomId, session.id)

        console.log(`Quiz ${quizId} started in room ${roomId}, session: ${session.id}`)
        
        // Broadcast quiz start and the first question together
        io.to(roomId).emit('quiz-started', {
          sessionId: session.id,
          quizId: quizId,
          totalQuestions: quiz.questions.length
        })

        io.to(roomId).emit('new-question', {
          sessionId: session.id,
          question: publicQuestion(quiz.questions[0], 0),
          questionNumber: 1,
          totalQuestions: quiz.questions.length
        })
      })

      // Next question
      socket.on('next-question', (data) => {
        const { sessionId, questionIndex } = data
        const session = getQuizSession(sessionId)
        
        if (!session) {
          socket.emit('error', { message: 'Session not found' })
          return
        }

        const quiz = getQuiz(session.quizId)
        if (!quiz) {
          socket.emit('error', { message: 'Quiz not found' })
          return
        }

        updateQuizSession(sessionId, { currentQuestionIndex: questionIndex })

        if (questionIndex >= quiz.questions.length) {
          // Quiz completed
          updateQuizSession(sessionId, { 
            status: 'completed',
            completedAt: new Date().toISOString()
          })
          
          const leaderboard = getLeaderboard(sessionId)
          
          console.log(`Quiz session ${sessionId} completed`)
          
          // Broadcast completion and leaderboard
          io.to(session.roomId).emit('quiz-completed', {
            sessionId,
            leaderboard
          })
        } else {
          const question = quiz.questions[questionIndex]

          console.log(`Broadcasting question ${questionIndex} for session ${sessionId}`)

          io.to(session.roomId).emit('new-question', {
            sessionId,
            question: publicQuestion(question, questionIndex),
            questionNumber: questionIndex + 1,
            totalQuestions: quiz.questions.length
          })
        }
      })

      // Submit answer
      socket.on('submit-answer', (data) => {
        const { sessionId, questionIndex, answer, timeTaken } = data
        const session = getQuizSession(sessionId)
        
        if (!session || !socket.userId) {
          socket.emit('error', { message: 'Invalid session or user' })
          return
        }

        const quiz = getQuiz(session.quizId)
        if (!quiz) {
          socket.emit('error', { message: 'Quiz not found' })
          return
        }

        const question = quiz.questions[questionIndex]
        if (!question) {
          socket.emit('error', { message: 'Question not found' })
          return
        }

        const alreadyAnswered = session.answers.get(socket.userId)?.has(questionIndex)
        if (alreadyAnswered) {
          return
        }

        ensureQuizParticipant(sessionId, socket.userId)
        const isCorrect = Boolean(answer) && answer === question.correctAnswer

        submitAnswer(sessionId, socket.userId, questionIndex, answer, isCorrect, timeTaken)

        console.log(`User ${socket.userId} submitted answer for question ${questionIndex}: ${isCorrect ? 'correct' : 'incorrect'}`)

        // Send feedback to user
        socket.emit('answer-result', {
          questionIndex,
          isCorrect,
          correctAnswer: question.correctAnswer
        })

        // Notify admin about submission
        const user = getUserById(socket.userId)
        io.to(session.roomId).emit('answer-submitted', {
          userId: socket.userId,
          username: user?.username,
          questionIndex,
          isCorrect
        })
      })

      // Get current leaderboard
      socket.on('get-leaderboard', (data) => {
        const { sessionId } = data
        const leaderboard = getLeaderboard(sessionId)
        
        socket.emit('leaderboard-update', {
          sessionId,
          leaderboard
        })
      })

      socket.on('disconnect', () => {
        if (socket.userId && socket.roomId && !socket.observe) {
          leaveRoom(socket.roomId, socket.userId)
          const participants = getRoomParticipants(socket.roomId)

          io.to(socket.roomId).emit('room-update', {
            participants: participants.length,
            leftUser: socket.userId
          })
        }
        console.log('User disconnected:', socket.id)
      })
    })
  }

  return { status: 'Socket.IO server initialized' }
})