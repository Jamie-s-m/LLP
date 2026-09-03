import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

const copy = {
  en: { title: 'Create New Course', titleLabel: 'Course Title', titlePlaceholder: 'e.g., English Grammar Basics', description: 'Description', descriptionPlaceholder: 'Describe your course...', language: 'Language', level: 'Level', category: 'Category', create: 'Create Course', creating: 'Creating...', cancel: 'Cancel', success: 'Course created successfully!', failed: 'Course could not be created' },
  ru: { title: 'Создать новый курс', titleLabel: 'Название курса', titlePlaceholder: 'например, Основы английской грамматики', description: 'Описание', descriptionPlaceholder: 'Опишите ваш курс...', language: 'Язык', level: 'Уровень', category: 'Категория', create: 'Создать курс', creating: 'Создание...', cancel: 'Отмена', success: 'Курс успешно создан!', failed: 'Не удалось создать курс' },
  uz: { title: 'Yangi kurs yaratish', titleLabel: 'Kurs nomi', titlePlaceholder: 'masalan, Ingliz grammatikasi asoslari', description: 'Tavsif', descriptionPlaceholder: 'Kursingizni tasvirlang...', language: 'Til', level: 'Daraja', category: 'Kategoriya', create: 'Kurs yaratish', creating: 'Yaratilmoqda...', cancel: 'Bekor qilish', success: 'Kurs muvaffaqiyatli yaratildi!', failed: 'Kursni yaratib bo‘lmadi' },
} as const

const optionLabels = {
  English: { en: 'English', ru: 'Английский', uz: 'Inglizcha' },
  Turkish: { en: 'Turkish', ru: 'Турецкий', uz: 'Turkcha' },
  Russian: { en: 'Russian', ru: 'Русский', uz: 'Ruscha' },
  Uzbek: { en: 'Uzbek', ru: 'Узбекский', uz: 'O‘zbekcha' },
  Beginner: { en: 'Beginner', ru: 'Начальный', uz: 'Boshlang‘ich' },
  Intermediate: { en: 'Intermediate', ru: 'Средний', uz: 'O‘rta' },
  Advanced: { en: 'Advanced', ru: 'Продвинутый', uz: 'Yuqori' },
  Grammar: { en: 'Grammar', ru: 'Грамматика', uz: 'Grammatika' },
  Vocabulary: { en: 'Vocabulary', ru: 'Словарь', uz: 'Lug‘at' },
  Conversation: { en: 'Conversation', ru: 'Разговор', uz: 'Suhbat' },
  Reading: { en: 'Reading', ru: 'Чтение', uz: 'O‘qish' },
  Writing: { en: 'Writing', ru: 'Письмо', uz: 'Yozish' },
  Listening: { en: 'Listening', ru: 'Аудирование', uz: 'Tinglash' },
} as const

export default function CreateCourse() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const response = await api.post('/courses', formData)
      toast.success(ui.success)
      navigate(`/teacher/manage/${response.data.data._id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.failed)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="atlas-page px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">{ui.title}</h1>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="label" htmlFor="create-course-title">{ui.titleLabel}</label>
            <input
              type="text"
              name="title"
              id="create-course-title"
              className="input"
              placeholder={ui.titlePlaceholder}
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="create-course-description">{ui.description}</label>
            <textarea
              name="description"
              id="create-course-description"
              className="input min-h-32"
              placeholder={ui.descriptionPlaceholder}
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="create-course-language">{ui.language}</label>
              <select name="language" id="create-course-language" className="input" value={formData.language} onChange={handleChange}>
                <option value="English">{optionLabels.English[language]}</option>
                <option value="Turkish">{optionLabels.Turkish[language]}</option>
                <option value="Russian">{optionLabels.Russian[language]}</option>
                <option value="Uzbek">{optionLabels.Uzbek[language]}</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="create-course-level">{ui.level}</label>
              <select name="level" id="create-course-level" className="input" value={formData.level} onChange={handleChange}>
                <option value="Beginner">{optionLabels.Beginner[language]}</option>
                <option value="Intermediate">{optionLabels.Intermediate[language]}</option>
                <option value="Advanced">{optionLabels.Advanced[language]}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="create-course-category">{ui.category}</label>
            <select name="category" id="create-course-category" className="input" value={formData.category} onChange={handleChange}>
            <option value="Grammar">{optionLabels.Grammar[language]}</option>
            <option value="Vocabulary">{optionLabels.Vocabulary[language]}</option>
            <option value="Conversation">{optionLabels.Conversation[language]}</option>
            <option value="Reading">{optionLabels.Reading[language]}</option>
            <option value="Writing">{optionLabels.Writing[language]}</option>
            <option value="Listening">{optionLabels.Listening[language]}</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
              {submitting ? ui.creating : ui.create}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline flex-1"
            >
              {ui.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
