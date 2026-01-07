<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <UButton @click="router.push('/admin')" icon="i-heroicons-arrow-left" variant="ghost">
              Back
            </UButton>
            <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
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
        <h2 class="text-xl font-semibold">Users</h2>
        <UButton @click="showRegisterModal = true" icon="i-heroicons-plus">Register User</UButton>
      </div>
      
      <UCard>
        <div v-if="loadingUsers" class="text-center py-8">
          <p class="text-gray-500">Loading users...</p>
        </div>
        <div v-else-if="users.length === 0" class="text-center py-8">
          <p class="text-gray-500">No users found</p>
        </div>
        <div v-else>
          <div class="divide-y">
            <div v-for="u in users" :key="u.id" class="py-3 flex justify-between items-center">
              <div>
                <p class="font-medium">{{ u.username }}</p>
                <p class="text-sm text-gray-500">{{ u.role }}</p>
              </div>
              <UBadge :color="u.role === 'admin' ? 'red' : 'blue'">{{ u.role }}</UBadge>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Register User Modal -->
    <UModal v-model="showRegisterModal">
      <UCard>
        <template #header>
          <h3 class="font-semibold">Register New User</h3>
        </template>
        <form @submit.prevent="handleRegisterUser" class="space-y-4">
          <UFormGroup label="Username" required>
            <UInput v-model="newUser.username" placeholder="Enter username" />
          </UFormGroup>
          <UFormGroup label="Password" required>
            <UInput v-model="newUser.password" type="password" placeholder="Enter password" />
          </UFormGroup>
          <UFormGroup label="Role" required>
            <USelect v-model="newUser.role" :options="roleOptions" option-attribute="label" />
          </UFormGroup>
          <div class="flex gap-2">
            <UButton type="submit" :loading="submitting">Register</UButton>
            <UButton @click="showRegisterModal = false" color="gray" variant="ghost">Cancel</UButton>
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

const users = ref([])
const loadingUsers = ref(false)
const submitting = ref(false)
const showRegisterModal = ref(false)

const newUser = ref({
  username: '',
  password: '',
  role: 'user'
})

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' }
]

const handleLogout = () => {
  logout()
  router.push('/')
}

const loadUsers = async () => {
  loadingUsers.value = true
  try {
    const response = await $fetch('/api/users/list', {
      params: { sessionId: sessionId.value }
    })
    users.value = response.users
  } catch (error) {
    console.error('Failed to load users:', error)
  }
  loadingUsers.value = false
}

const handleRegisterUser = async () => {
  submitting.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: newUser.value
    })
    showRegisterModal.value = false
    newUser.value = { username: '', password: '', role: 'user' }
    await loadUsers()
  } catch (error) {
    console.error('Failed to register user:', error)
  }
  submitting.value = false
}

onMounted(async () => {
  await loadUsers()
})
</script>
