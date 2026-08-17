import { useEffect } from 'react'
import { useLearningStore } from '../store/learningStore'
import { FiArrowRight, FiBook, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function Home() {
  const { courses, fetchCourses } = useLearningStore()

  useEffect(() => {
    fetchCourses({ limit: 6 })
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-500 text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Learn Languages Interactively
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100">
            Master new languages through engaging lessons, interactive exercises, and gamified learning
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/courses"
              className="btn btn-primary bg-white text-primary-600 hover:bg-neutral-50 px-8 py-3 text-lg font-semibold"
            >
              Explore Courses
            </Link>
            <Link
              to="/register"
              className="btn btn-outline border-white text-white hover:bg-white hover:bg-opacity-10 px-8 py-3 text-lg font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white dark:bg-neutral-800">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Language Learn Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: FiBook,
                title: 'Interactive Lessons',
                description: 'Engaging content with multimedia elements',
              },
              {
                icon: FiAward,
                title: 'Gamification',
                description: 'Earn badges, points, and compete on leaderboards',
              },
              {
                icon: FiUsers,
                title: 'Community',
                description: 'Connect with other learners in study groups',
              },
              {
                icon: FiTrendingUp,
                title: 'Progress Tracking',
                description: 'Monitor your learning journey with detailed analytics',
              },
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="card text-center">
                  <Icon className="w-12 h-12 mx-auto mb-4 text-primary-500" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Featured Courses</h2>
            <Link to="/courses" className="text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-2">
              View All <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 6).map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="card hover:shadow-xl transition-shadow"
              >
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-40 object-cover rounded mb-4"
                  />
                )}
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                  {course.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-500 font-semibold">{course.language}</span>
                  <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
                    {course.level}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-lg mb-8 text-primary-100">
            Join thousands of learners and start your language journey today
          </p>
          <Link
            to="/register"
            className="btn bg-white text-primary-600 hover:bg-neutral-50 px-8 py-3 text-lg font-semibold inline-block"
          >
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  )
}
