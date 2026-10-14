<template>
  <div class="min-h-screen bg-elevated">
    <AppHeader title="Quizbee Admin" />

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-xl font-semibold">Welcome back</h2>
          <p class="text-muted">Manage users, rooms, and live quizzes from here.</p>
          <p class="mt-1 text-xs text-muted">Last updated: {{ lastUpdatedLabel }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UButton color="neutral" variant="soft" icon="i-lucide-refresh-cw" :loading="loadingStats" @click="refreshStats">
            Refresh stats
          </UButton>
          <UButton to="/admin/rooms" icon="i-lucide-plus">Create a room</UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <UCard>
          <div class="space-y-4">
            <div class="flex size-14 items-center justify-center rounded-full bg-info/10 text-info">
              <UIcon name="i-lucide-users" class="size-7" />
            </div>
            <div>
              <h3 class="text-lg font-semibold">User Management</h3>
              <p class="mt-1 text-sm text-muted">Register players and other admins.</p>
            </div>
            <UButton to="/admin/users" block variant="soft" icon="i-lucide-arrow-right" trailing>Manage Users</UButton>
          </div>
        </UCard>

        <UCard>
          <div class="space-y-4">
            <div class="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
              <UIcon name="i-lucide-door-open" class="size-7" />
            </div>
            <div>
              <h3 class="text-lg font-semibold">Room Management</h3>
              <p class="mt-1 text-sm text-muted">Create rooms, invite players, and launch quizzes.</p>
            </div>
            <UButton to="/admin/rooms" block variant="soft" color="success" icon="i-lucide-arrow-right" trailing>Manage Rooms</UButton>
          </div>
        </UCard>

        <UCard>
          <div class="space-y-4">
            <div class="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UIcon name="i-lucide-chart-column" class="size-7" />
            </div>
            <div>
              <h3 class="text-lg font-semibold">Quick Stats</h3>
              <p class="mt-1 text-sm text-muted">A snapshot of this admin account.</p>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Total users</span>
                <span class="font-medium">{{ stats.users }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Your rooms</span>
                <span class="font-medium">{{ stats.rooms }}</span>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth-admin']
})

const { sessionId } = useAuth()
const { notifyError } = useFeedback()

const stats = ref({
  users: 0,
  rooms: 0
})
const loadingStats = ref(false)
const lastUpdatedAt = ref(null)

const loadStats = async () => {
  loadingStats.value = true
  try {
    const [usersResponse, roomsResponse] = await Promise.all([
      $fetch('/api/users/list', { params: { sessionId: sessionId.value } }),
      $fetch('/api/rooms/my-rooms', { params: { sessionId: sessionId.value } })
    ])
    stats.value.users = usersResponse.users.length
    stats.value.rooms = roomsResponse.rooms.length
    lastUpdatedAt.value = new Date()
  } catch (error) {
    notifyError(error, 'Could not load stats')
  } finally {
    loadingStats.value = false
  }
}

const refreshStats = () => loadStats()

const lastUpdatedLabel = computed(() =>
  lastUpdatedAt.value ? lastUpdatedAt.value.toLocaleTimeString() : 'Never'
)

onMounted(loadStats)
</script>
