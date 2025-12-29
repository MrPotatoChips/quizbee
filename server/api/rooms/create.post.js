import { createRoom, getUserBySession } from '~/server/utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sessionId, name, description } = body

  if (!sessionId) {
    throw createError({ statusCode: 401, message: 'Session required' })
  }

  const user = getUserBySession(sessionId)
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  if (!name) {
    throw createError({ statusCode: 400, message: 'Room name required' })
  }

  const room = createRoom({ name, description }, user.id)
  
  return {
    success: true,
    room: {
      ...room,
      invitedUsers: Array.from(room.invitedUsers)
    }
  }
})
