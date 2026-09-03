import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import LessonView from './LessonView'
import { useLearningStore } from '../../store/learningStore'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

const LESSON_ID = 'lesson-1'

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={[`/lesson/${LESSON_ID}`]}>
      <Routes>
        <Route path="/lesson/:lessonId" element={<LessonView />} />
      </Routes>
    </MemoryRouter>
  )

// Regression coverage for Phase 7: getLessonById now returns a stripped shell (with
// meta.locked: true) instead of full content for a gated lesson - LessonView must render a
// locked state with an upgrade path, not crash on the now-missing content/vocabulary/grammar/
// exercises fields.
describe('LessonView paywall gating', () => {
  beforeEach(() => {
    useLearningStore.setState({ myLearning: [] })
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    mockedApi.post.mockResolvedValue({ data: {} }) // covers fire-and-forget analytics tracking calls
  })

  it('renders the full lesson content when the backend returns it unlocked', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/lessons/${LESSON_ID}`) {
        return Promise.resolve({
          data: {
            data: {
              _id: LESSON_ID, title: 'Free Lesson', description: 'A free lesson', content: 'Real lesson body',
              course: 'course-1', order: 1, duration: 10, vocabulary: [], grammar: [], exercises: [],
            },
          },
        })
      }
      if (url === '/lessons') return Promise.resolve({ data: { data: [] } })
      return Promise.resolve({ data: { data: {} } })
    })

    renderAt()

    expect(await screen.findByText('Real lesson body')).toBeInTheDocument()
    expect(screen.queryByText('This lesson is part of your plan')).not.toBeInTheDocument()
  })

  it('renders a locked state with an upgrade link when the backend returns a locked shell', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/lessons/${LESSON_ID}`) {
        return Promise.resolve({
          data: {
            data: { _id: LESSON_ID, title: 'Gated Lesson', description: 'A gated lesson', course: 'course-1', order: 3 },
            meta: { locked: true, requiresUpgrade: true },
          },
        })
      }
      if (url === '/lessons') return Promise.resolve({ data: { data: [] } })
      return Promise.resolve({ data: { data: {} } })
    })

    renderAt()

    expect(await screen.findByText('This lesson is part of your plan')).toBeInTheDocument()
    const upgradeLink = screen.getByRole('link', { name: /view plans/i })
    expect(upgradeLink).toHaveAttribute('href', '/pricing')
    expect(screen.queryByText('Mark as Completed')).not.toBeInTheDocument()
  })
})

// Phase 20: the unified in-lesson practice flow (Learn -> one ExerciseRunner step per
// exercise -> Complete), replacing the old pattern of linking out to a separate
// /exercise/:id route per exercise. Drives two auto-graded exercise types end to end
// (speaking is excluded here - it needs real microphone access, covered instead by
// ExerciseRunner's disabled-without-a-recording state and the backend's own
// pending_review test coverage in quiz-types-and-placement.test.js).
describe('LessonView unified practice flow', () => {
  const EX1 = 'ex-mc'
  const EX2 = 'ex-fill'

  beforeEach(() => {
    useLearningStore.setState({ myLearning: [] })
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    mockedApi.post.mockImplementation((url: string) => {
      if (url === '/exercises/submit') {
        return Promise.resolve({ data: { data: { isCorrect: true, points: 10, correctAnswer: 0, hearts: 5, maxHearts: 5, heartsRegenAt: null, unlockedBadges: [] } } })
      }
      if (url === '/progress/complete-lesson') {
        return Promise.resolve({ data: { success: true, data: {}, unlockedBadges: [{ name: 'First Steps', icon: 'PiPlantDuotone' }] } })
      }
      return Promise.resolve({ data: {} })
    })
    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/lessons/${LESSON_ID}`) {
        return Promise.resolve({
          data: {
            data: {
              _id: LESSON_ID, title: 'Practice Lesson', description: 'desc', content: 'body',
              course: 'course-1', order: 1, duration: 10, vocabulary: [], grammar: [],
              exercises: [
                { _id: EX1, title: 'MC', type: 'multiple_choice', points: 10 },
                { _id: EX2, title: 'Fill', type: 'fill_blank', points: 10 },
              ],
            },
          },
        })
      }
      if (url === '/lessons') return Promise.resolve({ data: { data: [] } })
      if (url === '/progress/my-learning') return Promise.resolve({ data: { data: [] } })
      if (url === '/gamification/hearts') return Promise.resolve({ data: { data: { hearts: 5, maxHearts: 5 } } })
      if (url === `/exercises/${EX1}`) {
        return Promise.resolve({ data: { data: { _id: EX1, type: 'multiple_choice', question: 'Pick one', options: ['a', 'b'], points: 10 } } })
      }
      if (url === `/exercises/${EX2}`) {
        return Promise.resolve({ data: { data: { _id: EX2, type: 'fill_blank', question: 'Fill it', points: 10 } } })
      }
      return Promise.resolve({ data: { data: {} } })
    })
  })

  it('walks Learn -> both exercises -> Complete, awarding the badge unlocked on completion', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={[`/lesson/${LESSON_ID}`]}>
        <Routes>
          <Route path="/lesson/:lessonId" element={<LessonView />} />
        </Routes>
      </MemoryRouter>
    )

    await user.click(await screen.findByRole('button', { name: 'Start Practice' }))

    // Step 1: multiple_choice
    await user.click(await screen.findByRole('button', { name: 'a' }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))
    await user.click(await screen.findByRole('button', { name: 'Continue' }))

    // Step 2: fill_blank
    await user.type(await screen.findByLabelText('Your answer'), 'answer')
    await user.click(screen.getByRole('button', { name: /submit answer/i }))
    await user.click(await screen.findByRole('button', { name: 'Continue' }))

    // Completion screen
    expect(await screen.findByText('Lesson complete!')).toBeInTheDocument()
    expect(screen.getByText(/worked through 2 exercises/i)).toBeInTheDocument()
    expect(screen.getByText(/Badge unlocked: First Steps!/i)).toBeInTheDocument()
    expect(mockedApi.post).toHaveBeenCalledWith('/progress/complete-lesson', { courseId: 'course-1', lessonId: LESSON_ID })
  })
})
