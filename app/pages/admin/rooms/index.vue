<template>
  <div class="min-h-screen bg-elevated">
    <AppHeader title="Room Management" back-to="/admin" />

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">My Rooms</h2>
          <p class="text-sm text-muted">Each room can hold invites and one or more quizzes.</p>
        </div>
        <UButton icon="i-lucide-plus" @click="showRoomModal = true">Create Room</UButton>
      </div>

      <div v-if="loadingRooms" class="flex items-center justify-center gap-2 py-16 text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
        Loading rooms...
      </div>
      <UCard v-else-if="rooms.length === 0">
        <div class="py-10 text-center">
          <p class="font-medium">No rooms yet</p>
          <p class="mt-1 text-sm text-muted">Create a room, then invite players and add a quiz.</p>
          <UButton class="mt-4" icon="i-lucide-plus" @click="showRoomModal = true">Create Room</UButton>
        </div>
      </UCard>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <UCard v-for="room in rooms" :key="room.id">
          <div class="space-y-3">
            <div>
              <h3 class="text-lg font-semibold">{{ room.name }}</h3>
              <p class="text-sm text-muted">{{ room.description || 'No description' }}</p>
            </div>
            <UBadge color="neutral" variant="soft" icon="i-lucide-users">
              {{ room.invitedUsers.length }} invited
            </UBadge>
            <UButton :to="`/admin/rooms/${room.id}`" block icon="i-lucide-settings">Manage</UButton>
          </div>
        </UCard>
      </div>
    </main>

    <UModal v-model:open="showRoomModal" title="Create New Room" description="Players only see a room after you invite them.">
      <template #body>
        <UForm id="create-room-form" :state="newRoom" class="space-y-4" @submit="handleCreateRoom">
          <UFormField label="Room Name" name="name" required>
            <UInput v-model="newRoom.name" class="w-full" placeholder="Friday trivia" />
          </UFormField>
          <UFormField label="Description" name="description">
            <UTextarea v-model="newRoom.description" class="w-full" placeholder="What is this quiz about?" :rows="3" />
          </UFormField>
        </UForm>
      </template>
      <template #footer>
        <div class="flex gap-2">
          <UButton type="submit" form="create-room-form" :loading="submitting">Create</UButton>
          <UButton type="button" color="neutral" variant="ghost" @click="showRoomModal = false">Cancel</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-admin']
})

const { sessionId } = useAuth()
const { notifyError, notifySuccess } = useFeedback()

const rooms = ref([])
const loadingRooms = ref(false)
const submitting = ref(false)
const showRoomModal = ref(false)

const newRoom = reactive({
  name: '',
  description: ''
})

const loadRooms = async () => {
  loadingRooms.value = true
  try {
    const response = await $fetch('/api/rooms/my-rooms', {
      params: { sessionId: sessionId.value }
    })
    rooms.value = response.rooms
  } catch (error) {
    notifyError(error, 'Could not load rooms')
  } finally {
    loadingRooms.value = false
  }
}

const handleCreateRoom = async () => {
  if (!newRoom.name.trim()) {
    notifyError({ message: 'Give the room a name first.' }, 'Missing room name')
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/rooms/create', {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        name: newRoom.name.trim(),
        description: newRoom.description.trim()
      }
    })
    showRoomModal.value = false
    newRoom.name = ''
    newRoom.description = ''
    notifySuccess('Room created')
    await loadRooms()
  } catch (error) {
    notifyError(error, 'Could not create room')
  } finally {
    submitting.value = false
  }
}

onMounted(loadRooms)
</script>
