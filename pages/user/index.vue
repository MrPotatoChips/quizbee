<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">🐝 Quizbee</h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">{{ user?.username }}</span>
            <UButton @click="handleLogout" color="red" variant="soft">Logout</UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-xl font-semibold mb-1">Room Invitations</h2>
          <p class="text-sm text-gray-500">Jump into live rooms and start scoring points fast.</p>
        </div>
        <div class="flex items-center gap-2">
          <UButton color="gray" variant="soft" icon="i-heroicons-arrow-path" @click="loadRooms">
            Refresh
          </UButton>
          <UBadge color="primary" variant="soft">{{ rooms.length }} invites</UBadge>
        </div>
        
        <div v-if="loadingRooms" class="text-center py-8">
          <p class="text-gray-500">Loading invitations...</p>
        </div>
        
        <div v-else-if="rooms.length === 0" class="text-center py-12">
          <UCard>
            <div class="py-8">
              <p class="text-gray-500 mb-2">No room invitations yet</p>
              <p class="text-sm text-gray-400">Ask an admin to invite you or refresh to check again.</p>
              <UButton class="mt-4" color="primary" variant="soft" @click="loadRooms">Check again</UButton>
            </div>
          </UCard>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard 
            v-for="room in rooms" 
            :key="room.id" 
            class="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div class="space-y-3">
              <div>
                <h3 class="font-semibold text-lg">{{ room.name }}</h3>
                <p class="text-sm text-gray-600">{{ room.description }}</p>
              </div>
              <UButton @click="joinRoom(room)" block>Join Room</UButton>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-user']
})

const { user, sessionId, logout } = useAuth()
const router = useRouter()

const rooms = ref([])
const loadingRooms = ref(false)

const handleLogout = () => {
  logout()
  router.push('/')
}

const loadRooms = async () => {
  loadingRooms.value = true
  try {
    const response = await $fetch('/api/rooms/invites', {
      params: { sessionId: sessionId.value }
    })
    rooms.value = response.rooms
  } catch (error) {
    console.error('Failed to load rooms:', error)
  }
  loadingRooms.value = false
}

const joinRoom = (room) => {
  router.push(`/user/room/${room.id}`)
}

onMounted(async () => {
  await loadRooms()
})
</script>
