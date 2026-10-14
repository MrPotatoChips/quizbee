<template>
  <div class="min-h-screen bg-elevated">
    <AppHeader title="User Management" back-to="/admin" />

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Users</h2>
          <p class="text-sm text-muted">{{ users.length }} account{{ users.length === 1 ? '' : 's' }}</p>
        </div>
        <UButton icon="i-lucide-user-plus" @click="showRegisterModal = true">Register User</UButton>
      </div>

      <UCard>
        <div v-if="loadingUsers" class="flex items-center justify-center gap-2 py-10 text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
          Loading users...
        </div>
        <div v-else-if="users.length === 0" class="py-10 text-center text-muted">
          No users yet. Register the first player to invite them into a room.
        </div>
        <ul v-else class="divide-y divide-default">
          <li v-for="account in users" :key="account.id" class="flex items-center justify-between gap-3 py-3">
            <div>
              <p class="font-medium">{{ account.username }}</p>
              <p class="text-sm text-muted">Joined {{ formatDate(account.createdAt) }}</p>
            </div>
            <UBadge :color="account.role === 'admin' ? 'error' : 'info'" variant="soft">
              {{ account.role }}
            </UBadge>
          </li>
        </ul>
      </UCard>
    </main>

    <UModal v-model:open="showRegisterModal" title="Register New User" description="Create a login for a player or another admin.">
      <template #body>
        <UForm id="register-user-form" :state="newUser" class="space-y-4" @submit="handleRegisterUser">
          <UFormField label="Username" name="username" required>
            <UInput v-model="newUser.username" class="w-full" placeholder="Enter username" autocomplete="off" />
          </UFormField>
          <UFormField label="Password" name="password" required>
            <UInput v-model="newUser.password" class="w-full" type="password" placeholder="Enter password" autocomplete="new-password" />
          </UFormField>
          <UFormField label="Role" name="role" required>
            <USelect v-model="newUser.role" class="w-full" :items="roleOptions" />
          </UFormField>
        </UForm>
      </template>
      <template #footer>
        <div class="flex gap-2">
          <UButton type="submit" form="register-user-form" :loading="submitting">Register</UButton>
          <UButton type="button" color="neutral" variant="ghost" @click="showRegisterModal = false">Cancel</UButton>
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

const users = ref([])
const loadingUsers = ref(false)
const submitting = ref(false)
const showRegisterModal = ref(false)

const newUser = reactive({
  username: '',
  password: '',
  role: 'user'
})

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' }
]

const formatDate = (value) => {
  if (!value) return 'just now'
  return new Date(value).toLocaleDateString()
}

const loadUsers = async () => {
  loadingUsers.value = true
  try {
    const response = await $fetch('/api/users/list', {
      params: { sessionId: sessionId.value }
    })
    users.value = response.users
  } catch (error) {
    notifyError(error, 'Could not load users')
  } finally {
    loadingUsers.value = false
  }
}

const handleRegisterUser = async () => {
  if (!newUser.username || !newUser.password) {
    notifyError({ message: 'Username and password are required.' }, 'Missing details')
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { ...newUser }
    })
    showRegisterModal.value = false
    newUser.username = ''
    newUser.password = ''
    newUser.role = 'user'
    notifySuccess('User registered')
    await loadUsers()
  } catch (error) {
    notifyError(error, 'Could not register user')
  } finally {
    submitting.value = false
  }
}

onMounted(loadUsers)
</script>
