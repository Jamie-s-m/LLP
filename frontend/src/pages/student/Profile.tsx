import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { FiEdit2, FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    nativeLanguage: user?.nativeLanguage || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    toast.success('Profile updated successfully!')
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Profile Settings</h1>

        <div className="card">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-neutral-200 dark:border-neutral-700">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold">
              {user?.firstName?.charAt(0)}
            </div>
            <div>
              <p className="text-2xl font-bold">{user?.firstName} {user?.lastName}</p>
              <p className="text-neutral-600 dark:text-neutral-400">{user?.role}</p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="input"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="input"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                className="input"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div>
              <label className="label">Native Language</label>
              <select
                name="nativeLanguage"
                className="input"
                value={formData.nativeLanguage}
                onChange={handleChange}
                disabled={!isEditing}
              >
                <option value="">Select a language</option>
                <option value="English">English</option>
                <option value="Turkish">Turkish</option>
                <option value="Russian">Russian</option>
                <option value="Uzbek">Uzbek</option>
              </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-neutral-200 dark:border-neutral-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-500">1,250</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary-500">12</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">5</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Badges</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 btn btn-primary flex items-center justify-center gap-2"
              >
                <FiEdit2 size={20} /> Edit Profile
              </button>
            ) : (
              <>
                <button onClick={handleSave} className="flex-1 btn btn-primary flex items-center justify-center gap-2">
                  <FiSave size={20} /> Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
