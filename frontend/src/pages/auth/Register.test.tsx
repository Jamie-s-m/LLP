import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import { vi } from 'vitest'
import Register from './Register'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), defaults: { baseURL: 'http://localhost:5000/api' } },
}))

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

// Stand-in for the real /verify-email page. handleSubmit's success branch navigates to
// `/verify-email?email=...&registered=1`, so asserting this stub renders (with the query
// params it received) is how we confirm the real post-success navigation target without
// assuming it and without pulling in the actual VerifyEmail page.
const VerifyEmailStub = () => {
  const [params] = useSearchParams()
  return <div>Verify screen for {params.get('email')} (registered={params.get('registered')})</div>
}

const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmailStub />} />
      </Routes>
    </MemoryRouter>
  )

// Regression coverage for Phase 11's top-priority zero-coverage gap: Register.tsx had no test
// file despite carrying real logic - a live email-availability check that must steer the user
// to sign-in/verification instead of letting them resubmit a taken email, a role picker whose
// selected state is conveyed only via aria-pressed, and a submit flow whose success/failure
// branches (navigate to /verify-email vs. surface the authStore error) were previously unverified.
describe('Register', () => {
  beforeEach(() => {
    mockedApi.get.mockReset()
    mockedApi.post.mockReset()
    mockedApi.post.mockResolvedValue({ data: {} }) // covers fire-and-forget /analytics/track calls
    useAuthStore.setState({ isLoading: false, error: null, isAuthenticated: false, user: null, token: null })
    localStorage.clear()
  })

  it('warns and offers sign-in/verification links when the live email check finds an existing account', async () => {
    const user = userEvent.setup()
    mockedApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/auth/check-email')) {
        return Promise.resolve({ data: { data: { available: false, isEmailVerified: true, googleOnly: false } } })
      }
      return Promise.resolve({ data: { data: {} } })
    })

    renderRegister()

    await user.type(screen.getByLabelText(/email address/i), 'taken@example.com')
    await user.tab() // blur triggers handleEmailBlur -> GET /auth/check-email

    expect(await screen.findByText('This email is already registered.')).toBeInTheDocument()
    const signInLink = screen.getByRole('link', { name: /sign in instead/i })
    expect(signInLink).toHaveAttribute('href', '/login')
    const verifyLink = screen.getByRole('link', { name: /continue to verification/i })
    expect(verifyLink).toHaveAttribute('href', '/verify-email?email=taken%40example.com')
  })

  it('shows no exists-warning and no sign-in link when the live email check finds the address available', async () => {
    const user = userEvent.setup()
    mockedApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/auth/check-email')) {
        return Promise.resolve({ data: { data: { available: true } } })
      }
      return Promise.resolve({ data: { data: {} } })
    })

    renderRegister()

    await user.type(screen.getByLabelText(/email address/i), 'free@example.com')
    await user.tab()

    expect(await screen.findByText('This email is available.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /sign in instead/i })).not.toBeInTheDocument()
  })

  it('registers successfully, calls the register action, and navigates to /verify-email', async () => {
    const user = userEvent.setup()
    // Typing into the email field and then tabbing into the password field blurs it, so the
    // live availability check fires here too - keep it "available" so it doesn't set
    // emailStatus to 'exists' and block submission via the emailInUse guard in handleSubmit.
    mockedApi.get.mockResolvedValue({ data: { data: { available: true } } })
    mockedApi.post.mockImplementation((url: string, body?: any) => {
      if (url === '/auth/register') {
        expect(body).toMatchObject({ email: 'new@example.com', role: 'student' })
        return Promise.resolve({ data: { data: { user: { id: 'u1', firstName: 'New', lastName: 'User', email: 'new@example.com', role: 'student' }, token: 'tok-123' } } })
      }
      return Promise.resolve({ data: {} })
    })

    renderRegister()

    await user.type(screen.getByLabelText(/first name/i), 'New')
    await user.type(screen.getByLabelText(/last name/i), 'User')
    await user.type(screen.getByLabelText(/email address/i), 'new@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/verify screen for new@example.com \(registered=1\)/i)).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBe('tok-123')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('shows a real error message and does not navigate when registration fails', async () => {
    const user = userEvent.setup()
    mockedApi.get.mockResolvedValue({ data: { data: { available: true } } })
    mockedApi.post.mockImplementation((url: string) => {
      if (url === '/auth/register') {
        return Promise.reject({ response: { status: 400, data: { message: 'Email is invalid' } } })
      }
      return Promise.resolve({ data: {} })
    })

    renderRegister()

    await user.type(screen.getByLabelText(/first name/i), 'New')
    await user.type(screen.getByLabelText(/last name/i), 'User')
    await user.type(screen.getByLabelText(/email address/i), 'bad@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is invalid')
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(screen.queryByText(/verify screen for/i)).not.toBeInTheDocument()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('toggles the password field between masked and visible via the show/hide button', async () => {
    const user = userEvent.setup()
    renderRegister()

    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggle = screen.getByRole('button', { name: /show password/i })
    await user.click(toggle)

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
  })

  it('marks the selected role card with aria-pressed and updates it when a different role is picked', async () => {
    const user = userEvent.setup()
    renderRegister()

    const studentCard = screen.getByRole('button', { name: /student/i })
    const parentCard = screen.getByRole('button', { name: /parent/i })
    expect(studentCard).toHaveAttribute('aria-pressed', 'true')
    expect(parentCard).toHaveAttribute('aria-pressed', 'false')

    await user.click(parentCard)

    expect(parentCard).toHaveAttribute('aria-pressed', 'true')
    expect(studentCard).toHaveAttribute('aria-pressed', 'false')
  })
})
