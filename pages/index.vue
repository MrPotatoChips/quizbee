<template>
  <div class="min-h-screen bg-gradient-to-br from-techy-blue to-forest-green flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900">🐝 Quizbee</h1>
          <p class="text-gray-600 mt-2">Real-time Quiz Platform</p>
        </div>
      </template>

      <UTabs v-model="selectedTab" :items="tabs" class="w-full">
        <template #login>
          <div class="py-4">
            <form @submit.prevent="handleLogin" class="space-y-4">
              <UFormGroup label="Username" required>
                <UInput v-model="loginForm.username" placeholder="Enter username" />
              </UFormGroup>
              
              <UFormGroup label="Password" required>
                <UInput v-model="loginForm.password" type="password" placeholder="Enter password" />
              </UFormGroup>

              <UAlert v-if="error" color="red" variant="soft" :title="error" class="mb-4" />

              <UButton type="submit" block :loading="loading">Login</UButton>
            </form>
          </div>
        </template>

        <template #register>
          <div class="py-4">
            <form @submit.prevent="handleRegister" class="space-y-4">
              <UFormGroup label="Username" required>
                <UInput v-model="registerForm.username" placeholder="Enter username" />
              </UFormGroup>
              
              <UFormGroup label="Password" required>
                <UInput v-model="registerForm.password" type="password" placeholder="Enter password" />
              </UFormGroup>

              <UFormGroup label="Role" required>
                <USelect 
                  v-model="registerForm.role" 
                  :options="roleOptions"
                  option-attribute="label"
                />
              </UFormGroup>

              <UAlert v-if="error" color="red" variant="soft" :title="error" class="mb-4" />

              <UButton type="submit" block :loading="loading">Register</UButton>
            </form>
          </div>
        </template>
      </UTabs>
    </UCard>
  </div>
</template>

<script setup>
const { login, register, user } = useAuth()
const router = useRouter()

const selectedTab = ref('login')
const tabs = [
  { key: 'login', label: 'Login', slot: 'login' },
  { key: 'register', label: 'Register', slot: 'register' }
]

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  password: '',
  role: 'user'
})

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' }
]

const loading = ref(false)
const error = ref(null)

const handleLogin = async () => {
  loading.value = true
  error.value = null
  
  const result = await login(loginForm.value.username, loginForm.value.password)
  
  if (result.success) {
    // Redirect based on role
    if (user.value.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/user')
    }
  } else {
    error.value = result.error
  }
  
  loading.value = false
}

const handleRegister = async () => {
  loading.value = true
  error.value = null
  
  const result = await register(
    registerForm.value.username,
    registerForm.value.password,
    registerForm.value.role
  )
  
  if (result.success) {
    // Redirect based on role
    if (user.value.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/user')
    }
  } else {
    error.value = result.error
  }
  
  loading.value = false
}
</script>
