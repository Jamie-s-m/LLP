import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import Assignments from './Assignments'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

const COURSE_ID = 'course-1'

const LESSON = { _id: 'lesson-1', title: 'Greetings', order: 1 }
const STUDENT = {
  studentId: 'student-1',
  firstName: 'Aziz',
  lastName: 'Karimov',
  email: 'aziz@example.com',
  progressPercentage: 40,
  isCompleted: false,
}
const ASSIGNMENT = {
  _id: 'assignment-1',
  title: 'Finish Lesson 1',
  description: 'Read and review the vocabulary.',
  lesson: LESSON._id,
  exercise: undefined,
  students: [STUDENT.studentId],
  group: undefined,
  dueDate: undefined,
  completedCount: 2,
  totalCount: 5,
  createdAt: new Date().toISOString(),
}

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={[`/teacher/course/${COURSE_ID}/assignments`]}>
      <Routes>
        <Route path="/teacher/course/:courseId/assignments" element={<Assignments />} />
      </Routes>
    </MemoryRouter>
  )

describe('Assignments (teacher)', () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: 'en' })
    useAuthStore.setState({ user: { id: 'teacher-1', firstName: 'Teacher', lastName: 'One', email: 't@example.com', role: 'teacher' } as any })

    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    mockedApi.delete.mockReset()

    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/courses/${COURSE_ID}`) {
        return Promise.resolve({
          data: { data: { course: { _id: COURSE_ID, title: 'French Basics' }, lessons: [LESSON] } },
        })
      }
      if (url === `/assignments/course/${COURSE_ID}`) {
        return Promise.resolve({ data: { data: [ASSIGNMENT] } })
      }
      if (url === `/courses/${COURSE_ID}/students`) {
        return Promise.resolve({ data: { data: [STUDENT] } })
      }
      if (url === '/groups') {
        return Promise.resolve({ data: { data: [] } })
      }
      if (url === `/assignments/${ASSIGNMENT._id}`) {
        return Promise.resolve({
          data: {
            data: {
              ...ASSIGNMENT,
              students: [{ studentId: STUDENT.studentId, name: 'Aziz Karimov', completed: true }],
            },
          },
        })
      }
      return Promise.resolve({ data: { data: {} } })
    })

    mockedApi.post.mockResolvedValue({
      data: {
        data: {
          _id: 'assignment-2',
          title: 'New Assignment',
          description: '',
          lesson: LESSON._id,
          students: [STUDENT.studentId],
          completedCount: 0,
          totalCount: 1,
          createdAt: new Date().toISOString(),
        },
      },
    })
    mockedApi.delete.mockResolvedValue({ data: { success: true, message: 'Deleted' } })
  })

  it('renders the assignment list with real completedCount/totalCount text', async () => {
    renderAt()

    expect(await screen.findByText('Finish Lesson 1')).toBeInTheDocument()
    expect(screen.getByText('2 of 5 completed')).toBeInTheDocument()
  })

  it('deletes an assignment after confirmation and removes it from the list', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderAt()

    await screen.findByText('Finish Lesson 1')
    const deleteButton = screen.getByRole('button', { name: /delete assignment/i })
    await user.click(deleteButton)

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockedApi.delete).toHaveBeenCalledWith(`/assignments/${ASSIGNMENT._id}`)
    expect(screen.queryByText('Finish Lesson 1')).not.toBeInTheDocument()

    confirmSpy.mockRestore()
  })

  it('expands an assignment to show the per-student completion breakdown', async () => {
    const user = userEvent.setup()
    renderAt()

    await screen.findByText('Finish Lesson 1')
    await user.click(screen.getByRole('button', { name: /details/i }))

    expect(await screen.findByText('Aziz Karimov')).toBeInTheDocument()
    expect(mockedApi.get).toHaveBeenCalledWith(`/assignments/${ASSIGNMENT._id}`)
  })

  it('submits the create form in lesson-plus-students mode with the expected payload shape', async () => {
    const user = userEvent.setup()
    renderAt()

    await screen.findByText('Finish Lesson 1')
    await user.click(screen.getByRole('button', { name: /new assignment/i }))

    await user.type(screen.getByLabelText('Title'), 'New Assignment')

    const lessonSelect = screen.getByLabelText('Lesson')
    await user.selectOptions(lessonSelect, LESSON._id)

    const studentCheckbox = screen.getByRole('checkbox', { name: /Aziz Karimov/i })
    await user.click(studentCheckbox)

    const form = lessonSelect.closest('form') as HTMLFormElement
    await user.click(within(form).getByRole('button', { name: /create assignment/i }))

    expect(mockedApi.post).toHaveBeenCalledWith('/assignments', {
      title: 'New Assignment',
      description: undefined,
      courseId: COURSE_ID,
      lessonId: LESSON._id,
      studentIds: [STUDENT.studentId],
    })
  })
})
