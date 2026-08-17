# Language Learn Platform - Frontend

A modern React-based frontend for the Language Learning Platform with interactive UI, state management, and responsive design.

## 🎨 Features

- **Modern UI** with Tailwind CSS and custom components
- **Responsive Design** for desktop, tablet, and mobile
- **State Management** using Zustand for auth and learning data
- **Dark Mode** support
- **Type Safety** with TypeScript
- **Fast Development** with Vite
- **API Integration** with axios
- **Toast Notifications** with react-hot-toast
- **Animations** with Framer Motion

## 📋 Prerequisites

- Node.js 18+
- npm or yarn

## 🚀 Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

## ▶️ Running the Application

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Layout.tsx       # Main layout component
│   │   ├── Navbar.tsx       # Navigation bar
│   │   ├── Sidebar.tsx      # Sidebar navigation
│   │   └── ProtectedRoute.tsx # Route protection
│   ├── pages/               # Page components
│   │   ├── Home.tsx         # Homepage
│   │   ├── Courses.tsx      # Courses listing
│   │   ├── CourseDetail.tsx # Course details
│   │   ├── Forum.tsx        # Forum page
│   │   ├── NotFound.tsx     # 404 page
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── student/         # Student pages
│   │   ├── teacher/         # Teacher pages
│   │   └── admin/           # Admin pages
│   ├── store/               # Zustand state stores
│   │   ├── authStore.ts     # Authentication state
│   │   └── learningStore.ts # Learning state
│   ├── services/            # API service functions
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main app component with routing
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── .env.example             # Environment variables template
└── package.json             # Dependencies
```

## 🔑 Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Language Learn Platform
VITE_APP_VERSION=1.0.0
```

## 🎯 Available Routes

### Public Routes
- `/` - Homepage
- `/courses` - Browse all courses
- `/courses/:id` - Course details
- `/login` - Login page
- `/register` - Registration page
- `/forum` - Forum/discussions

### Protected Student Routes
- `/dashboard` - Student dashboard
- `/my-learning` - Learning progress
- `/lesson/:id` - Lesson view
- `/exercise/:id` - Exercise practice
- `/flashcards` - Flashcard study
- `/profile` - User profile
- `/groups` - Study groups
- `/leaderboard` - Global leaderboard

### Protected Teacher Routes
- `/teacher/dashboard` - Teacher dashboard
- `/teacher/create-course` - Create new course
- `/teacher/manage/:courseId` - Manage course
- `/teacher/progress/:studentId` - View student progress

### Protected Admin Routes
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - Manage users
- `/admin/content` - Manage content

## 🛠️ Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **React Icons** - Icon library
- **Framer Motion** - Animations

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Tailwind's breakpoints: sm, md, lg, xl
- Adaptive navigation (sidebar collapses on mobile)
- Touch-friendly interface

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **Custom CSS** components in `index.css`
- **Color scheme** with primary and secondary colors
- **Dark mode** support throughout the app

## 🔐 Authentication Flow

1. User logs in or registers
2. Auth token is stored in localStorage
3. Token is sent with each API request in Authorization header
4. Token is used to protect routes
5. Logout clears token and redirects to home

## 🚀 Performance Optimizations

- Code splitting with React Router
- Lazy loading of pages
- Memoization of components
- Optimized re-renders
- Minified builds with Vite

## 🐛 Debugging

Enable debug logging in development:
```typescript
// In your component
console.log('Debug info', data)
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License

## 📞 Support

For issues and questions, please open an issue in the repository.
