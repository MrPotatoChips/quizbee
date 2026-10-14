<template>
  <div class="min-h-screen bg-gradient-to-br from-techy-blue to-forest-green p-4">
    <div class="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="space-y-6 text-white">
        <div class="space-y-3">
          <p class="text-xs uppercase tracking-[0.3em] text-cloud-white/80">Live. Fast. Competitive.</p>
          <h1 class="text-4xl font-bold md:text-5xl">Quizbee brings the buzz to every quiz.</h1>
          <p class="text-lg text-cloud-white/90">
            Host real-time competitions, watch scores update instantly, and keep everyone engaged with
            timed questions and a live leaderboard.
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div v-for="feature in features" :key="feature.title" class="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <p class="text-sm text-cloud-white/70">{{ feature.label }}</p>
            <p class="text-2xl font-semibold">{{ feature.title }}</p>
          </div>
        </div>
      </div>

      <UCard class="w-full max-w-md justify-self-center">
        <template #header>
          <div class="text-center">
            <h2 class="text-3xl font-bold">Get started</h2>
            <p class="mt-2 text-muted">Join the next live quiz in seconds.</p>
          </div>
        </template>

        <UTabs v-model="selectedTab" :items="tabs" class="w-full" :unmount-on-hide="false">
          <template #login>
            <UForm :state="loginForm" class="space-y-4 py-4" @submit="handleLogin">
              <UFormField label="Username" name="username" required>
                <UInput v-model="loginForm.username" class="w-full" placeholder="Enter username" autocomplete="username" />
              </UFormField>

              <UFormField label="Password" name="password" required>
                <UInput v-model="loginForm.password" class="w-full" type="password" placeholder="Enter password" autocomplete="current-password" />
              </UFormField>

              <UAlert v-if="error && selectedTab === 'login'" color="error" variant="soft" :title="error" />

              <UButton type="submit" block :loading="loading" icon="i-lucide-log-in">Login</UButton>
            </UForm>
          </template>

          <template #register>
            <UForm :state="registerForm" class="space-y-4 py-4" @submit="handleRegister">
              <UFormField label="Username" name="username" required>
                <UInput v-model="registerForm.username" class="w-full" placeholder="Enter username" autocomplete="username" />
              </UFormField>

              <UFormField label="Password" name="password" required>
                <UInput v-model="registerForm.password" class="w-full" type="password" placeholder="Enter password" autocomplete="new-password" />
              </UFormField>

              <UFormField label="Role" name="role" required :help="activeRoleCopy">
                <USelect v-model="registerForm.role" class="w-full" :items="roleOptions" />
              </UFormField>

              <UAlert v-if="error && selectedTab === 'register'" color="error" variant="soft" :title="error" />

              <UButton type="submit" block :loading="loading" icon="i-lucide-user-plus">Register</UButton>
            </UForm>
          </template>
        </UTabs>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const { login, register, user, sessionId, checkAuth, homeFor } = useAuth()

if (sessionId.value) {
  const authenticated = await checkAuth()
  if (authenticated && user.value) {
    await navigateTo(homeFor())
  }
}

const selectedTab = ref('login')
const tabs = [
  { label: 'Login', value: 'login', slot: 'login', icon: 'i-lucide-log-in' },
  { label: 'Register', value: 'register', slot: 'register', icon: 'i-lucide-user-plus' }
]

const features = [
  { label: 'Live momentum', title: 'Instant scoring' },
  { label: 'Room-ready', title: 'Team battles' },
  { label: 'Live insights', title: 'Leaderboards' },
  { label: 'Fast setup', title: 'Simple onboarding' }
]

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
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

const activeRoleCopy = computed(() => roleCopy[registerForm.role])

const loading = ref(false)
const error = ref(null)

const redirectHome = async () => {
  await navigateTo(homeFor())
}

const handleLogin = async () => {
  error.value = null
  if (!loginForm.username || !loginForm.password) {
    error.value = 'Username and password are required.'
    return
  }

  loading.value = true
  const result = await login(loginForm.username, loginForm.password)
  loading.value = false

  if (result.success) {
    await redirectHome()
    return
  }

  error.value = result.error
}

const handleRegister = async () => {
  error.value = null
  if (!registerForm.username || !registerForm.password) {
    error.value = 'Username and password are required.'
    return
  }

  loading.value = true
  const result = await register(registerForm.username, registerForm.password, registerForm.role)
  loading.value = false

  if (result.success) {
    await redirectHome()
    return
  }

  error.value = result.error
}
</script>
