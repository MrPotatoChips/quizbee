<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <UButton @click="router.push('/admin')" icon="i-heroicons-arrow-left" variant="ghost">
              Back
            </UButton>
            <h1 class="text-2xl font-bold text-gray-900">Room Management</h1>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">{{ user?.username }}</span>
            <UButton @click="handleLogout" color="red" variant="soft">Logout</UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold">My Rooms</h2>
        <UButton @click="showRoomModal = true" icon="i-heroicons-plus">Create Room</UButton>
      </div>

      <div v-if="loadingRooms" class="text-center py-8">
        <p class="text-gray-500">Loading rooms...</p>
      </div>
      <div v-else-if="rooms.length === 0" class="text-center py-8">
        <UCard>
          <p class="text-gray-500">No rooms created yet</p>
        </UCard>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard v-for="room in rooms" :key="room.id" class="cursor-pointer hover:shadow-lg transition-shadow">
          <div class="space-y-3">
            <div>
              <h3 class="font-semibold text-lg">{{ room.name }}</h3>
              <p class="text-sm text-gray-600">{{ room.description }}</p>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <span>👥 {{ room.invitedUsers.length }} invited</span>
            </div>
            <div class="flex gap-2">
              <UButton @click="manageRoom(room)" size="sm" block>Manage</UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Create Room Modal -->
    <UModal v-model="showRoomModal">
      <UCard>
        <template #header>
          <h3 class="font-semibold">Create New Room</h3>
        </template>
        <form @submit.prevent="handleCreateRoom" class="space-y-4">
          <UFormGroup label="Room Name" required>
            <UInput v-model="newRoom.name" placeholder="Enter room name" />
          </UFormGroup>
          <UFormGroup label="Description">
            <UTextarea v-model="newRoom.description" placeholder="Enter description" />
          </UFormGroup>
          <div class="flex gap-2">
            <UButton type="submit" :loading="submitting">Create</UButton>
            <UButton @click="showRoomModal = false" color="gray" variant="ghost">Cancel</UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-admin']
})

const { user, sessionId, logout } = useAuth()
const router = useRouter()

const rooms = ref([])
const loadingRooms = ref(false)
const submitting = ref(false)
const showRoomModal = ref(false)

const newRoom = ref({
  name: '',
  description: ''
})

const handleLogout = () => {
  logout()
  router.push('/')
}

const loadRooms = async () => {
  loadingRooms.value = true
  try {
    const response = await $fetch('/api/rooms/my-rooms', {
      params: { sessionId: sessionId.value }
    })
    rooms.value = response.rooms
  } catch (error) {
    console.error('Failed to load rooms:', error)
  }
  loadingRooms.value = false
}

const handleCreateRoom = async () => {
  submitting.value = true
  try {
    await $fetch('/api/rooms/create', {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        ...newRoom.value
      }
    })
    showRoomModal.value = false
    newRoom.value = { name: '', description: '' }
    await loadRooms()
  } catch (error) {
    console.error('Failed to create room:', error)
  }
  submitting.value = false
}

const manageRoom = (room) => {
  router.push(`/admin/rooms/${room.id}`)
}

onMounted(async () => {
  await loadRooms()
})
</script>
