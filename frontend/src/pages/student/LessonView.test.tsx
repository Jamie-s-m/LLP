import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import LessonView from './LessonView'
import { useLearningStore } from '../../store/learningStore'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
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
