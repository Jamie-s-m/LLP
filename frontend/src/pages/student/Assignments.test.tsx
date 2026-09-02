import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Assignments from './Assignments'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn> }

describe('Assignments', () => {
  beforeEach(() => {
    mockedApi.get.mockReset()
  })

  it('renders assignments with real title, description, and completion state', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'a1',
            title: 'Greetings Lesson',
            description: 'Say hello in three ways',
            course: 'course-1',
            lesson: 'lesson-1',
            dueDate: '2099-01-01T00:00:00.000Z',
            completed: false,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            _id: 'a2',
            title: 'Numbers Exercise',
            course: 'course-1',
            exercise: 'exercise-1',
            completed: true,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    })

    render(
      <MemoryRouter>
        <Assignments />
      </MemoryRouter>
    )

    expect(await screen.findByText('Greetings Lesson')).toBeInTheDocument()
    expect(screen.getByText('Say hello in three ways')).toBeInTheDocument()
    expect(screen.getByText('Not yet done')).toBeInTheDocument()

    expect(screen.getByText('Numbers Exercise')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('links a lesson-based assignment to /lesson/:id and an exercise-based one to /exercise/:id', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'a1',
            title: 'Lesson Assignment',
            course: 'course-1',
            lesson: 'lesson-42',
            completed: false,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            _id: 'a2',
            title: 'Exercise Assignment',
            course: 'course-1',
            exercise: 'exercise-99',
            completed: false,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    })

    render(
      <MemoryRouter>
        <Assignments />
      </MemoryRouter>
    )

    const lessonLink = await screen.findByRole('link', { name: /open lesson/i })
    expect(lessonLink).toHaveAttribute('href', '/lesson/lesson-42')

    const exerciseLink = screen.getByRole('link', { name: /open exercise/i })
    expect(exerciseLink).toHaveAttribute('href', '/exercise/exercise-99')
  })

  it('sorts incomplete assignments before completed ones regardless of response order', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'done',
            title: 'Already Done',
            course: 'course-1',
            lesson: 'lesson-1',
            completed: true,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            _id: 'todo',
            title: 'Still Pending',
            course: 'course-1',
            lesson: 'lesson-2',
            completed: false,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    })

    render(
      <MemoryRouter>
        <Assignments />
      </MemoryRouter>
    )

    await screen.findByText('Still Pending')
    const titles = screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent)
    expect(titles).toEqual(['Still Pending', 'Already Done'])
  })

  it('flags an overdue incomplete assignment but not a completed one with an equally past due date', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'overdue',
            title: 'Overdue Assignment',
            course: 'course-1',
            lesson: 'lesson-1',
            dueDate: '2020-01-01T00:00:00.000Z',
            completed: false,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            _id: 'done-past',
            title: 'Completed Past Due',
            course: 'course-1',
            lesson: 'lesson-2',
            dueDate: '2020-01-01T00:00:00.000Z',
            completed: true,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    })

    render(
      <MemoryRouter>
        <Assignments />
      </MemoryRouter>
    )

    await screen.findByText('Overdue Assignment')
    expect(screen.getAllByText('Overdue')).toHaveLength(1)

    const overdueCard = screen.getByText('Overdue Assignment').closest('div.atlas-panel')
    const completedCard = screen.getByText('Completed Past Due').closest('div.atlas-panel')
    expect(overdueCard).toHaveTextContent('Overdue')
    expect(completedCard).not.toHaveTextContent('Overdue')
  })

  it('shows a friendly empty state when there are no assignments', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: [] } })

    render(
      <MemoryRouter>
        <Assignments />
      </MemoryRouter>
    )

    expect(await screen.findByText('No assignments yet')).toBeInTheDocument()
  })
})
