import { getUserBySession } from '~/server/utils/store'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sessionId = query.sessionId

  if (!sessionId) {
    throw createError({
      statusCode: 401,
      message: 'Session ID required'
    })
  }

  const user = getUserBySession(sessionId)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid session'
    })
  }

  return {
    success: true,
    user: { ...user, password: undefined }
  }
})
