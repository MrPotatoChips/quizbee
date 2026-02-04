<template>
  <div class="min-h-screen bg-gradient-to-br from-techy-blue to-forest-green flex items-center justify-center p-4">
    <div class="w-full max-w-5xl grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-center">
      <div class="text-white space-y-6">
        <div class="space-y-3">
          <p class="uppercase tracking-[0.3em] text-xs text-cloud-white/80">Live. Fast. Competitive.</p>
          <h1 class="text-4xl md:text-5xl font-bold">🐝 Quizbee brings the buzz to every quiz.</h1>
          <p class="text-cloud-white/90 text-lg">
            Host real-time competitions, watch scores soar instantly, and keep your crew engaged with
            lightning-fast questions and live leaderboards.
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl bg-white/10 p-4 backdrop-blur border border-white/20">
            <p class="text-sm text-cloud-white/70">Live momentum</p>
            <p class="text-2xl font-semibold">⚡ Instant scoring</p>
          </div>
          <div class="rounded-2xl bg-white/10 p-4 backdrop-blur border border-white/20">
            <p class="text-sm text-cloud-white/70">Room-ready</p>
            <p class="text-2xl font-semibold">🎯 Team battles</p>
          </div>
          <div class="rounded-2xl bg-white/10 p-4 backdrop-blur border border-white/20">
            <p class="text-sm text-cloud-white/70">Live insights</p>
            <p class="text-2xl font-semibold">📊 Leaderboards</p>
          </div>
          <div class="rounded-2xl bg-white/10 p-4 backdrop-blur border border-white/20">
            <p class="text-sm text-cloud-white/70">Fast setup</p>
            <p class="text-2xl font-semibold">🧩 Simple onboarding</p>
          </div>
        </div>
      </div>

      <UCard class="w-full max-w-md justify-self-center">
        <template #header>
          <div class="text-center">
            <h2 class="text-3xl font-bold text-gray-900">Get started</h2>
            <p class="text-gray-600 mt-2">Join the next live quiz in seconds.</p>
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
                  <p class="text-xs text-gray-500 mt-2">{{ activeRoleCopy }}</p>
                </UFormGroup>

                <UAlert v-if="error" color="red" variant="soft" :title="error" class="mb-4" />

                <UButton type="submit" block :loading="loading">Register</UButton>
              </form>
            </div>
          </template>
        </UTabs>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const { login, register, user } = useAuth()
const router = useRouter()

const selectedTab = ref(0)
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

const roleCopy = {
  user: 'Join quizzes, answer fast, and climb the leaderboard.',
  admin: 'Build rooms, launch quizzes, and monitor live results.'
}

const activeRoleCopy = computed(() => roleCopy[registerForm.value.role])

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
