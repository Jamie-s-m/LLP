# Language Learn Platform - Backend API

A comprehensive RESTful API for the Language Learning Platform built with Node.js, Express, and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

## 🌟 Features

- User authentication with JWT
- Role-based access control (Student, Teacher, Admin)
- Course and lesson management
- Exercise and practice problems
- Progress tracking and analytics
- Flashcard system with spaced repetition algorithm
- Gamification (points, badges, streaks, leaderboards)
- Social features (groups, forums)
- Real-time notifications (Socket.io ready)
- File upload support

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB 5+ (local or MongoDB Atlas)

## 🚀 Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Verify MongoDB Connection**
   - Ensure MongoDB is running locally or update `MONGODB_URI` in `.env`

## 🔧 Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/language-learn-platform

JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:5173

# Optional: Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Optional: File upload
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── models/              # MongoDB schemas
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Lesson.js
│   │   ├── Exercise.js
│   │   ├── Progress.js
│   │   ├── Flashcard.js
│   │   ├── FlashcardProgress.js
│   │   ├── Badge.js
│   │   ├── UserAchievement.js
│   │   ├── Group.js
│   │   ├── ForumPost.js
│   │   └── ForumReply.js
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/              # API route handlers (to be created)
│   ├── controllers/         # Business logic (to be created)
│   ├── services/            # Business services (to be created)
│   ├── utils/               # Utility functions (to be created)
│   ├── app.js               # Express app setup
│   └── server.js            # Server entry point
├── .env.example             # Environment variables template
├── package.json             # Project dependencies
└── README.md                # This file
```

## ▶️ Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Run Database Seed (when ready)
```bash
npm run seed
```

### Linting
```bash
npm run lint
```

## 📡 API Endpoints (To Be Implemented)

### Authentication Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Routes
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:userId` - Get user public profile
- `GET /api/users/leaderboard` - Get global leaderboard
- `GET /api/users/leaderboard/:language` - Get language-specific leaderboard

### Course Routes
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:courseId` - Get course details
- `POST /api/courses` - Create course (Teacher/Admin)
- `PUT /api/courses/:courseId` - Update course (Teacher/Admin)
- `DELETE /api/courses/:courseId` - Delete course (Teacher/Admin)
- `POST /api/courses/:courseId/enroll` - Enroll in course

### Lesson Routes
- `GET /api/lessons/:lessonId` - Get lesson details
- `POST /api/lessons` - Create lesson (Teacher/Admin)
- `PUT /api/lessons/:lessonId` - Update lesson (Teacher/Admin)
- `DELETE /api/lessons/:lessonId` - Delete lesson (Teacher/Admin)

### Exercise Routes
- `GET /api/exercises/:exerciseId` - Get exercise
- `POST /api/exercises` - Create exercise (Teacher/Admin)
- `POST /api/exercises/:exerciseId/submit` - Submit exercise answers

### Progress Routes
- `GET /api/progress/user` - Get user's learning progress
- `GET /api/progress/course/:courseId` - Get progress for specific course
- `POST /api/progress/:exerciseId/submit` - Record progress

### Flashcard Routes
- `GET /api/flashcards/deck/:deckId` - Get flashcard deck
- `POST /api/flashcards/deck/:deckId/review` - Get cards for review
- `POST /api/flashcards/:cardId/answer` - Submit flashcard answer

### Gamification Routes
- `GET /api/badges` - Get all available badges
- `GET /api/achievements/user` - Get user's achievements
- `GET /api/points/user` - Get user's points

### Group Routes
- `GET /api/groups` - Get all groups
- `GET /api/groups/:groupId` - Get group details
- `POST /api/groups` - Create new group
- `POST /api/groups/:groupId/join` - Join group
- `POST /api/groups/:groupId/leave` - Leave group

### Forum Routes
- `GET /api/forum/posts` - Get all forum posts
- `GET /api/forum/posts/:postId` - Get specific post
- `POST /api/forum/posts` - Create new post
- `POST /api/forum/posts/:postId/reply` - Reply to post
- `PUT /api/forum/posts/:postId/upvote` - Upvote post

## 🗄️ Database Models

All models are stored in the `src/models/` directory:

### User Model
- Stores user account information
- Supports multiple roles: student, teacher, admin
- Tracks learning progress and achievements

### Course Model
- Represents language courses
- Links to lessons and enrolled students
- Contains course metadata and ratings

### Lesson Model
- Contains lesson content, vocabulary, and grammar
- Links to associated exercises
- Tracks lesson difficulty and duration

### Exercise Model
- Various types: multiple choice, fill-blank, speaking, etc.
- Contains questions, answers, and explanations
- Supports hints and automated feedback

### Progress Model
- Tracks student progress in courses and exercises
- Stores scores, time spent, and answers
- Used for analytics and recommendations

### Flashcard System
- Flashcard model for vocabulary items
- FlashcardProgress implements SM-2 spaced repetition algorithm
- Tracks review intervals and learning state

### Gamification Models
- Badge model defines available badges
- UserAchievement tracks earned badges
- Points system integrated with Progress model

### Social Models
- Group model for study groups and communities
- ForumPost and ForumReply for discussions

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. User logs in with email and password
2. Server returns JWT token
3. Client includes token in `Authorization: Bearer <token>` header
4. Middleware validates token before processing protected routes

Token expiry is set via `JWT_EXPIRE` environment variable (default: 7 days)

## ⚠️ Error Handling

The API uses a centralized error handler middleware that:
- Catches all errors from route handlers
- Formats errors in consistent JSON format
- Returns appropriate HTTP status codes
- Logs errors for debugging

Error response format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🔄 Next Steps

1. Create route files in `src/routes/`
2. Create controller files in `src/controllers/` with business logic
3. Create service layer in `src/services/` for reusable logic
4. Create utility functions in `src/utils/` (validation, helpers, etc.)
5. Add database seed file for initial data
6. Setup WebSocket for real-time features
7. Add comprehensive API documentation (Swagger/OpenAPI)
8. Add unit and integration tests

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Documentation](https://jwt.io/)
- [REST API Best Practices](https://restfulapi.net/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License
