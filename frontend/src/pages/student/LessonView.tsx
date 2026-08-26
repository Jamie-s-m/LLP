import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiVolume2 } from 'react-icons/fi'
import { demoCourses } from '../../data/demoCourses'

export default function LessonView() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [completed, setCompleted] = useState(false)

  // Find lesson data from demo catalog (fallback) so header shows meaningful topic instead of raw id
  const lesson = useMemo(() => {
    if (!lessonId) return null
    for (const course of demoCourses) {
      const found = course.lessons.find((l) => l._id === lessonId)
      if (found) return { ...found, courseTitle: course.title }
    }
    return null
  }, [lessonId])

  const title = lesson?.title || 'Lesson'
  const subtitle = lesson?.courseTitle ? `${lesson.courseTitle} · ${lesson?.difficulty || 'Beginner'}` : 'English - Beginner'

  return (
    <div className="py-6 px-3 sm:px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Back"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">{title}</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"> 
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Lesson Content */}
            <div className="card mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3">{title}</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 mb-4">
                  {lesson?.description || 'Welcome to this lesson. Use the cards and the practice tools to build your knowledge step by step.'}
                </p>
              </div>
            </div>

            {/* Vocabulary Section */}
            <div className="card mb-8">
             <h3 className="text-lg sm:text-xl font-semibold mb-3">New Vocabulary</h3>
              <div className="space-y-3">
                {(
                  lesson?.content
                    ? // If lesson provides content, show simple extraction
                      [
                        { word: 'Hello', pronunciation: 'hə-ˈlō', translation: 'Привет' },
                        { word: 'Thank you', pronunciation: 'ˈthaŋk yü', translation: 'Спасибо' },
                        { word: 'Please', pronunciation: 'ˈplēz', translation: 'Пожалуйста' },
                      ]
                    : [
                        { word: 'Hello', pronunciation: 'hə-ˈlō', translation: 'Привет' },
                        { word: 'Goodbye', pronunciation: 'ɡʊdˈbʌɪ', translation: 'До свидания' },
                        { word: 'Please', pronunciation: 'ˈplēz', translation: 'Пожалуйста' },
                        { word: 'Thank you', pronunciation: 'ˈθæŋk ju', translation: 'Спасибо' },
                      ]
                ).map((item, idx) => (
                  <div key={idx} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-base sm:text-lg font-semibold">{item.word}</p>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">{item.pronunciation}</p>
                      </div>
                      <button className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900 rounded-lg transition-colors">
                        <FiVolume2 size={18} className="text-primary-500" />
                      </button>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{item.translation}</p>
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
                {completed && <FiCheckCircle size={18} />}
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
