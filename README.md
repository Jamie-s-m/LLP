# Language Learn Platform

A comprehensive full-stack web application for learning languages with interactive lessons, flashcards, grammar exercises, speaking practice, progress tracking, and gamification features.

## 🌍 Supported Languages
- English
- Turkish
- Russian
- Uzbek

## 🎯 Features

### For Students
- 📚 Interactive lessons and courses
- 🎴 Vocabulary flashcards with spaced repetition
- ✏️ Grammar exercises
- 🎤 Speaking/pronunciation practice
- 📊 Progress tracking and analytics
- 🏆 Leaderboard and gamification (points, badges, streaks)
- 👥 Social features (groups, forums, study partners)

### For Teachers
- 📖 Create and manage courses
- 📝 Design custom lessons and exercises
- 📈 Monitor student progress
- 🎨 Customize content

### For Admins
- 👤 User management
- 📊 Platform analytics
- 🌐 Language and content management
- ⚙️ System settings

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for data storage
- **JWT** for authentication
- **WebSocket** for real-time features
- **Socket.io** for live notifications

### Frontend
- **React 18** with TypeScript
- **Redux** for state management
- **Vite** as build tool
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls

### DevOps
- **Docker** for containerization
- **Docker Compose** for multi-container setup

## 📁 Project Structure

```
language-learn-platform/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── services/       # Business services
│   │   └── app.js          # Express app setup
│   ├── .env.example        # Environment variables template
│   ├── package.json
│   └── Dockerfile
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client services
│   │   ├── store/          # Redux store
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Main app component
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml      # Multi-container setup
├── .gitignore
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5+
- npm or yarn

### Installation

#### Clone and Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

#### Setup Frontend (in another terminal)
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`

### Using Docker
```bash
docker-compose up -d
```

## 📚 Documentation

- [Backend Setup Guide](./backend/README.md)
- [Frontend Setup Guide](./frontend/README.md)
- [API Documentation](./backend/API.md)
- [Database Schema](./backend/DATABASE.md)

## 🔐 Environment Variables

See `.env.example` files in both backend and frontend directories for required environment variables.

## 👥 User Roles

1. **Student** - Learn languages, complete exercises, track progress
2. **Teacher** - Create courses, design lessons, monitor students
3. **Admin** - Manage users, system settings, platform analytics

## 📊 Key Features Implementation

### Authentication
- JWT-based authentication
- Email verification
- Password reset functionality
- Social login integration (optional)

### Learning Path
- Structured courses with lessons
- Difficulty levels (Beginner, Intermediate, Advanced)
- Progressive learning with prerequisites

### Gamification
- Points system
- Badges and achievements
- Leaderboards (daily, weekly, monthly)
- Streaks and milestones

### Progress Tracking
- Learning time analytics
- Completion percentages
- Difficulty analysis
- Performance reports

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For issues and questions, please open an issue in the repository.
