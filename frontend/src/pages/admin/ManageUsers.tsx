import { useState } from 'react'
import { FiEdit2, FiTrash2, FiShield } from 'react-icons/fi'

export default function ManageUsers() {
  const [users] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'student',
      joinDate: '2024-01-15',
      status: 'active',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'teacher',
      joinDate: '2024-02-10',
      status: 'active',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'student',
      joinDate: '2024-03-05',
      status: 'inactive',
    },
  ])

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Manage Users</h1>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <th className="text-left py-4 px-4 font-bold">Name</th>
              <th className="text-left py-4 px-4 font-bold">Email</th>
              <th className="text-left py-4 px-4 font-bold">Role</th>
              <th className="text-left py-4 px-4 font-bold">Join Date</th>
              <th className="text-left py-4 px-4 font-bold">Status</th>
              <th className="text-center py-4 px-4 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <td className="py-4 px-4 font-medium">{user.name}</td>
                <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">{user.email}</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm">
                    <FiShield size={14} /> {user.role}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-neutral-600 dark:text-neutral-400">{user.joinDate}</td>
                <td className="py-4 px-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      user.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {user.status}
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
