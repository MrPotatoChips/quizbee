import { createQuiz, getUserBySession, getRoom } from '~/server/utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sessionId, roomId, title, description, questions } = body

  if (!sessionId) {
    throw createError({ statusCode: 401, message: 'Session required' })
  }

  const user = getUserBySession(sessionId)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid session' })
  }

  const room = getRoom(roomId)
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' })
  }

  if (room.adminId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only room admin can create quizzes' })
  }

  if (!title || !questions || questions.length === 0) {
    throw createError({ statusCode: 400, message: 'Title and questions are required' })
  }

  const quiz = createQuiz({ title, description, questions }, roomId)
  
  return {
    success: true,
    quiz
  }
})
