<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">🐝 Quizbee Admin</h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">{{ user?.username }}</span>
            <UButton @click="handleLogout" color="red" variant="soft">Logout</UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <UTabs v-model="selectedTab" :items="tabs">
        <template #default="{ item }">
          <div class="py-6">
            <!-- Users Tab -->
            <div v-if="item.key === 'users'">
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

            <!-- Rooms Tab -->
            <div v-if="item.key === 'rooms'">
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

            <!-- Room Management -->
            <div v-if="item.key === 'manage' && selectedRoom">
              <div class="mb-6">
                <UButton @click="selectedTab = 'rooms'; selectedRoom = null" icon="i-heroicons-arrow-left" variant="ghost">
                  Back to Rooms
                </UButton>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Room Details -->
                <UCard>
                  <template #header>
                    <h3 class="font-semibold">Room Details</h3>
                  </template>
                  <div class="space-y-3">
                    <div>
                      <p class="text-sm text-gray-500">Name</p>
                      <p class="font-medium">{{ selectedRoom.name }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-500">Description</p>
                      <p>{{ selectedRoom.description || 'No description' }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-500">Invited Users</p>
                      <p class="font-medium">{{ selectedRoom.invitedUsers.length }}</p>
                    </div>
                  </div>
                </UCard>

                <!-- Invite Users -->
                <UCard>
                  <template #header>
                    <h3 class="font-semibold">Invite Users</h3>
                  </template>
                  <div class="space-y-3">
                    <div v-for="u in availableUsersForInvite" :key="u.id" class="flex justify-between items-center">
                      <span>{{ u.username }}</span>
                      <UButton @click="inviteUser(selectedRoom.id, u.id)" size="sm">Invite</UButton>
                    </div>
                    <div v-if="availableUsersForInvite.length === 0" class="text-center py-4 text-gray-500">
                      All users invited
                    </div>
                  </div>
                </UCard>

                <!-- Quizzes -->
                <UCard class="lg:col-span-2">
                  <template #header>
                    <div class="flex justify-between items-center">
                      <h3 class="font-semibold">Quizzes</h3>
                      <UButton @click="createQuizForRoom(selectedRoom.id)" size="sm" icon="i-heroicons-plus">
                        Create Quiz
                      </UButton>
                    </div>
                  </template>
                  <div v-if="loadingQuizzes" class="text-center py-4">
                    <p class="text-gray-500">Loading quizzes...</p>
                  </div>
                  <div v-else-if="roomQuizzes.length === 0" class="text-center py-4 text-gray-500">
                    No quizzes created yet
                  </div>
                  <div v-else class="space-y-3">
                    <div v-for="quiz in roomQuizzes" :key="quiz.id" class="border rounded-lg p-4 hover:bg-gray-50">
                      <div class="flex justify-between items-start">
                        <div>
                          <h4 class="font-medium">{{ quiz.title }}</h4>
                          <p class="text-sm text-gray-600">{{ quiz.description }}</p>
                          <p class="text-sm text-gray-500 mt-1">{{ quiz.questions.length }} questions</p>
                        </div>
                        <UButton @click="startQuiz(quiz)" color="green">Start Quiz</UButton>
                      </div>
                    </div>
                  </div>
                </UCard>
              </div>
            </div>
          </div>
        </template>
      </UTabs>
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

    <!-- Create Quiz Modal -->
    <UModal v-model="showQuizModal">
      <UCard>
        <template #header>
          <h3 class="font-semibold">Create Quiz</h3>
        </template>
        <form @submit.prevent="handleCreateQuiz" class="space-y-4">
          <UFormGroup label="Quiz Title" required>
            <UInput v-model="newQuiz.title" placeholder="Enter quiz title" />
          </UFormGroup>
          <UFormGroup label="Description">
            <UTextarea v-model="newQuiz.description" placeholder="Enter description" />
          </UFormGroup>
          
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h4 class="font-medium">Questions</h4>
              <UButton @click="addQuestion" size="sm" icon="i-heroicons-plus">Add Question</UButton>
            </div>
            
            <div v-for="(q, idx) in newQuiz.questions" :key="idx" class="border rounded p-4 space-y-3">
              <div class="flex justify-between items-start">
                <h5 class="font-medium">Question {{ idx + 1 }}</h5>
                <UButton @click="removeQuestion(idx)" color="red" size="xs" icon="i-heroicons-trash" />
              </div>
              
              <UFormGroup label="Question" required>
                <UInput v-model="q.question" placeholder="Enter question" />
              </UFormGroup>
              
              <UFormGroup label="Options (one per line)" required>
                <UTextarea 
                  :model-value="q.options.join('\n')" 
                  @update:model-value="q.options = $event.split('\n').filter(o => o.trim())"
                  placeholder="Option 1&#10;Option 2&#10;Option 3&#10;Option 4" 
                  rows="4"
                />
              </UFormGroup>
              
              <UFormGroup label="Correct Answer" required>
                <UInput v-model="q.correctAnswer" placeholder="Enter correct answer" />
              </UFormGroup>
              
              <UFormGroup label="Time Limit (seconds)">
                <UInput v-model.number="q.timeLimit" type="number" placeholder="30" />
              </UFormGroup>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton type="submit" :loading="submitting" :disabled="newQuiz.questions.length === 0">
              Create Quiz
            </UButton>
            <UButton @click="showQuizModal = false" color="gray" variant="ghost">Cancel</UButton>
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

const selectedTab = ref('users')
const tabs = [
  { key: 'users', label: 'Users' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'manage', label: 'Manage Room', disabled: true }
]

const users = ref([])
const rooms = ref([])
const selectedRoom = ref(null)
const roomQuizzes = ref([])

const loadingUsers = ref(false)
const loadingRooms = ref(false)
const loadingQuizzes = ref(false)
const submitting = ref(false)

const showRegisterModal = ref(false)
const showRoomModal = ref(false)
const showQuizModal = ref(false)

const newUser = ref({
  username: '',
  password: '',
  role: 'user'
})

const newRoom = ref({
  name: '',
  description: ''
})

const newQuiz = ref({
  title: '',
  description: '',
  questions: []
})

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' }
]

const availableUsersForInvite = computed(() => {
  if (!selectedRoom.value) return []
  return users.value.filter(u => 
    u.role === 'user' && !selectedRoom.value.invitedUsers.includes(u.id)
  )
})

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

const loadQuizzes = async (roomId) => {
  loadingQuizzes.value = true
  try {
    const response = await $fetch('/api/quizzes/by-room', {
      params: { sessionId: sessionId.value, roomId }
    })
    roomQuizzes.value = response.quizzes
  } catch (error) {
    console.error('Failed to load quizzes:', error)
  }
  loadingQuizzes.value = false
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

const manageRoom = async (room) => {
  selectedRoom.value = room
  tabs[2].disabled = false
  selectedTab.value = 'manage'
  await loadQuizzes(room.id)
}

const inviteUser = async (roomId, userId) => {
  try {
    await $fetch('/api/rooms/invite', {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        roomId,
        userId
      }
    })
    await loadRooms()
    // Update selectedRoom
    const updated = rooms.value.find(r => r.id === roomId)
    if (updated) {
      selectedRoom.value = updated
    }
  } catch (error) {
    console.error('Failed to invite user:', error)
  }
}

const createQuizForRoom = (roomId) => {
  newQuiz.value = {
    title: '',
    description: '',
    questions: [],
    roomId
  }
  showQuizModal.value = true
}

const addQuestion = () => {
  newQuiz.value.questions.push({
    question: '',
    options: [],
    correctAnswer: '',
    timeLimit: 30
  })
}

const removeQuestion = (index) => {
  newQuiz.value.questions.splice(index, 1)
}

const handleCreateQuiz = async () => {
  submitting.value = true
  try {
    await $fetch('/api/quizzes/create', {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        roomId: newQuiz.value.roomId,
        title: newQuiz.value.title,
        description: newQuiz.value.description,
        questions: newQuiz.value.questions
      }
    })
    showQuizModal.value = false
    if (selectedRoom.value) {
      await loadQuizzes(selectedRoom.value.id)
    }
  } catch (error) {
    console.error('Failed to create quiz:', error)
  }
  submitting.value = false
}

const startQuiz = (quiz) => {
  router.push(`/admin/quiz/${quiz.id}?roomId=${selectedRoom.value.id}`)
}

onMounted(async () => {
  await loadUsers()
  await loadRooms()
})
</script>
