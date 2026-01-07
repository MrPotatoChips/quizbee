export const useAuth = () => {
  const user = useState('user', () => null)
  const sessionId = useState('sessionId', () => null)

  const login = async (username, password) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      
      if (response.success) {
        user.value = response.user
        sessionId.value = response.sessionId
        
        // Store in localStorage
        if (process.client) {
          localStorage.setItem('sessionId', response.sessionId)
          localStorage.setItem('user', JSON.stringify(response.user))
        }
        
        return { success: true }
      }
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
        user.value = response.user
        sessionId.value = response.sessionId
        
        // Store in localStorage
        if (process.client) {
          localStorage.setItem('sessionId', response.sessionId)
          localStorage.setItem('user', JSON.stringify(response.user))
        }
        
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: error.data?.message || 'Registration failed' }
    }
  }

  const logout = () => {
    user.value = null
    sessionId.value = null
    
    if (process.client) {
      localStorage.removeItem('sessionId')
      localStorage.removeItem('user')
    }
  }

  const checkAuth = async () => {
    if (process.client) {
      const storedSessionId = localStorage.getItem('sessionId')
      const storedUser = localStorage.getItem('user')
      
      if (storedSessionId && storedUser) {
        try {
          const response = await $fetch('/api/auth/me', {
            params: { sessionId: storedSessionId }
          })
          
          if (response.success) {
            user.value = response.user
            sessionId.value = storedSessionId
            return true
          }
        } catch (error) {
          logout()
        }
      }
    }
    return false
  }

  return {
    user,
    sessionId,
    login,
    register,
    logout,
    checkAuth
  }
}
