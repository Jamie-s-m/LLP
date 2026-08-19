import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useLearningStore } from '../store/learningStore'
import { useAuthStore } from '../store/authStore'

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { enrollInCourse, myLearning } = useLearningStore()
  const { isAuthenticated } = useAuthStore()
  const [enrolling, setEnrolling] = useState(false)

  // Check if student is already enrolled in this course
  const isEnrolled = myLearning.some(
    (item) => item.course?._id === id || (item.course as any) === id
  )

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to enroll in this course.')
      navigate('/login')
      return
    }

    if (!id) return

    setEnrolling(true)
    const success = await enrollInCourse(id)
    setEnrolling(false)

    if (success) {
      toast.success('Successfully enrolled!')
      navigate('/my-learning')
    } else {
      toast.error('Enrollment failed or already enrolled.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-4">Course Details</h1>
      {/* Course metadata card */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-6">
        <p className="text-slate-300 mb-6">
          Start mastering your target language today with structured exercises and flashcards.
        </p>

        {isEnrolled ? (
          <button
            onClick={() => navigate('/my-learning')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition"
          >
            Continue Learning
          </button>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            {enrolling ? 'Enrolling...' : 'Enroll in Course'}
          </button>
        )}
      </div>
    </div>
  )
}