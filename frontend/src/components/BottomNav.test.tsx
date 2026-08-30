import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useAuthStore } from '../store/authStore'

describe('BottomNav', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it('renders the primary mobile navigation items without duplicate keys for authenticated students', () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        firstName: 'Maria',
        lastName: 'Tester',
        email: 'maria@test.com',
        role: 'student',
      },
      token: 'demo-token',
      isAuthenticated: true,
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('My Learning')).toBeInTheDocument()
    expect(screen.getByText('Flashcards')).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('More')).toBeInTheDocument()
    // Schedule moved into the "More" screen - it's no longer a primary tab.
    expect(screen.queryByText('Schedule')).not.toBeInTheDocument()
  })

  it('shows teacher-appropriate items instead of the student set for a teacher', () => {
    useAuthStore.setState({
      user: {
        id: 'user-2',
        firstName: 'Tara',
        lastName: 'Teacher',
        email: 'tara@test.com',
        role: 'teacher',
      },
      token: 'demo-token',
      isAuthenticated: true,
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('My Courses')).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('More')).toBeInTheDocument()
    // A teacher should never see the student-only "My Learning"/"Flashcards" tabs.
    expect(screen.queryByText('My Learning')).not.toBeInTheDocument()
    expect(screen.queryByText('Flashcards')).not.toBeInTheDocument()
  })
})
