import { useParams } from 'react-router-dom'
import { FiBarChart2, FiAward } from 'react-icons/fi'

export default function StudentProgress() {
  const { studentId } = useParams()

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Student Progress</h1>

        <div className="card mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
              JD
            </div>
            <div>
              <h2 className="text-2xl font-bold">John Doe</h2>
              <p className="text-neutral-600 dark:text-neutral-400">Student • john@example.com</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-neutral-200 dark:border-neutral-700">
            <div className="text-center">
              <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <p className="text-2xl font-bold">62%</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Completion</p>
            </div>
            <div className="text-center">
              <FiAward className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
              <p className="text-2xl font-bold">1,250</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">8</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Days Streak</p>
            </div>
          </div>
        </div>

        {/* Course Progress */}
        <h3 className="text-2xl font-bold mb-4">Course Progress</h3>
        <div className="space-y-4">
          {['English Fundamentals', 'Grammar Basics', 'Vocabulary Builder'].map((course, idx) => (
            <div key={idx} className="card">
              <div className="mb-3">
                <p className="font-bold">{course}</p>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${45 + idx * 15}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {45 + idx * 15}% complete
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
