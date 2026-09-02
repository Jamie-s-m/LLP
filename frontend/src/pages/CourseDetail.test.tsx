import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import CourseDetail from './CourseDetail'
import { useLearningStore } from '../store/learningStore'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

const COURSE_ID = 'course-1'

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={[`/courses/${COURSE_ID}`]}>
      <Routes>
        <Route path="/courses/:id" element={<CourseDetail />} />
      </Routes>
    </MemoryRouter>
  )

// Regression coverage for Phase 6: GET /certificates/mastery/:courseId now also returns a
// per-skill breakdown and level readiness, and CourseDetail renders it for enrolled students -
// previously this data existed on the backend with zero frontend callers.
describe('CourseDetail mastery panel', () => {
  beforeEach(() => {
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    useAuthStore.setState({ isAuthenticated: true })
    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/courses/${COURSE_ID}`) {
        return Promise.resolve({
          data: {
            data: {
              course: { _id: COURSE_ID, title: 'Course One', description: 'A course', language: 'English', level: 'Beginner', category: 'Reading' },
              lessons: [{ _id: 'lesson-1', title: 'Lesson One', order: 1 }],
            },
          },
        })
      }
      if (url === `/certificates/mastery/${COURSE_ID}`) {
        return Promise.resolve({
          data: {
            data: {
              completionPercentage: 50,
              masteryPercentage: 25,
              skills: [
                { skill: 'grammar', attemptCount: 3, totalExercises: 2, state: 'mastered' },
                { skill: 'vocabulary', attemptCount: 0, totalExercises: 0, state: 'not_started' },
              ],
              levelReadiness: { A1: { ready: true, reason: 'mastery_evidence_sufficient' }, A2: { ready: false, reason: 'mastery_evidence_insufficient' } },
            },
          },
        })
      }
      return Promise.resolve({ data: { data: {} } })
    })
  })

  it('shows the mastery panel with completion/mastery stats, level readiness, and per-skill states for an enrolled student', async () => {
    useLearningStore.setState({
      myLearning: [{
        _id: 'progress-1',
        user: 'user-1',
        course: { _id: COURSE_ID, title: 'Course One', description: '', language: 'English', level: 'Beginner' },
        completedLessons: [],
        progressPercentage: 50,
        isCompleted: false,
        lastAccessedAt: new Date().toISOString(),
      }],
    })

    renderAt()

    expect(await screen.findByText('50%')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('A1: Ready')).toBeInTheDocument()
    expect(screen.getByText('A2: Not yet')).toBeInTheDocument()
    expect(screen.getByText('Grammar')).toBeInTheDocument()
    expect(screen.getByText('Mastered')).toBeInTheDocument()
  })

  it('does not show the mastery panel for a student who is not enrolled', async () => {
    useLearningStore.setState({ myLearning: [] })

    renderAt()

    await screen.findByText('Course One')
    expect(screen.queryByText('Mastery in this course')).not.toBeInTheDocument()
  })
})
