/**
 * Unauth Page Tests
 *
 * Tests the session-expired / unauthorized page.
 */

import { render, screen } from '../utils/test-utils'
import UnauthPage from '@/app/unauth/page'

jest.mock('next/link', () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
  MockLink.displayName = 'Link'
  return MockLink
})

describe('UnauthPage', () => {
  it('renders session expired message', () => {
    render(<UnauthPage />)
    expect(screen.getByText(/your session has expired/i)).toBeInTheDocument()
  })

  it('renders sign in prompt', () => {
    render(<UnauthPage />)
    expect(screen.getByText(/please sign in again/i)).toBeInTheDocument()
  })

  it('renders sign in link to /auths/login', () => {
    render(<UnauthPage />)
    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toHaveAttribute('href', '/auths/login')
  })

  it('renders centered layout', () => {
    const { container } = render(<UnauthPage />)
    const wrapper = container.querySelector('.flex.items-center.justify-center')
    expect(wrapper).toBeInTheDocument()
  })

  it('renders card container', () => {
    const { container } = render(<UnauthPage />)
    const card = container.querySelector('.bg-card')
    expect(card).toBeInTheDocument()
  })
})
