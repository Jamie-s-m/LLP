import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { vi } from 'vitest'
import Courses from './Courses'
import { useLearningStore } from '../store/learningStore'
import api from '../services/api'

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

const COURSES = [
  {
    _id: 'course-1',
    title: 'English for Beginners',
    description: 'Start speaking English from scratch with everyday vocabulary.',
    language: 'English',
    level: 'Beginner',
    category: 'Conversation',
  },
  {
    _id: 'course-2',
    title: 'Business English Mastery',
    description: 'Professional communication skills for the modern workplace.',
    language: 'English',
    level: 'Intermediate',
    category: 'Business',
  },
  {
    _id: 'course-3',
    title: 'Advanced Grammar Lab',
    description: 'Deep dive into complex grammar structures and usage.',
    language: 'English',
    level: 'Advanced',
    category: 'Grammar',
  },
]

const renderAt = (initialEntry = '/courses') =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Courses />
      </MemoryRouter>
    </HelmetProvider>
  )

// Regression coverage for the Phase 11 course-discovery work: Courses is the main public
// browse/list entry point, backed by useLearningStore's fetchCourses (GET /courses) rather
// than a page-local fetch. These tests guard that the real course list from the store renders
// as cards, that the smart filters (search query, level) actually narrow filteredCourses
// instead of being cosmetic, that a genuine "no matches" empty state renders when filters
// exclude every course, and that filters applied via the URL's query string (e.g. a shared
// "?level=Beginner" link) are read on mount and pre-narrow the visible list.
describe('Courses browse/filter page', () => {
  beforeEach(() => {
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    useLearningStore.setState({ courses: [], myLearning: [], isLoading: false, error: null })
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/courses') {
        return Promise.resolve({ data: { data: COURSES } })
      }
      return Promise.resolve({ data: { data: {} } })
    })
  })

  it('renders one card for every course fetched into the store', async () => {
    renderAt()

    expect(await screen.findByText('English for Beginners')).toBeInTheDocument()
    expect(screen.getByText('Business English Mastery')).toBeInTheDocument()
    expect(screen.getByText('Advanced Grammar Lab')).toBeInTheDocument()

    // Each course renders as a link card to its detail page - confirms the list isn't just
    // rendering titles from unrelated markup.
    expect(screen.getByRole('link', { name: /English for Beginners/ })).toHaveAttribute('href', '/courses/course-1')
    expect(screen.getByRole('link', { name: /Business English Mastery/ })).toHaveAttribute('href', '/courses/course-2')
    expect(screen.getByRole('link', { name: /Advanced Grammar Lab/ })).toHaveAttribute('href', '/courses/course-3')
  })

  it('narrows the visible list when a search query matches only one course', async () => {
    const user = userEvent.setup()
    renderAt()

    await screen.findByText('English for Beginners')

    const searchInput = screen.getByLabelText('Search')
    await user.type(searchInput, 'Business')

    expect(screen.getByText('Business English Mastery')).toBeInTheDocument()
    expect(screen.queryByText('English for Beginners')).not.toBeInTheDocument()
    expect(screen.queryByText('Advanced Grammar Lab')).not.toBeInTheDocument()
  })

  it('shows the real empty state, not a blank area, when no course matches the filters', async () => {
    const user = userEvent.setup()
    renderAt()

    await screen.findByText('English for Beginners')

    const searchInput = screen.getByLabelText('Search')
    await user.type(searchInput, 'Nonexistent Course Query')

    expect(await screen.findByText('No matching paths yet')).toBeInTheDocument()
    expect(screen.getByText(/broadening your filters/i)).toBeInTheDocument()
    expect(screen.queryByText('English for Beginners')).not.toBeInTheDocument()
    expect(screen.queryByText('Business English Mastery')).not.toBeInTheDocument()
    expect(screen.queryByText('Advanced Grammar Lab')).not.toBeInTheDocument()

    // Resetting from the empty state should bring every course back.
    await user.click(screen.getByRole('button', { name: 'Show all paths' }))
    expect(await screen.findByText('English for Beginners')).toBeInTheDocument()
    expect(screen.getByText('Business English Mastery')).toBeInTheDocument()
    expect(screen.getByText('Advanced Grammar Lab')).toBeInTheDocument()
  })

  it('pre-applies the level filter from an initial "?level=Beginner" URL on mount', async () => {
    renderAt('/courses?level=Beginner')

    expect(await screen.findByText('English for Beginners')).toBeInTheDocument()
    expect(screen.queryByText('Business English Mastery')).not.toBeInTheDocument()
    expect(screen.queryByText('Advanced Grammar Lab')).not.toBeInTheDocument()

    const levelSelect = screen.getByLabelText('Level') as HTMLSelectElement
    expect(levelSelect.value).toBe('Beginner')
  })
})
