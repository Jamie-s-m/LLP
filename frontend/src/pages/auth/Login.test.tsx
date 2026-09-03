import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Login from './Login'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: 'http://localhost:5000/api' },
  },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

const baseUser = {
  id: 'user-1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
}

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )

const fillAndSubmit = async (email = 'ada@example.com', password = 'correct-horse') => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/email address/i), email)
  await user.type(screen.getByLabelText(/^password$/i), password)
  await user.click(screen.getByRole('button', { name: /sign in/i }))
}

// Regression coverage for the auth funnel: the login page is the literal front door
// (signup/login) and previously had zero test coverage, despite just having several
// accessibility fixes applied in this same session (label/input association, the
// show/hide-password icon button's focus/hover colors). These tests lock in the
// post-login destination logic in handleSubmit - a real ternary chosen by role and
// onboarding status, not a stub - the failed-login error path, and the password-visibility
// toggle that the icon-button fix touched.
describe('Login', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    localStorage.clear()
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null })
  })

  it('navigates a student who has NOT completed onboarding to /onboarding after login', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        success: true,
        token: 'token-student-new',
        user: { ...baseUser, role: 'student', onboardingCompletedAt: null },
      },
    })

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/onboarding'))
  })

  it('navigates an admin to /admin/control-center after login', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        success: true,
        token: 'token-admin',
        user: { ...baseUser, role: 'admin' },
      },
    })

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/control-center'))
  })

  it('navigates a student who HAS completed onboarding to /dashboard after login', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        success: true,
        token: 'token-student-done',
        user: { ...baseUser, role: 'student', onboardingCompletedAt: '2026-01-01T00:00:00.000Z' },
      },
    })

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
  })

  it('shows the server error message on a failed login and does not navigate', async () => {
    mockedApi.post.mockRejectedValue({
      response: { status: 400, data: { message: 'Invalid credentials' } },
    })

    renderLogin()
    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('toggles the password input between hidden and visible text via the show/hide button', async () => {
    renderLogin()
    const user = userEvent.setup()
    const passwordInput = screen.getByLabelText(/^password$/i)
    expect(passwordInput).toHaveAttribute('type', 'password')

    const showButton = screen.getByRole('button', { name: /show password/i })
    await user.click(showButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    const hideButton = screen.getByRole('button', { name: /hide password/i })
    await user.click(hideButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
