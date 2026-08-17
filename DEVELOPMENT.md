# Language Learn Platform - Developer Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18+ - [Download](https://nodejs.org/)
- **MongoDB** 5+ - [Download](https://www.mongodb.com/try/download/community) or use MongoDB Atlas
- **Git** - [Download](https://git-scm.com/)
- **Docker** (optional) - [Download](https://www.docker.com/)

## 🚀 Local Development Setup

### Option 1: Manual Setup (Recommended for development)

#### 1. Clone and Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and update:
# MONGODB_URI=mongodb://localhost:27017/language-learn-platform
# JWT_SECRET=your_development_secret_key

# Start MongoDB (if running locally)
# macOS with Homebrew:
# brew services start mongodb-community
# Windows: Use MongoDB Compass or run mongod.exe

# Start backend server
npm run dev
```

Backend will be running at: `http://localhost:5000`

#### 2. Setup Frontend (in another terminal)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend will be running at: `http://localhost:5173`

### Option 2: Docker Setup

```bash
# From project root
docker-compose up -d

# To stop:
docker-compose down

# View logs:
docker-compose logs -f backend
docker-compose logs -f frontend
```

Access points:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- MongoDB Express: `http://localhost:8081` (admin/password)

## 🔧 Configuration Files

### Backend Environment Variables (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/language-learn-platform
JWT_SECRET=your_development_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables (.env.local)
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Language Learn Platform
VITE_APP_VERSION=1.0.0
```

## 📁 Project Structure

```
language-learn-platform/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API routes (to implement)
│   │   ├── controllers/ # Business logic (to implement)
│   │   ├── middleware/  # Auth & error handling
│   │   └── server.js    # Entry point
│   └── package.json
├── frontend/             # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── store/       # State management
│   │   ├── App.tsx      # Main app component
│   │   └── main.tsx     # Entry point
│   └── package.json
├── docker-compose.yml   # Docker configuration
└── README.md
```

## 📚 Next Steps to Complete

### Backend Development
1. **Create API Routes** (`src/routes/`)
   - Auth routes: register, login, logout, refresh
   - User routes: profile, leaderboard
   - Course routes: CRUD operations
   - Lesson routes: CRUD operations
   - Exercise routes: CRUD operations
   - Progress routes: track learning progress
   - Flashcard routes: spaced repetition
   - Group & Forum routes

2. **Create Controllers** (`src/controllers/`)
   - Implement business logic for each route
   - Handle validation and error cases

3. **Create Services** (`src/services/`)
   - Reusable business logic
   - Database queries
   - External API integrations

4. **Add Database Seeding** (`src/scripts/seed.js`)
   - Initial courses, lessons, exercises
   - Sample users for testing

### Frontend Development
1. **Complete Page Components**
   - Fill in placeholder pages with actual content
   - Implement API integration

2. **Create API Services** (`src/services/`)
   - Axios instances for API calls
   - Request/response interceptors

3. **Add Custom Hooks** (`src/hooks/`)
   - useFetch for API calls
   - useLocalStorage for persistence
   - useAuth for authentication

4. **Create Utility Functions** (`src/utils/`)
   - Date formatting
   - String manipulation
   - Validation functions

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 🐛 Debugging

### Backend Debugging with VS Code
1. Add breakpoint in code
2. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/server.js",
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```
3. Press F5 to start debugging

### Frontend Debugging
- Use React Developer Tools browser extension
- Check browser console for errors
- Use Zustand DevTools for state debugging

## 🚀 Performance Tips

- Use React DevTools Profiler to identify bottlenecks
- Implement code splitting for large routes
- Use memoization for expensive computations
- Optimize database queries with proper indexing
- Enable Redis caching for frequently accessed data

## 📚 API Documentation

### Example API Call
```typescript
// Using the auth store
const { login } = useAuthStore()

await login('user@example.com', 'password')

// Using axios directly
const response = await axios.get(
  `${import.meta.env.VITE_API_URL}/courses`
)
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Make your changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Open a Pull Request

## 🆘 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in .env
- Verify credentials if using Atlas

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Dependencies Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

For issues and questions:
1. Check documentation in README.md files
2. Review error messages carefully
3. Check browser console (frontend) or terminal logs (backend)
4. Open an issue on GitHub

## 🎯 Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement frontend + backend together
   - Test thoroughly

2. **Code Quality**
   - Run linter: `npm run lint`
   - Format code: `npm run format`
   - Check for TypeScript errors

3. **Testing**
   - Write unit tests
   - Test API endpoints with Postman/Insomnia
   - Test UI interactions

4. **Deployment**
   - Build production bundles
   - Run Docker containers
   - Deploy to server

---

Happy coding! 🎉
