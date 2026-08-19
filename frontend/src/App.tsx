import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages - Auth
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

// Pages - Public
import Home from './pages/Home'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'

// Pages - Student
import Dashboard from './pages/student/Dashboard'
import MyLearning from './pages/student/MyLearning'
import LessonView from './pages/student/LessonView'
import ExercisePractice from './pages/student/ExercisePractice'
import Flashcards from './pages/student/Flashcards'
import Profile from './pages/student/Profile'
import Groups from './pages/student/Groups'
import Leaderboard from './pages/student/Leaderboard'

// Pages - Teacher
import TeacherDashboard from './pages/teacher/Dashboard'
import CreateCourse from './pages/teacher/CreateCourse'
import ManageCourse from './pages/teacher/ManageCourse'
import StudentProgress from './pages/teacher/StudentProgress'

// Pages - Admin
import AdminDashboard from './pages/admin/Dashboard'
import ManageUsers from './pages/admin/ManageUsers'
import ManageContent from './pages/admin/ManageContent'

// Pages - Common
import Forum from './pages/Forum'
import Chat from './pages/Chat'
import ParentDashboard from './pages/ParentDashboard'
import ControlCenter from './pages/admin/ControlCenter'
import NotFound from './pages/NotFound'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    // import.meta.env.BASE_URL dynamically reads '/LLP/' in production and '/' in dev
    <Router basename={import.meta.env.BASE_URL}>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/courses" element={<Layout><Courses /></Layout>} />
        <Route path="/courses/:id" element={<Layout><CourseDetail /></Layout>} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Layout><Login /></Layout>} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Layout><Register /></Layout>} />
        <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />

        {/* Student Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><Layout><ParentDashboard /></Layout></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'parent', 'admin']}><Layout><Chat /></Layout></ProtectedRoute>} />
        <Route
          path="/my-learning"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><MyLearning /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson/:lessonId"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><LessonView /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercise/:exerciseId"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><ExercisePractice /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/flashcards"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><Flashcards /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><Groups /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><Leaderboard /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Layout><TeacherDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/create-course"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Layout><CreateCourse /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/manage/:courseId"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Layout><ManageCourse /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/progress/:studentId"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Layout><StudentProgress /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><ManageUsers /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><ManageContent /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/control-center" element={<ProtectedRoute allowedRoles={['admin']}><Layout><ControlCenter /></Layout></ProtectedRoute>} />

        {/* Common Routes */}
        <Route path="/forum" element={<Layout><Forum /></Layout>} />

        {/* 404 */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </Router>
  )
}

export default App