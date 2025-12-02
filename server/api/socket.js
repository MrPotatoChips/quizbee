import { Server as SocketIOServer } from 'socket.io'

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

      socket.on('join-room', (roomId, user) => {
        socket.join(roomId)
        socket.user = user
        socket.roomId = roomId
        console.log(`User ${user.nickname} joined room ${roomId}`)
      })

      socket.on('leave-room', (roomId) => {
        socket.leave(roomId)
        console.log(`User left room ${roomId}`)
      })

      socket.on('submit-answer', (data) => {
        // Broadcast answer to admin
        io.to(data.roomId).emit('answer-submitted', data)
      })

      socket.on('new-question', (data) => {
        // Broadcast question to room
        io.to(data.roomId).emit('question-update', data.question)
      })

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
      })
    })
  }

  return { status: 'Socket.IO server initialized' }
})