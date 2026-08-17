import { useState } from 'react'
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi'

export default function ManageContent() {
  const [courses] = useState([
    {
      id: 1,
      title: 'English Fundamentals',
      language: 'English',
      level: 'Beginner',
      lessons: 12,
      students: 48,
      status: 'published',
    },
    {
      id: 2,
      title: 'Spanish for Travelers',
      language: 'Spanish',
      level: 'Intermediate',
      lessons: 15,
      students: 32,
      status: 'published',
    },
    {
      id: 3,
      title: 'Russian Grammar Basics',
      language: 'Russian',
      level: 'Beginner',
      lessons: 8,
      students: 0,
      status: 'draft',
    },
  ])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Manage Content</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <FiPlus size={20} /> New Course
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <th className="text-left py-4 px-4 font-bold">Course</th>
              <th className="text-left py-4 px-4 font-bold">Language</th>
              <th className="text-left py-4 px-4 font-bold">Level</th>
              <th className="text-center py-4 px-4 font-bold">Lessons</th>
              <th className="text-center py-4 px-4 font-bold">Students</th>
              <th className="text-left py-4 px-4 font-bold">Status</th>
              <th className="text-center py-4 px-4 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr
                key={course.id}
                className="border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <td className="py-4 px-4 font-medium">{course.title}</td>
                <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">{course.language}</td>
                <td className="py-4 px-4">
                  <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm">
                    {course.level}
                  </span>
                </td>
                <td className="py-4 px-4 text-center font-medium">{course.lessons}</td>
                <td className="py-4 px-4 text-center font-medium">{course.students}</td>
                <td className="py-4 px-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      course.status === 'published'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    {course.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                      <FiEdit2 size={18} />
                    </button>
                    <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
