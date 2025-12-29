import { getAllUsers, getUserBySession } from '~/server/utils/store'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sessionId = query.sessionId

  if (!sessionId) {
    throw createError({ statusCode: 401, message: 'Session required' })
  }

  const user = getUserBySession(sessionId)
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const users = getAllUsers()
  
  return {
    success: true,
    users
  }
})
