# 🐝 Quizbee - Real-time Quiz Platform

A real-time multiplayer quiz platform built with Nuxt 3, Socket.IO, and Nuxt UI. Allows administrators to create and manage quizzes while users participate in live quiz sessions with real-time scoring and leaderboards.

## Features

### Admin Features
- 👥 **User Management**: Register and manage users with role-based access
- 🏠 **Room Management**: Create and manage quiz rooms
- 📝 **Quiz Creation**: Create quizzes with multiple questions, options, and correct answers
- 📧 **Invitation System**: Invite specific users to join quiz rooms
- 🎮 **Live Quiz Control**: Start quizzes and control question flow in real-time
- 📊 **Monitoring**: Track live participants and answer submissions
- 🏆 **Leaderboard**: View final results and rankings

### User Features
- 🔐 **Authentication**: Register and login with role-based access
- 📬 **Invitations**: View and accept room invitations
- ⚡ **Real-time Participation**: Join live quiz sessions
- ⏱️ **Timed Answers**: Submit answers within time limits
- ✅ **Instant Feedback**: Get immediate feedback on answer correctness
- 🎯 **Scoring**: Points based on correctness and speed
- 📈 **Leaderboard**: View rankings after quiz completion

## Technical Stack

- **Frontend**: Nuxt 3 with Nuxt UI components
- **Real-time**: Socket.IO for bidirectional communication
- **Styling**: Tailwind CSS with custom color scheme
- **State**: In-memory data store (recommend database for production)
- **Auth**: Session-based authentication with role-based access control

## Getting Started

### Prerequisites
- Node.js 18.x LTS (recommended)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:3000`

## Deployment (Git hosting)

Quizbee runs a Nuxt 3 server plus Socket.IO, so it needs a Node server or a serverless platform that supports WebSockets.
If you want to deploy from a Git repo, use one of the following:

- **Vercel / Netlify / Render / Railway**: Connect your Git repository and set the build command to `npm run build` with
  the start command `npm run preview` (or a custom Node start command). Ensure WebSocket support is enabled.
- **Self-hosted Node server**: Run `npm run build` and `npm run preview` behind a reverse proxy such as Nginx.

> **Note about GitHub Pages:** GitHub Pages is static hosting only. It will not support the Socket.IO server or real-time
> features. You could run `npm run generate` for a static build, but real-time quizzes will not function.

### Node version note

This project is tested with Node.js 18.x LTS. If your CI/CD or hosting platform defaults to Node 20.x and fails during
install or build, set the runtime to Node 18.x. No `webpack-cli` install is required for Nuxt 3 builds. 

## Usage Guide

### For Administrators

1. **Register as Admin**
   - Navigate to the homepage
   - Click the "Register" tab
   - Enter username and password
   - Select "Admin" role
   - Click Register

2. **Create Users**
   - Go to "Users" tab in admin dashboard
   - Click "Register User"
   - Fill in user details (select "User" role for participants)

3. **Create a Room**
   - Go to "My Rooms" tab
   - Click "Create Room"
   - Enter room name and description

4. **Invite Users**
   - Click "Manage" on a room
   - Invite users from the available users list

5. **Create a Quiz**
   - In room management, click "Create Quiz"
   - Enter quiz title and description
   - Add questions with options and correct answers
   - Specify time limits for each question

6. **Start Quiz Session**
   - Click "Start Quiz" on a quiz
   - Click "Start Quiz" to begin the session
   - Use "Next Question" to advance through questions
   - View live submissions and participant count
   - View final leaderboard when complete

### For Users

1. **Register/Login**
   - Navigate to the homepage
   - Register or login with credentials

2. **Join a Room**
   - View available room invitations on the dashboard
   - Click "Join Room" on an invitation

3. **Participate in Quiz**
   - Wait for the admin to start the quiz
   - Read each question carefully
   - Select your answer before time runs out
   - Submit your answer
   - Get instant feedback
   - View your ranking on the final leaderboard

## Scoring System

- **Base Score**: 500 points for correct answers
- **Speed Bonus**: Up to 500 additional points based on answer speed
- **Maximum per Question**: 1000 points
- Incorrect answers receive 0 points

## Project Structure

```
quizbee/
├── pages/                    # Nuxt pages
│   ├── index.vue            # Login/Register page
│   ├── admin/               # Admin pages
│   │   ├── index.vue        # Admin dashboard
│   │   └── quiz/[id].vue    # Quiz control panel
│   └── user/                # User pages
│       ├── index.vue        # User dashboard
│       └── room/[id].vue    # Quiz participation
├── server/                   # Server-side code
│   ├── api/                 # API endpoints
│   │   ├── auth/            # Authentication
│   │   ├── rooms/           # Room management
│   │   ├── quizzes/         # Quiz management
│   │   ├── users/           # User management
│   │   └── socket.js        # Socket.IO server
│   └── utils/
│       └── store.js         # In-memory data store
├── composables/             # Vue composables
│   ├── useAuth.js          # Authentication composable
│   └── useSocket.js        # Socket.IO composable
├── middleware/              # Nuxt middleware
│   ├── auth-admin.js       # Admin authentication
│   └── auth-user.js        # User authentication
└── assets/css/             # Styles
    └── main.css            # Tailwind CSS
```

## Socket.IO Events

### Admin Events
- `start-quiz`: Start a quiz session
- `next-question`: Advance to next question
- `join-room`: Join as admin observer

### User Events
- `join-room`: Join a quiz room
- `submit-answer`: Submit an answer
- `leave-room`: Leave a room

### Server Events
- `quiz-started`: Quiz session has started
- `new-question`: New question broadcast
- `quiz-completed`: Quiz finished with leaderboard
- `answer-result`: Feedback on submitted answer
- `room-update`: Participant count update
- `answer-submitted`: Answer submission notification

## Security Considerations

⚠️ **Important**: This implementation uses simplified authentication for demonstration purposes. For production deployment, implement:

1. **Password Security**
   - Hash passwords using bcrypt or argon2
   - Implement secure password requirements

2. **Session Management**
   - Use secure, httpOnly cookies
   - Implement session expiration
   - Add CSRF protection

3. **Database**
   - Replace in-memory store with persistent database (PostgreSQL, MongoDB, etc.)
   - Implement proper data validation

4. **API Security**
   - Add rate limiting
   - Implement input sanitization
   - Add request validation

5. **Transport Security**
   - Enforce HTTPS in production
   - Secure WebSocket connections

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run generate` - Generate static site

### Code Style

The project uses:
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling

## Future Enhancements

- [ ] Question types (multiple choice, true/false, short answer)
- [ ] Question media support (images, videos)
- [ ] Quiz templates
- [ ] Analytics dashboard
- [ ] Export results
- [ ] Mobile app
- [ ] Public quiz rooms
- [ ] Practice mode
- [ ] Team-based quizzes

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
