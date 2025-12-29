import { getQuizzesByRoom, getUserBySession } from '~/server/utils/store'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { sessionId, roomId } = query

  if (!sessionId) {
    throw createError({ statusCode: 401, message: 'Session required' })
  }

  const user = getUserBySession(sessionId)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid session' })
  }

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'Room ID required' })
  }

  const quizzes = getQuizzesByRoom(roomId)
  
  return {
    success: true,
    quizzes
  }
})
