import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function CreateCourse() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'English',
    level: 'Beginner',
    category: 'Grammar',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Course created successfully!')
    navigate('/teacher/dashboard')
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Create New Course</h1>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="label">Course Title</label>
            <input
              type="text"
              name="title"
              className="input"
              placeholder="e.g., English Grammar Basics"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              className="input min-h-32"
              placeholder="Describe your course..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Language</label>
              <select name="language" className="input" value={formData.language} onChange={handleChange}>
                <option value="English">English</option>
                <option value="Turkish">Turkish</option>
                <option value="Russian">Russian</option>
                <option value="Uzbek">Uzbek</option>
              </select>
            </div>
            <div>
              <label className="label">Level</label>
              <select name="level" className="input" value={formData.level} onChange={handleChange}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Category</label>
            <select name="category" className="input" value={formData.category} onChange={handleChange}>
              <option value="Grammar">Grammar</option>
              <option value="Vocabulary">Vocabulary</option>
              <option value="Conversation">Conversation</option>
              <option value="Reading">Reading</option>
              <option value="Writing">Writing</option>
              <option value="Listening">Listening</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button type="submit" className="btn btn-primary flex-1">
              Create Course
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
