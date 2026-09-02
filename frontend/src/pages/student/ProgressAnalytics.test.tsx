import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import ProgressAnalytics from './ProgressAnalytics'
import { useLanguageStore } from '../../store/languageStore'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn> }

// Regression coverage for Phase 6: GET /certificates/mastery/:courseId's data (completion vs.
// real evidence-based mastery, and level readiness) previously had zero frontend callers.
// ProgressAnalytics now surfaces it for the student's enrolled course(s).
describe('ProgressAnalytics course mastery panel', () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: 'en' })
    mockedApi.get.mockReset()
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/progress/skills-breakdown') return Promise.resolve({ data: { data: [] } })
      if (url === '/daily-reward/history') return Promise.resolve({ data: { data: [] } })
      if (url === '/users/dashboard-summary') return Promise.resolve({ data: { data: { totalXp: 0, streak: 0 } } })
      if (url === '/progress/my-learning') {
        return Promise.resolve({
          data: { data: [{ course: { _id: 'course-1', title: 'Course One' } }] },
        })
      }
      if (url === '/certificates/mastery/course-1') {
        return Promise.resolve({
          data: {
            data: {
              completionPercentage: 40,
              masteryPercentage: 10,
              levelReadiness: { A1: { ready: true }, A2: { ready: false } },
            },
          },
        })
      }
      return Promise.resolve({ data: { data: {} } })
    })
  })

  it('shows completion vs. mastery percentages and level readiness for the enrolled course', async () => {
    render(<ProgressAnalytics />)

    expect(await screen.findByText('40%')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('A1: Ready')).toBeInTheDocument()
    expect(screen.getByText('A2: Not yet')).toBeInTheDocument()
  })

  it('hides the course mastery card entirely when the student has no enrolled courses', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/progress/my-learning') return Promise.resolve({ data: { data: [] } })
      if (url === '/progress/skills-breakdown') return Promise.resolve({ data: { data: [] } })
      if (url === '/daily-reward/history') return Promise.resolve({ data: { data: [] } })
      if (url === '/users/dashboard-summary') return Promise.resolve({ data: { data: { totalXp: 0, streak: 0 } } })
      return Promise.resolve({ data: { data: {} } })
    })

    render(<ProgressAnalytics />)

    await screen.findByText('Progress & Analytics')
    expect(screen.queryByText('Course mastery')).not.toBeInTheDocument()
  })
})
