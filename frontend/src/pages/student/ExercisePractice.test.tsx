import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import ExercisePractice from './ExercisePractice'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

const EXERCISE_ID = 'exercise-1'

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={[`/exercises/${EXERCISE_ID}`]}>
      <Routes>
        <Route path="/exercises/:exerciseId" element={<ExercisePractice />} />
      </Routes>
    </MemoryRouter>
  )

const HEARTS_RESPONSE = { data: { data: { hearts: 5, maxHearts: 5 } } }

// Regression coverage for the Phase 7 paywall fix made earlier this session: gated exercises
// used to leak their question/options directly to any authenticated user who hit the
// GET /exercises/:id endpoint by ID. The backend now responds with { data: {...no question} ,
// meta: { locked: true } } for a gated exercise, and ExercisePractice must render the
// locked/upgrade card instead of a broken exercise form built from an undefined question.
describe('ExercisePractice paywall lock', () => {
  beforeEach(() => {
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
  })

  it('renders the locked upgrade card - not a broken exercise form - when GET /exercises/:id reports meta.locked', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/exercises/${EXERCISE_ID}`) {
        return Promise.resolve({ data: { data: {}, meta: { locked: true } } })
      }
      if (url === '/gamification/hearts') return Promise.resolve(HEARTS_RESPONSE)
      return Promise.resolve({ data: { data: {} } })
    })

    renderAt()

    expect(await screen.findByText('This exercise is part of your plan')).toBeInTheDocument()
    expect(screen.getByText(/upgrade to unlock the rest/i)).toBeInTheDocument()

    const viewPlansLink = screen.getByRole('link', { name: 'View plans' })
    expect(viewPlansLink).toHaveAttribute('href', '/pricing')
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()

    // The exercise form must not render at all - no Submit Answer button, no undefined question.
    expect(screen.queryByRole('button', { name: /submit answer/i })).not.toBeInTheDocument()
  })
})

// Coverage for the normal (non-locked) exercise-taking flow: a multiple_choice exercise
// renders its question/options, lets the student pick an option, and shows real correct/
// incorrect feedback (via the shared Alert component) once POST /exercises/submit resolves.
describe('ExercisePractice multiple_choice flow', () => {
  beforeEach(() => {
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/exercises/${EXERCISE_ID}`) {
        return Promise.resolve({
          data: {
            data: {
              _id: EXERCISE_ID,
              type: 'multiple_choice',
              question: 'What is the capital of France?',
              options: ['Paris', 'London', 'Berlin'],
              points: 10,
            },
          },
        })
      }
      if (url === '/gamification/hearts') return Promise.resolve(HEARTS_RESPONSE)
      return Promise.resolve({ data: { data: {} } })
    })
  })

  it('lets the student select an option, submit, and see correct feedback', async () => {
    const user = userEvent.setup()
    mockedApi.post.mockResolvedValue({
      data: { data: { isCorrect: true, points: 10, correctAnswer: 0, hearts: 5, maxHearts: 5, heartsRegenAt: null } },
    })

    renderAt()

    expect(await screen.findByText('What is the capital of France?')).toBeInTheDocument()

    const parisOption = screen.getByRole('button', { name: /paris/i })
    await user.click(parisOption)
    expect(parisOption).toHaveAttribute('aria-pressed', 'true')

    const submitButton = screen.getByRole('button', { name: /submit answer/i })
    expect(submitButton).toBeEnabled()
    await user.click(submitButton)

    expect(mockedApi.post).toHaveBeenCalledWith('/exercises/submit', { exerciseId: EXERCISE_ID, answer: 0 })

    const feedback = await screen.findByRole('status')
    expect(feedback).toHaveTextContent('Correct!')
    expect(feedback).toHaveTextContent('You earned 10 points')
  })

  it('shows incorrect feedback as an alert when the submitted answer is wrong', async () => {
    const user = userEvent.setup()
    mockedApi.post.mockResolvedValue({
      data: { data: { isCorrect: false, points: 0, correctAnswer: 0, hearts: 4, maxHearts: 5, heartsRegenAt: null } },
    })

    renderAt()

    await user.click(await screen.findByRole('button', { name: /london/i }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))

    const feedback = await screen.findByRole('alert')
    expect(feedback).toHaveTextContent('Incorrect')
    expect(feedback).toHaveTextContent('You lost a heart')
  })
})

// Regression coverage: when POST /exercises/submit fails with a 403 (the backend's
// out-of-hearts signal), the UI must swap in the dedicated "out of hearts" card rather than
// a generic error toast - this is a real gameplay-blocking state, not just an API error.
describe('ExercisePractice out-of-hearts handling', () => {
  beforeEach(() => {
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/exercises/${EXERCISE_ID}`) {
        return Promise.resolve({
          data: {
            data: {
              _id: EXERCISE_ID,
              type: 'multiple_choice',
              question: 'What is the capital of France?',
              options: ['Paris', 'London', 'Berlin'],
              points: 10,
            },
          },
        })
      }
      if (url === '/gamification/hearts') return Promise.resolve(HEARTS_RESPONSE)
      return Promise.resolve({ data: { data: {} } })
    })
  })

  it('shows the out-of-hearts card, not a generic error, when submit rejects with a 403', async () => {
    const user = userEvent.setup()
    mockedApi.post.mockRejectedValue({
      response: { status: 403, data: { data: { heartsRegenAt: null } } },
    })

    renderAt()

    await user.click(await screen.findByRole('button', { name: /paris/i }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))

    expect(await screen.findByText("You're out of hearts")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refill with coins/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to lesson/i })).toBeInTheDocument()

    // The broken exercise form must be gone entirely - not just overlaid with an error toast.
    expect(screen.queryByText('What is the capital of France?')).not.toBeInTheDocument()
  })
})

// Regression coverage: if GET /exercises/:id rejects outright (network error / 404), the page
// must show a plain "Exercise not found." message instead of crashing on a null exercise.
describe('ExercisePractice missing exercise', () => {
  beforeEach(() => {
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
  })

  it('shows "Exercise not found." when GET /exercises/:id rejects', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === `/exercises/${EXERCISE_ID}`) return Promise.reject(new Error('Not Found'))
      if (url === '/gamification/hearts') return Promise.resolve(HEARTS_RESPONSE)
      return Promise.resolve({ data: { data: {} } })
    })

    renderAt()

    expect(await screen.findByText('Exercise not found.')).toBeInTheDocument()
  })
})
