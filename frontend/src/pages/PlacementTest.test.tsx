import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import PlacementTest from './PlacementTest'
import { useLanguageStore } from '../store/languageStore'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

const buildQuestions = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    _id: `q${i + 1}`,
    question: `Mock question ${i + 1}?`,
    options: ['A', 'B'],
    cefr: 'A1',
  }))

// Regression coverage for a release blocker: the placement test's static intro copy used to
// hardcode "16 questions" while the real bank has 32, and the honest, confidence-labeled
// result (GET /api/progress/skill-profile) was never surfaced to the user - the screen stated
// a bare CEFR letter as settled fact. These tests don't re-assert the static "32" copy string
// (that's just text, easy to eyeball) - they instead guard the two things that actually caused
// the original bug: the in-progress question counter must come from the real fetched data, not
// a hardcoded number, and the confidence caveat must actually be wired to the live endpoint.
describe('PlacementTest', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    useLanguageStore.setState({ language: 'en' })
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    mockedApi.post.mockResolvedValue({ data: {} }) // covers fire-and-forget analytics tracking calls
  })

  it('derives the displayed question count from the real fetched question bank, not a hardcoded number', async () => {
    const user = userEvent.setup()
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/placement/questions') return Promise.resolve({ data: { data: buildQuestions(5) } })
      return Promise.resolve({ data: {} })
    })

    render(
      <MemoryRouter initialEntries={['/placement-test']}>
        <PlacementTest />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /start test/i }))

    expect(await screen.findByText('Question 1 of 5')).toBeInTheDocument()
    expect(screen.getByText('Mock question 1?')).toBeInTheDocument()
  })

  it('surfaces the live confidence note from the skill-profile endpoint on the result screen', async () => {
    const user = userEvent.setup()
    const liveConfidenceNote = 'Based on a single 32-question placement test, not an ongoing adaptive assessment.'

    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/placement/questions') return Promise.resolve({ data: { data: buildQuestions(2) } })
      if (url === '/progress/skill-profile') return Promise.resolve({ data: { data: { confidenceNote: liveConfidenceNote } } })
      return Promise.resolve({ data: {} })
    })
    mockedApi.post.mockImplementation((url: string) => {
      if (url === '/placement/submit') {
        return Promise.resolve({ data: { data: { cefr: 'B1', level: 'Intermediate', totalCorrect: 2, totalQuestions: 2, recommendedCourses: [] } } })
      }
      return Promise.resolve({ data: {} })
    })

    render(
      <MemoryRouter initialEntries={['/placement-test']}>
        <PlacementTest />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /start test/i }))
    await screen.findByText('Question 1 of 2')

    await user.click(screen.getByText('A'))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByText('Question 2 of 2')

    await user.click(screen.getByText('A'))
    await user.click(screen.getByRole('button', { name: /see my result/i }))

    expect(await screen.findByText('Intermediate (B1)')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(liveConfidenceNote)).toBeInTheDocument())
  })

  it('falls back to a static confidence disclaimer if the skill-profile request fails', async () => {
    const user = userEvent.setup()
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/placement/questions') return Promise.resolve({ data: { data: buildQuestions(1) } })
      if (url === '/progress/skill-profile') return Promise.reject(new Error('network error'))
      return Promise.resolve({ data: {} })
    })
    mockedApi.post.mockImplementation((url: string) => {
      if (url === '/placement/submit') {
        return Promise.resolve({ data: { data: { cefr: 'A2', level: 'Beginner', totalCorrect: 1, totalQuestions: 1, recommendedCourses: [] } } })
      }
      return Promise.resolve({ data: {} })
    })

    render(
      <MemoryRouter initialEntries={['/placement-test']}>
        <PlacementTest />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /start test/i }))
    await screen.findByText('Question 1 of 1')
    await user.click(screen.getByText('A'))
    await user.click(screen.getByRole('button', { name: /see my result/i }))

    expect(await screen.findByText('Beginner (A2)')).toBeInTheDocument()
    expect(
      screen.getByText('This is a starting estimate from one placement test, not a precise or official measurement.')
    ).toBeInTheDocument()
  })
})
