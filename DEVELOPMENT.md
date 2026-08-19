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

## ✅ Implemented Application Areas

### Backend
- JWT authentication with student, teacher, and admin roles.
- Course, lesson, exercise, progress, flashcard, group, and forum APIs.
- Protected user and learning endpoints.
- Rate limiting and Helmet security headers.
- Production startup validation for `MONGODB_URI` and `JWT_SECRET`.
- Database seed script: `npm run seed`; no public seed HTTP endpoint.

### Frontend
- React/Vite production build and GitHub Pages deployment.
- Axios API client with JWT authorization.
- Course catalog, course details, enrollment, and learning progress screens.

## 🚀 Release Checklist

1. Rotate credentials that were ever committed or shared.
2. Set `MONGODB_URI`, a long random `JWT_SECRET`, and `FRONTEND_URL` in Render.
3. Run `npm test`, `npx eslint src`, and `npm run build` before deployment.
4. Verify deployed `/api/health` returns `200`.
5. Verify deployed `/api/courses/seed` returns `404`.
6. Test registration, login, enrollment, lesson completion, and logout against the deployed database.

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

### Backend
- JWT authentication with role authorization.
- Course, lesson, exercise, progress, flashcard, group, and forum routes.
- Protected user and learning endpoints.
- Request rate limiting and Helmet security headers.
- Production startup validation for `MONGODB_URI` and `JWT_SECRET`.
- Database seed script: `npm run seed` (run manually, never expose as an HTTP route).

### Frontend
- React/Vite production build.
- API client with JWT authorization.
- Course catalog, course details, enrollment, and learning progress screens.

## 🚀 Release Checklist

1. Rotate any credentials that were ever committed or shared.
2. Configure `MONGODB_URI`, a long random `JWT_SECRET`, and `FRONTEND_URL` in Render.
3. Run `npm test` and `npm run build` before deployment.
4. Deploy the backend and verify `/api/health` returns `200`.
5. Verify `/api/courses/seed` returns `404` in the deployed environment.
6. Verify registration, login, enrollment, lesson completion, and logout against the deployed database.

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
