<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">🐝 Quizbee Admin</h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">{{ user?.username }}</span>
            <UButton @click="handleLogout" color="red" variant="soft">Logout</UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Welcome to Admin Dashboard</h2>
        <p class="text-gray-600">Manage users, rooms, and quizzes from here.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- User Management Card -->
        <UCard class="cursor-pointer hover:shadow-lg transition-shadow" @click="router.push('/admin/users')">
          <div class="space-y-4">
            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
              <span class="text-3xl">👥</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold">User Management</h3>
              <p class="text-sm text-gray-600 mt-1">Register and manage users</p>
            </div>
            <UButton block variant="soft">Manage Users</UButton>
          </div>
        </UCard>

        <!-- Room Management Card -->
        <UCard class="cursor-pointer hover:shadow-lg transition-shadow" @click="router.push('/admin/rooms')">
          <div class="space-y-4">
            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <span class="text-3xl">🏠</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold">Room Management</h3>
              <p class="text-sm text-gray-600 mt-1">Create and manage quiz rooms</p>
            </div>
            <UButton block variant="soft" color="green">Manage Rooms</UButton>
          </div>
        </UCard>

        <!-- Quick Stats Card -->
        <UCard>
          <div class="space-y-4">
            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
              <span class="text-3xl">📊</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold">Quick Stats</h3>
              <p class="text-sm text-gray-600 mt-1">Overview of your platform</p>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total Users:</span>
                <span class="font-medium">{{ stats.users }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Total Rooms:</span>
                <span class="font-medium">{{ stats.rooms }}</span>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-admin']
})

const { user, sessionId, logout } = useAuth()
const router = useRouter()

const stats = ref({
  users: 0,
  rooms: 0
})

const handleLogout = () => {
  logout()
  router.push('/')
}

const loadStats = async () => {
  try {
    const [usersResponse, roomsResponse] = await Promise.all([
      $fetch('/api/users/list', {
        params: { sessionId: sessionId.value }
      }),
      $fetch('/api/rooms/my-rooms', {
        params: { sessionId: sessionId.value }
      })
    ])
    stats.value.users = usersResponse.users.length
    stats.value.rooms = roomsResponse.rooms.length
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

onMounted(async () => {
  await loadStats()
})
</script>
