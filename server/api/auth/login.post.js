import { getUserByUsername, createSession } from '~/server/utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const { username, password } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required'
    })
  }

  // Find user
  const user = getUserByUsername(username)
  // NOTE: In production, use secure password comparison (e.g., bcrypt.compare)
  if (!user || user.password !== password) {
    throw createError({
      statusCode: 401,
      message: 'Invalid credentials'
    })
  }

  // Create session
  const sessionId = createSession(user.id)

  return {
    success: true,
    user: { ...user, password: undefined },
    sessionId
  }
})
