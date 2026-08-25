import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useAuthStore } from '../store/authStore'

describe('BottomNav', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it('renders the primary mobile navigation items without duplicate keys', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('My Learning')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Practice')).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })
})
