export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, checkAuth } = useAuth()
  
  // Check if user is authenticated
  if (!user.value) {
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      return navigateTo('/')
    }
  }
  
  // Check if user is admin
  if (user.value?.role !== 'admin') {
    return navigateTo('/user')
  }
})
