import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Dashboard from './Dashboard'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

// Regression coverage for Phase 6: the Dashboard's "next step" card used to always show a
// generic "resume learning" / "browse courses" prompt, and the overall-completion bar had no
// role="progressbar"/aria-valuenow (an accessibility gap flagged alongside this same batch).
// These tests guard that GET /progress/today's recommendation actually renders, and that the
// progress bar carries real ARIA state.
describe('Dashboard', () => {
  beforeEach(() => {
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    mockedApi.post.mockResolvedValue({ data: {} })
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/users/dashboard-summary') {
        return Promise.resolve({ data: { data: { totalCourses: 2, completedCourses: 1, totalXp: 120, streak: 3 } } })
      }
      if (url === '/family') return Promise.resolve({ data: { data: [] } })
      if (url === '/progress/today') {
        return Promise.resolve({
          data: {
            data: {
              continueLesson: { lessonId: 'lesson-1', courseId: 'course-1', courseTitle: 'Course One', lessonTitle: 'Greetings', cefr: 'A1' },
              weakestSkill: { skill: 'vocabulary', state: 'not_started', courseId: 'course-1' },
              overdueFlashcardCount: 3,
            },
          },
        })
      }
      // DailyReward/CoinStore's own fetches - safe defaults so they render without crashing.
      return Promise.resolve({ data: { data: {} } })
    })
  })

  it('renders the today recommendation: continue-lesson CTA, weak-skill nudge, and flashcard reminder', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    const continueLink = await screen.findByRole('link', { name: /resume learning/i })
    expect(continueLink).toHaveAttribute('href', '/lesson/lesson-1')
    expect(screen.getByText(/pick up where you left off/i)).toBeInTheDocument()
    expect(screen.getByText(/vocabulary/i)).toBeInTheDocument()

    const flashcardLink = await screen.findByRole('link', { name: /3 flashcards are due for review/i })
    expect(flashcardLink).toHaveAttribute('href', '/flashcards')
  })

  it('exposes the overall-completion bar as an accessible progressbar', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    const progressbar = await screen.findByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '50')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '100')
  })

  it('falls back to the generic resume-learning prompt when there is no today recommendation', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/users/dashboard-summary') {
        return Promise.resolve({ data: { data: { totalCourses: 0, completedCourses: 0, totalXp: 0, streak: 0 } } })
      }
      if (url === '/family') return Promise.resolve({ data: { data: [] } })
      if (url === '/progress/today') {
        return Promise.resolve({ data: { data: { continueLesson: null, weakestSkill: null, overdueFlashcardCount: 0 } } })
      }
      return Promise.resolve({ data: { data: {} } })
    })

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    const browseLink = await screen.findByRole('link', { name: /browse courses/i })
    expect(browseLink).toHaveAttribute('href', '/courses')
  })
})
