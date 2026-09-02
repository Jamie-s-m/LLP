import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PaywallModal from './PaywallModal'
import { PAYWALL_EVENT } from '../services/api'

// Regression coverage for Phase 7: api.ts's response interceptor dispatches PAYWALL_EVENT on
// any 402 from the backend's new entitlement gates - this is the one place that turns it into
// a real modal with a path to /pricing, rather than a generic error toast at each call site.
describe('PaywallModal', () => {
  it('stays closed until a paywall event is dispatched, then shows the server message and a link to /pricing', () => {
    render(
      <MemoryRouter>
        <PaywallModal />
      </MemoryRouter>
    )

    expect(screen.queryByText('Upgrade to continue')).not.toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new CustomEvent(PAYWALL_EVENT, { detail: { message: 'This lesson requires an active LinguaNest plan.' } }))
    })

    expect(screen.getByText('Upgrade to continue')).toBeInTheDocument()
    expect(screen.getByText('This lesson requires an active LinguaNest plan.')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /view plans/i })
    expect(link).toHaveAttribute('href', '/pricing')
  })

  it('falls back to a default message when the event carries none', () => {
    render(
      <MemoryRouter>
        <PaywallModal />
      </MemoryRouter>
    )

    act(() => {
      window.dispatchEvent(new CustomEvent(PAYWALL_EVENT, { detail: {} }))
    })

    expect(screen.getByText('This requires an active LinguaNest plan.')).toBeInTheDocument()
  })
})
