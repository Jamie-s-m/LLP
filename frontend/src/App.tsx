import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'))
const Home = lazy(() => import('./pages/Home'))
const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const Dashboard = lazy(() => import('./pages/student/Dashboard'))
const MyLearning = lazy(() => import('./pages/student/MyLearning'))
const LessonView = lazy(() => import('./pages/student/LessonView'))
const ExercisePractice = lazy(() => import('./pages/student/ExercisePractice'))
const Flashcards = lazy(() => import('./pages/student/Flashcards'))
const Profile = lazy(() => import('./pages/student/Profile'))
const Groups = lazy(() => import('./pages/student/Groups'))
const Leaderboard = lazy(() => import('./pages/student/Leaderboard'))
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'))
const CreateCourse = lazy(() => import('./pages/teacher/CreateCourse'))
const ManageCourse = lazy(() => import('./pages/teacher/ManageCourse'))
const StudentProgress = lazy(() => import('./pages/teacher/StudentProgress'))
const Forum = lazy(() => import('./pages/Forum'))
const Chat = lazy(() => import('./pages/Chat'))
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'))
const ChildProgress = lazy(() => import('./pages/ChildProgress'))
const ControlCenter = lazy(() => import('./pages/admin/ControlCenter'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Cookies = lazy(() => import('./pages/Cookies'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  const { isAuthenticated, user } = useAuthStore()
  const authenticatedLandingPath = user?.role === 'admin'
    ? '/admin/control-center'
    : user?.role === 'teacher'
      ? '/teacher/dashboard'
      : user?.role === 'parent'
        ? '/parent/dashboard'
        : '/dashboard'

  return (
    // import.meta.env.BASE_URL dynamically reads '/LLP/' in production and '/' in dev
    <Router basename={import.meta.env.BASE_URL}>
      <Toaster position="top-right" />
      <Suspense fallback={<Layout><div className="atlas-page flex items-center justify-center px-4 py-16"><div className="atlas-panel p-6 text-center text-slate-600">Loading...</div></div></Layout>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/courses" element={<Layout><Courses /></Layout>} />
        <Route path="/courses/:id" element={<Layout><CourseDetail /></Layout>} />
        <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
        <Route path="/terms" element={<Layout><Terms /></Layout>} />
        <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
        <Route path="/cookies" element={<Layout><Cookies /></Layout>} />
        <Route path="/login" element={isAuthenticated ? <Navigate to={authenticatedLandingPath} replace /> : <Layout><Login /></Layout>} />
        <Route path="/register" element={isAuthenticated ? <Navigate to={authenticatedLandingPath} replace /> : <Layout><Register /></Layout>} />
        <Route path="/verify-email" element={<Layout><VerifyEmail /></Layout>} />
        <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
        <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />

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
        <Route path="/parent/children/:studentId" element={<ProtectedRoute allowedRoles={['parent']}><Layout><ChildProgress /></Layout></ProtectedRoute>} />
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
            <ProtectedRoute allowedRoles={['student', 'teacher', 'parent', 'admin']}>
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
        <Route path="/admin/dashboard" element={<Navigate to="/admin/control-center" replace />} />
        <Route path="/admin/users" element={<Navigate to="/admin/control-center" replace />} />
        <Route path="/admin/content" element={<Navigate to="/admin/control-center" replace />} />
        <Route path="/admin/control-center" element={<ProtectedRoute allowedRoles={['admin']}><Layout><ControlCenter /></Layout></ProtectedRoute>} />

        {/* Common Routes */}
        <Route path="/forum" element={<Layout><Forum /></Layout>} />

        {/* 404 */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
      </Suspense>
    </Router>
  )
}

export default App