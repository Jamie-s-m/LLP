import { useParams } from 'react-router-dom'
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi'

export default function ManageCourse() {
  const { courseId } = useParams()

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Manage Course {courseId || ''}</h1>

        <div className="card mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">English Fundamentals</h2>
            <p className="text-neutral-600 dark:text-neutral-400">English • Beginner • Grammar</p>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-neutral-200 dark:border-neutral-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-500">12</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Lessons</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-500">48</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Students</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">4.8</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Rating</p>
            </div>
          </div>

          <button className="mt-6 btn btn-primary">Edit Course Details</button>
        </div>

        {/* Lessons */}
        <h3 className="text-2xl font-bold mb-4">Lessons</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((lesson) => (
            <div key={lesson} className="card flex items-center justify-between">
              <div>
                <p className="font-bold">Lesson {lesson}: Introduction</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">12 exercises • 45 minutes</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                  <FiEdit2 size={20} />
                </button>
                <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600">
                  <FiTrash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-4 btn btn-outline flex items-center gap-2 w-full">
          <FiPlus size={20} /> Add Lesson
        </button>
      </div>
    </div>
  )
}
