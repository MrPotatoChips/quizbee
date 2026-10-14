export const useAuth = () => {
  const sessionId = useCookie('quizbee_session', {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  })
  const storedUser = useCookie('quizbee_user', {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  })
  const user = useState('user', () => storedUser.value || null)

  const persist = (nextUser, nextSessionId) => {
    user.value = nextUser
    sessionId.value = nextSessionId
    storedUser.value = nextUser
  }

  const login = async (username, password) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })

      if (response.success) {
        persist(response.user, response.sessionId)
        return { success: true }
      }

      return { success: false, error: 'Login failed' }
    } catch (error) {
      return { success: false, error: error.data?.message || 'Login failed' }
    }
  }

  const register = async (username, password, role = 'user') => {
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { username, password, role }
      })

      if (response.success) {
        persist(response.user, response.sessionId)
        return { success: true }
      }

      return { success: false, error: 'Registration failed' }
    } catch (error) {
      return { success: false, error: error.data?.message || 'Registration failed' }
    }
  }

  const logout = () => {
    persist(null, null)
  }

  const checkAuth = async () => {
    if (!sessionId.value) {
      return false
    }

    try {
      const response = await $fetch('/api/auth/me', {
        params: { sessionId: sessionId.value }
      })

      if (response.success) {
        persist(response.user, sessionId.value)
        return true
      }
    } catch {
      logout()
    }

    return false
  }

  const homeFor = (account = user.value) => (account?.role === 'admin' ? '/admin' : '/user')

  return {
    user,
    sessionId,
    login,
    register,
    logout,
    checkAuth,
    homeFor
  }
}
