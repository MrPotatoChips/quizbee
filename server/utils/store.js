// In-memory data store for the application
const store = {
  users: new Map(), // userId -> user object
  rooms: new Map(), // roomId -> room object
  quizzes: new Map(), // quizId -> quiz object
  sessions: new Map(), // sessionId -> userId
  roomParticipants: new Map(), // roomId -> Set of userIds
  quizSessions: new Map(), // quizSessionId -> quiz session data
  answers: new Map(), // answerId -> answer object
}

// User management
export function createUser(userData) {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const user = {
    id: userId,
    username: userData.username,
    password: userData.password, // In production, hash this
    role: userData.role || 'user',
    createdAt: new Date().toISOString()
  }
  store.users.set(userId, user)
  return { ...user, password: undefined }
}

export function getUserByUsername(username) {
  for (const user of store.users.values()) {
    if (user.username === username) {
      return user
    }
  }
  return null
}

export function getUserById(userId) {
  return store.users.get(userId)
}

export function getAllUsers() {
  return Array.from(store.users.values()).map(u => ({ ...u, password: undefined }))
}

// Session management
export function createSession(userId) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  store.sessions.set(sessionId, userId)
  return sessionId
}

export function getUserBySession(sessionId) {
  const userId = store.sessions.get(sessionId)
  return userId ? store.users.get(userId) : null
}

export function deleteSession(sessionId) {
  store.sessions.delete(sessionId)
}

// Room management
export function createRoom(roomData, adminId) {
  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const room = {
    id: roomId,
    name: roomData.name,
    description: roomData.description || '',
    adminId: adminId,
    invitedUsers: new Set(),
    createdAt: new Date().toISOString()
  }
  store.rooms.set(roomId, room)
  store.roomParticipants.set(roomId, new Set())
  return room
}

export function getRoom(roomId) {
  return store.rooms.get(roomId)
}

export function getRoomsByAdmin(adminId) {
  return Array.from(store.rooms.values()).filter(r => r.adminId === adminId)
}

export function getRoomsByUser(userId) {
  return Array.from(store.rooms.values()).filter(r => r.invitedUsers.has(userId))
}

export function inviteUserToRoom(roomId, userId) {
  const room = store.rooms.get(roomId)
  if (room) {
    room.invitedUsers.add(userId)
    return true
  }
  return false
}

export function joinRoom(roomId, userId) {
  const participants = store.roomParticipants.get(roomId)
  if (participants) {
    participants.add(userId)
    return true
  }
  return false
}

export function leaveRoom(roomId, userId) {
  const participants = store.roomParticipants.get(roomId)
  if (participants) {
    participants.delete(userId)
    return true
  }
  return false
}

export function getRoomParticipants(roomId) {
  const participants = store.roomParticipants.get(roomId)
  return participants ? Array.from(participants) : []
}

// Quiz management
export function createQuiz(quizData, roomId) {
  const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const quiz = {
    id: quizId,
    roomId: roomId,
    title: quizData.title,
    description: quizData.description || '',
    questions: quizData.questions || [],
    createdAt: new Date().toISOString()
  }
  store.quizzes.set(quizId, quiz)
  return quiz
}

export function getQuiz(quizId) {
  return store.quizzes.get(quizId)
}

export function getQuizzesByRoom(roomId) {
  return Array.from(store.quizzes.values()).filter(q => q.roomId === roomId)
}

export function updateQuiz(quizId, quizData) {
  const quiz = store.quizzes.get(quizId)
  if (quiz) {
    Object.assign(quiz, quizData)
    return quiz
  }
  return null
}

// Quiz session management (for live quizzes)
export function createQuizSession(quizId, roomId) {
  const sessionId = `qsession_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const session = {
    id: sessionId,
    quizId: quizId,
    roomId: roomId,
    currentQuestionIndex: 0,
    status: 'waiting', // waiting, active, completed
    participants: new Map(), // userId -> score
    answers: new Map(), // userId -> Map(questionIndex -> answer)
    startedAt: null,
    completedAt: null
  }
  store.quizSessions.set(sessionId, session)
  return session
}

export function getQuizSession(sessionId) {
  return store.quizSessions.get(sessionId)
}

export function updateQuizSession(sessionId, updates) {
  const session = store.quizSessions.get(sessionId)
  if (session) {
    Object.assign(session, updates)
    return session
  }
  return null
}

export function submitAnswer(sessionId, userId, questionIndex, answer, isCorrect, timeTaken) {
  const session = store.quizSessions.get(sessionId)
  if (!session) return null

  if (!session.answers.has(userId)) {
    session.answers.set(userId, new Map())
  }
  
  session.answers.get(userId).set(questionIndex, {
    answer,
    isCorrect,
    timeTaken,
    submittedAt: new Date().toISOString()
  })

  // Update score
  if (isCorrect) {
    const currentScore = session.participants.get(userId) || 0
    // Score based on correctness and speed (max 1000 points per question)
    const speedBonus = Math.max(0, 500 - timeTaken)
    const score = 500 + speedBonus
    session.participants.set(userId, currentScore + score)
  }

  return session
}

export function getLeaderboard(sessionId) {
  const session = store.quizSessions.get(sessionId)
  if (!session) return []

  const leaderboard = []
  for (const [userId, score] of session.participants.entries()) {
    const user = store.users.get(userId)
    if (user) {
      leaderboard.push({
        userId,
        username: user.username,
        score
      })
    }
  }

  return leaderboard.sort((a, b) => b.score - a.score)
}
