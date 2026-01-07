import { inviteUserToRoom, getUserBySession, getRoom } from '~/server/utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sessionId, roomId, userId } = body

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
    throw createError({ statusCode: 403, message: 'Only room admin can invite users' })
  }

  const success = inviteUserToRoom(roomId, userId)
  
  return {
    success,
    message: success ? 'User invited successfully' : 'Failed to invite user'
  }
})
