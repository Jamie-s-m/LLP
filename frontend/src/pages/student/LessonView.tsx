import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiVolume2 } from 'react-icons/fi'

export default function LessonView() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [completed, setCompleted] = useState(false)

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-bold">Lesson {lessonId}</h1>
            <p className="text-neutral-600 dark:text-neutral-400">English - Beginner</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Lesson Content */}
            <div className="card mb-8">
              <h2 className="text-2xl font-bold mb-4">Introduction to English</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-4">
                  Welcome to this beginner English lesson! In this lesson, you will learn basic vocabulary and common phrases used in everyday conversations.
                </p>
              </div>
            </div>

            {/* Vocabulary Section */}
            <div className="card mb-8">
              <h3 className="text-xl font-bold mb-4">New Vocabulary</h3>
              <div className="space-y-4">
                {[
                  { word: 'Hello', pronunciation: 'hə-ˈlō', translation: 'Greeting' },
                  { word: 'Thank you', pronunciation: 'ˈthaŋk yü', translation: 'Expression of gratitude' },
                  { word: 'Please', pronunciation: 'ˈplēz', translation: 'Polite request' },
                ].map((item, idx) => (
                  <div key={idx} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-lg font-bold">{item.word}</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.pronunciation}</p>
                      </div>
                      <button className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900 rounded-lg transition-colors">
                        <FiVolume2 size={20} className="text-primary-500" />
                      </button>
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300">{item.translation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Grammar */}
            <div className="card mb-8">
              <h3 className="text-xl font-bold mb-4">Grammar Tip</h3>
              <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                In English, the basic sentence structure is Subject + Verb + Object (SVO).
              </p>
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                <p className="font-mono text-primary-700 dark:text-primary-300">
                  Example: I (Subject) speak (Verb) English (Object)
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="card">
              <button
                onClick={() => setCompleted(!completed)}
                className={`w-full btn ${completed ? 'btn-ghost' : 'btn-primary'} flex items-center justify-center gap-2`}
              >
                {completed && <FiCheckCircle size={20} />}
                {completed ? 'Completed ✓' : 'Mark as Completed'}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="font-bold mb-4">Lesson Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Overall</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
              </div>
              <hr className="my-6 border-neutral-200 dark:border-neutral-700" />
              <div className="space-y-3">
                <button className="w-full btn btn-outline text-left">← Previous Lesson</button>
                <button className="w-full btn btn-primary text-left">Next Lesson →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
