<template>
  <div class="min-h-screen bg-elevated">
    <AppHeader title="Quizbee" />

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-xl font-semibold">Room Invitations</h2>
          <p class="text-sm text-muted">Open a room and wait for the host to start the quiz.</p>
        </div>
        <div class="flex items-center gap-2">
          <UButton color="neutral" variant="soft" icon="i-lucide-refresh-cw" :loading="loadingRooms" @click="loadRooms">
            Refresh
          </UButton>
          <UBadge color="primary" variant="soft">{{ rooms.length }} invite{{ rooms.length === 1 ? '' : 's' }}</UBadge>
        </div>
      </div>

      <div v-if="loadingRooms" class="flex items-center justify-center gap-2 py-16 text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
        Loading invitations...
      </div>

      <UCard v-else-if="rooms.length === 0">
        <div class="py-10 text-center">
          <UIcon name="i-lucide-inbox" class="mx-auto size-10 text-muted" />
          <p class="mt-3 font-medium">No room invitations yet</p>
          <p class="mt-1 text-sm text-muted">Ask an admin to invite you, then refresh this page.</p>
          <UButton class="mt-4" variant="soft" icon="i-lucide-refresh-cw" @click="loadRooms">Check again</UButton>
        </div>
      </UCard>

      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <UCard v-for="room in rooms" :key="room.id">
          <div class="space-y-4">
            <div>
              <h3 class="text-lg font-semibold">{{ room.name }}</h3>
              <p class="text-sm text-muted">{{ room.description || 'Live quiz room' }}</p>
            </div>
            <UButton :to="`/user/room/${room.id}`" block icon="i-lucide-play">Join Room</UButton>
          </div>
        </UCard>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-user']
})

const { sessionId } = useAuth()
const { notifyError } = useFeedback()

const rooms = ref([])
const loadingRooms = ref(false)

const loadRooms = async () => {
  loadingRooms.value = true
  try {
    const response = await $fetch('/api/rooms/invites', {
      params: { sessionId: sessionId.value }
    })
    rooms.value = response.rooms
  } catch (error) {
    notifyError(error, 'Could not load invitations')
  } finally {
    loadingRooms.value = false
  }
}

onMounted(loadRooms)
</script>
