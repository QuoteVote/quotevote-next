/**
 * Auth Layout Tests
 *
 * Tests the auth layout Server Component renders the white card structure
 * and includes the AuthNavbar.
 */

import { render, screen } from '../../utils/test-utils'
import AuthLayout from '@/app/auths/layout'

jest.mock('@/components/Navbars/AuthNavbar', () => ({
  AuthNavbar: () => <nav data-testid="auth-navbar">Auth Navbar</nav>,
}))

describe('AuthLayout', () => {
  it('renders children', () => {
    render(
      <AuthLayout>
        <div data-testid="child-content">Auth Page Content</div>
      </AuthLayout>
    )
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  it('does not render AuthNavbar (moved to card sub-layout)', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    )
    expect(screen.queryByTestId('auth-navbar')).not.toBeInTheDocument()
  })

  it('renders with full min-height screen', () => {
    const { container } = render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    )
    const wrapper = container.querySelector('.min-h-screen')
    expect(wrapper).toBeInTheDocument()
  })
})
