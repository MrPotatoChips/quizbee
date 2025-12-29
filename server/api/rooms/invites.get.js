import { getRoomsByUser, getUserBySession } from '~/server/utils/store'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sessionId = query.sessionId

  if (!sessionId) {
    throw createError({ statusCode: 401, message: 'Session required' })
  }

  const user = getUserBySession(sessionId)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid session' })
  }

  const rooms = getRoomsByUser(user.id)
  
  return {
    success: true,
    rooms: rooms.map(room => ({
      ...room,
      invitedUsers: Array.from(room.invitedUsers)
    }))
  }
})
