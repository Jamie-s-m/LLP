import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useAuthStore } from '../store/authStore'

describe('BottomNav', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it('renders the primary mobile navigation items without duplicate keys for authenticated users', () => {
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

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Practice')).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })
})
