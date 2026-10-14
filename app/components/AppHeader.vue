<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  backTo: {
    type: String,
    default: ''
  },
  backLabel: {
    type: String,
    default: 'Back'
  }
})

const { user, logout } = useAuth()
const router = useRouter()

const handleLogout = () => {
  logout()
  router.push('/')
}
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-default bg-default/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
      <div class="flex min-w-0 items-center gap-2">
        <UButton
          v-if="backTo"
          :to="backTo"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
        >
          {{ backLabel }}
        </UButton>
        <h1 class="truncate text-lg font-semibold sm:text-xl">{{ title }}</h1>
      </div>
      <div class="flex items-center gap-2">
        <span class="hidden text-sm text-muted sm:inline">{{ user?.username }}</span>
        <UColorModeButton />
        <UButton color="error" variant="soft" icon="i-lucide-log-out" @click="handleLogout">
          Logout
        </UButton>
      </div>
    </div>
  </header>
</template>
