import { createUser, getUserByUsername, createSession } from '~/server/utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const { username, password, role } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required'
    })
  }

  // Check if user already exists
  const existingUser = getUserByUsername(username)
  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'Username already exists'
    })
  }

  // Create user
  const user = createUser({ username, password, role: role || 'user' })
  
  // Create session
  const sessionId = createSession(user.id)

  return {
    success: true,
    user,
    sessionId
  }
})
