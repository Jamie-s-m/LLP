import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiUsers } from 'react-icons/fi'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

interface GroupMember { _id: string }
interface GroupItem {
  _id: string
  name: string
  description: string
  language?: string
  level?: string
  members: GroupMember[]
}
export default function Groups() {
  const { user } = useAuthStore()
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', language: 'English', level: 'Beginner' })

  const loadGroups = () => {
    setLoading(true)
    api.get('/groups')
      .then((response) => setGroups(response.data.data || []))
      .catch(() => toast.error('Unable to load groups'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadGroups() }, [])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await api.post('/groups', formData)
      toast.success('Group created!')
      setShowForm(false)
      setFormData({ name: '', description: '', language: 'English', level: 'Beginner' })
      loadGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Group could not be created')
    }
  }

  const handleJoin = async (groupId: string) => {
    try {
      await api.post(`/groups/${groupId}/join`)
      toast.success('Joined group!')
      loadGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not join group')
    }
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="atlas-heading">
            <p className="atlas-kicker">Community circles</p>
            <h1>Study Groups</h1>
            <p>Join language-focused groups or create a new space for collaborative practice.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
            <FiPlus size={20} /> Create Group
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="atlas-panel mb-8 space-y-4 p-6">
            <input className="input" placeholder="Group name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <textarea className="input" placeholder="Description" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <select className="input" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
                <option value="English">English</option>
                <option value="Turkish">Turkish</option>
                <option value="Russian">Russian</option>
                <option value="Uzbek">Uzbek</option>
              </select>
              <select className="input" value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Create</button>
          </form>
        )}

        {loading ? (
          <div className="atlas-panel p-6 text-muted">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="atlas-panel p-6 text-muted">No study groups yet. Start one!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((group) => {
              const isMember = user ? group.members?.some((member) => member._id === user.id) : false
              return (
                <div key={group._id} className="atlas-panel p-6">
                  <h3 className="text-xl font-bold mb-2 text-ink dark:text-white">{group.name}</h3>
                  <p className="text-muted mb-4">{group.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      {group.language && (
                        <span className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
                          {group.language}
                        </span>
                      )}
                      {group.level && (
                        <span className="text-sm bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 px-3 py-1 rounded-full">
                          {group.level}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2 text-muted">
                      <FiUsers size={16} />
                      <span>{group.members?.length || 0} members</span>
                    </div>
                    <button onClick={() => handleJoin(group._id)} disabled={isMember} className="btn btn-primary disabled:opacity-50">
                      {isMember ? 'Joined' : 'Join'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
