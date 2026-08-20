import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { FiAward, FiEdit2, FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  nativeLanguage?: string
  xp?: number
  streak?: number
}
interface Achievement {
  _id: string
  badge?: { name: string }
}

export default function Profile() {
  const { setUser } = useAuthStore()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', nativeLanguage: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/users/profile'), api.get('/users/achievements')])
      .then(([profileResponse, achievementsResponse]) => {
        const data = profileResponse.data.data
        setProfile(data)
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          nativeLanguage: data.nativeLanguage || '',
        })
        setAchievements(achievementsResponse.data.data || [])
      })
      .catch(() => toast.error('Unable to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    try {
      const response = await api.put('/users/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        nativeLanguage: formData.nativeLanguage,
      })
      setProfile(response.data.data)
      setUser(response.data.data)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Profile could not be updated')
    }
  }

  if (loading) {
    return <div className="min-h-screen py-12 px-4 text-center">Loading profile...</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Profile Settings</h1>

        <div className="card">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-neutral-200 dark:border-neutral-700">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold">
              {profile?.firstName?.charAt(0)}
            </div>
            <div>
              <p className="text-2xl font-bold">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-neutral-600 dark:text-neutral-400">{profile?.email}</p>
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
                disabled
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
            <div className="grid grid-cols-2 gap-4 py-6 border-t border-neutral-200 dark:border-neutral-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-500">{profile?.xp ?? 0}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary-500">{profile?.streak ?? 0}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Streak</p>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <h3 className="font-bold mb-4 flex items-center gap-2"><FiAward className="text-primary-500" /> Badges</h3>
              {achievements.length === 0 ? (
                <p className="text-sm text-neutral-500">No badges earned yet — keep learning to unlock some!</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {achievements.map((achievement) => (
                    <span key={achievement._id} className="px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm font-medium">
                      {achievement.badge?.name}
                    </span>
                  ))}
                </div>
              )}
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
