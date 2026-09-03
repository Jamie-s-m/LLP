import { Suspense, lazy, type ComponentType } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import PaywallModal from './components/PaywallModal'
import { initializeLanguage } from './store/languageStore'
import { useI18n } from './utils/i18n'
import DefaultSeo from './components/DefaultSeo'

const CHUNK_RELOAD_KEY = 'linguanest-lazy-chunk-reload'

const lazyWithChunkRetry = <T extends { default: ComponentType<any> }>(importer: () => Promise<T>, chunkKey: string) =>
  lazy(async () => {
    try {
      const module = await importer()
      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
      return module
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const alreadyRetried = sessionStorage.getItem(CHUNK_RELOAD_KEY) === chunkKey
      const isChunkLoadFailure = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(message)

      if (typeof window !== 'undefined' && isChunkLoadFailure && !alreadyRetried) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, chunkKey)
        window.location.reload()
        return new Promise<T>(() => {})
      }

      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
      throw error
    }
  })

const Login = lazyWithChunkRetry(() => import('./pages/auth/Login'), 'login')
const Register = lazyWithChunkRetry(() => import('./pages/auth/Register'), 'register')
const ForgotPassword = lazyWithChunkRetry(() => import('./pages/auth/ForgotPassword'), 'forgot-password')
const ResetPassword = lazyWithChunkRetry(() => import('./pages/auth/ResetPassword'), 'reset-password')
const VerifyEmail = lazyWithChunkRetry(() => import('./pages/auth/VerifyEmail'), 'verify-email')
const GoogleCallback = lazyWithChunkRetry(() => import('./pages/auth/GoogleCallback'), 'google-callback')
const Home = lazyWithChunkRetry(() => import('./pages/Home'), 'home')
const Courses = lazyWithChunkRetry(() => import('./pages/Courses'), 'courses')
const CourseDetail = lazyWithChunkRetry(() => import('./pages/CourseDetail'), 'course-detail')
const Dashboard = lazyWithChunkRetry(() => import('./pages/student/Dashboard'), 'student-dashboard')
const Timetable = lazyWithChunkRetry(() => import('./pages/student/Timetable'), 'student-timetable')
const MyLearning = lazyWithChunkRetry(() => import('./pages/student/MyLearning'), 'my-learning')
const StudentAssignments = lazyWithChunkRetry(() => import('./pages/student/Assignments'), 'student-assignments')
const LessonView = lazyWithChunkRetry(() => import('./pages/student/LessonView'), 'lesson-view')
const ExercisePractice = lazyWithChunkRetry(() => import('./pages/student/ExercisePractice'), 'exercise-practice')
const Flashcards = lazyWithChunkRetry(() => import('./pages/student/Flashcards'), 'flashcards')
const Profile = lazyWithChunkRetry(() => import('./pages/student/Profile'), 'profile')
const Groups = lazyWithChunkRetry(() => import('./pages/student/Groups'), 'groups')
const Leaderboard = lazyWithChunkRetry(() => import('./pages/student/Leaderboard'), 'leaderboard')
const ProgressAnalytics = lazyWithChunkRetry(() => import('./pages/student/ProgressAnalytics'), 'progress-analytics')
const Achievements = lazyWithChunkRetry(() => import('./pages/student/Achievements'), 'achievements')
const PlacementTest = lazyWithChunkRetry(() => import('./pages/PlacementTest'), 'placement-test')
const Onboarding = lazyWithChunkRetry(() => import('./pages/Onboarding'), 'onboarding')
const VerifyCertificate = lazyWithChunkRetry(() => import('./pages/VerifyCertificate'), 'verify-certificate')
const OnboardingPlan = lazyWithChunkRetry(() => import('./pages/OnboardingPlan'), 'onboarding-plan')
const TeacherDashboard = lazyWithChunkRetry(() => import('./pages/teacher/Dashboard'), 'teacher-dashboard')
const TeacherCourses = lazyWithChunkRetry(() => import('./pages/teacher/Courses'), 'teacher-courses')
const CreateCourse = lazyWithChunkRetry(() => import('./pages/teacher/CreateCourse'), 'create-course')
const ManageCourse = lazyWithChunkRetry(() => import('./pages/teacher/ManageCourse'), 'manage-course')
const LessonEditor = lazyWithChunkRetry(() => import('./pages/teacher/LessonEditor'), 'lesson-editor')
const SpeakingReviews = lazyWithChunkRetry(() => import('./pages/teacher/SpeakingReviews'), 'speaking-reviews')
const StudentProgress = lazyWithChunkRetry(() => import('./pages/teacher/StudentProgress'), 'student-progress')
const TeacherAssignments = lazyWithChunkRetry(() => import('./pages/teacher/Assignments'), 'teacher-assignments')
const TeacherAttendance = lazyWithChunkRetry(() => import('./pages/teacher/Attendance'), 'teacher-attendance')
const TeacherClassAnalytics = lazyWithChunkRetry(() => import('./pages/teacher/ClassAnalytics'), 'teacher-class-analytics')
const Forum = lazyWithChunkRetry(() => import('./pages/Forum'), 'forum')
const Chat = lazyWithChunkRetry(() => import('./pages/Chat'), 'chat')
const MoreMenu = lazyWithChunkRetry(() => import('./pages/MoreMenu'), 'more-menu')
const ParentDashboard = lazyWithChunkRetry(() => import('./pages/ParentDashboard'), 'parent-dashboard')
const ChildProgress = lazyWithChunkRetry(() => import('./pages/ChildProgress'), 'child-progress')
const ControlCenter = lazyWithChunkRetry(() => import('./pages/admin/ControlCenter'), 'control-center')
const BusinessMetrics = lazyWithChunkRetry(() => import('./pages/admin/BusinessMetrics'), 'business-metrics')
const Tutors = lazyWithChunkRetry(() => import('./pages/Tutors'), 'tutors')
const Pricing = lazyWithChunkRetry(() => import('./pages/Pricing'), 'pricing')
const Terms = lazyWithChunkRetry(() => import('./pages/Terms'), 'terms')
const Privacy = lazyWithChunkRetry(() => import('./pages/Privacy'), 'privacy')
const Cookies = lazyWithChunkRetry(() => import('./pages/Cookies'), 'cookies')
const NotFound = lazyWithChunkRetry(() => import('./pages/NotFound'), 'not-found')

initializeLanguage()

function App() {
  const { isAuthenticated, user } = useAuthStore()
  const { t } = useI18n()
  const authenticatedLandingPath = user?.role === 'admin'
    ? '/admin/control-center'
    : user?.role === 'moderator'
      ? '/admin/control-center'
    : user?.role === 'teacher'
      ? '/teacher/dashboard'
      : user?.role === 'parent'
        ? '/parent/dashboard'
        : user?.role === 'student' && !user?.onboardingCompletedAt
          ? '/onboarding'
          : '/dashboard'

  return (
    // Render serves the application from the root path.
    <Router basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <DefaultSeo />
      <Toaster position="top-right" />
      <PaywallModal />
      <Suspense fallback={<Layout><div className="atlas-page flex items-center justify-center px-4 py-16"><div className="atlas-panel p-6 text-center text-[var(--text-muted)]">{t('app.loadingPage')}</div></div></Layout>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/courses" element={<Layout><Courses /></Layout>} />
        <Route path="/courses/:id" element={<Layout><CourseDetail /></Layout>} />
        <Route path="/tutors" element={<Layout><Tutors /></Layout>} />
        <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
        <Route path="/terms" element={<Layout><Terms /></Layout>} />
        <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
        <Route path="/cookies" element={<Layout><Cookies /></Layout>} />
        <Route path="/verify/:certificateId" element={<Layout><VerifyCertificate /></Layout>} />
        <Route path="/login" element={isAuthenticated ? <Navigate to={authenticatedLandingPath} replace /> : <Layout><Login /></Layout>} />
        <Route path="/register" element={isAuthenticated ? <Navigate to={authenticatedLandingPath} replace /> : <Layout><Register /></Layout>} />
        <Route path="/verify-email" element={<Layout><VerifyEmail /></Layout>} />
        <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
        <Route path="/auth/google/callback" element={<Layout><GoogleCallback /></Layout>} />
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
        <Route
          path="/timetable"
          element={
            <ProtectedRoute allowedRoles={['student', 'teacher', 'parent', 'moderator', 'admin']}>
              <Layout><Timetable /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute allowedRoles={['student', 'teacher', 'parent', 'moderator', 'admin']}>
              <Layout><Timetable /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><Layout><ParentDashboard /></Layout></ProtectedRoute>} />
        <Route path="/parent/children/:studentId" element={<ProtectedRoute allowedRoles={['parent']}><Layout><ChildProgress /></Layout></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'parent', 'moderator', 'admin']}><Layout><Chat /></Layout></ProtectedRoute>} />
        <Route path="/more" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'parent', 'moderator', 'admin']}><Layout><MoreMenu /></Layout></ProtectedRoute>} />
        <Route
          path="/my-learning"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><MyLearning /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><StudentAssignments /></Layout>
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
            <ProtectedRoute allowedRoles={['student', 'teacher', 'parent', 'moderator', 'admin']}>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
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
        <Route
          path="/progress"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><ProgressAnalytics /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/achievements"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><Achievements /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement-test"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><PlacementTest /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><Onboarding /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/plan"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><OnboardingPlan /></Layout>
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
          path="/teacher/courses"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Layout><TeacherCourses /></Layout>
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
        <Route
          path="/teacher/course/:courseId/assignments"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Layout><TeacherAssignments /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/course/:courseId/analytics"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Layout><TeacherClassAnalytics /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/groups/:groupId/attendance"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Layout><TeacherAttendance /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/lesson/:lessonId"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Layout><LessonEditor /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/speaking-reviews"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Layout><SpeakingReviews /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<Navigate to="/admin/control-center" replace />} />
        <Route path="/admin/users" element={<Navigate to="/admin/control-center" replace />} />
        <Route path="/admin/content" element={<Navigate to="/admin/control-center" replace />} />
        <Route path="/admin/control-center" element={<ProtectedRoute allowedRoles={['admin', 'moderator']}><Layout><ControlCenter /></Layout></ProtectedRoute>} />
        <Route path="/admin/business-metrics" element={<ProtectedRoute allowedRoles={['admin']}><Layout><BusinessMetrics /></Layout></ProtectedRoute>} />

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