import { useState } from 'react'
import { FiPlus, FiUsers } from 'react-icons/fi'

export default function Groups() {
  const [groups] = useState([
    {
      id: 1,
      name: 'English Learners Group',
      members: 24,
      language: 'English',
      level: 'Beginner',
      description: 'A community for English learners to practice together',
    },
    {
      id: 2,
      name: 'Spanish Conversation Club',
      members: 18,
      language: 'Spanish',
      level: 'Intermediate',
      description: 'Practice conversational Spanish with native speakers',
    },
  ])

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Study Groups</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Join or create study groups</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <FiPlus size={20} /> Create Group
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => (
            <div key={group.id} className="card">
              <h3 className="text-xl font-bold mb-2">{group.name}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">{group.description}</p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
                    {group.language}
                  </span>
                  <span className="text-sm bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 px-3 py-1 rounded-full">
                    {group.level}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <FiUsers size={16} />
                  <span>{group.members} members</span>
                </div>
                <button className="btn btn-primary">Join</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
