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
  getUserById
} from '~/server/utils/store'

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
        const { roomId, userId } = data
        socket.join(roomId)
        socket.userId = userId
        socket.roomId = roomId
        
        joinRoom(roomId, userId)
        const participants = getRoomParticipants(roomId)
        
        console.log(`User ${userId} joined room ${roomId}`)
        
        // Notify room of new participant
        io.to(roomId).emit('room-update', {
          participants: participants.length,
          newUser: userId
        })
      })

      // Leave room
      socket.on('leave-room', (roomId) => {
        if (socket.userId) {
          leaveRoom(roomId, socket.userId)
          const participants = getRoomParticipants(roomId)
          
          socket.leave(roomId)
          console.log(`User ${socket.userId} left room ${roomId}`)
          
          // Notify room
          io.to(roomId).emit('room-update', {
            participants: participants.length,
            leftUser: socket.userId
          })
        }
      })

      // Start quiz session
      socket.on('start-quiz', async (data) => {
        const { quizId, roomId } = data
        
        const quiz = getQuiz(quizId)
        if (!quiz) {
          socket.emit('error', { message: 'Quiz not found' })
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
          startedAt: new Date().toISOString()
        })

        console.log(`Quiz ${quizId} started in room ${roomId}, session: ${session.id}`)
        
        // Broadcast quiz start to all participants
        io.to(roomId).emit('quiz-started', {
          sessionId: session.id,
          quizId: quizId,
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
          
          // Send question without correct answer to participants
          const questionForParticipants = {
            index: questionIndex,
            question: question.question,
            options: question.options,
            timeLimit: question.timeLimit || 30
          }
          
          console.log(`Broadcasting question ${questionIndex} for session ${sessionId}`)
          
          io.to(session.roomId).emit('new-question', {
            sessionId,
            question: questionForParticipants,
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
        const isCorrect = answer === question.correctAnswer

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
        if (socket.userId && socket.roomId) {
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