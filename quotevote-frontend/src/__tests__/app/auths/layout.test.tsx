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

  it('renders AuthNavbar', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    )
    expect(screen.getByTestId('auth-navbar')).toBeInTheDocument()
  })

  it('renders white card container', () => {
    const { container } = render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    )
    const card = container.querySelector('.bg-card')
    expect(card).toBeInTheDocument()
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

  it('renders main element for content', () => {
    render(
      <AuthLayout>
        <div data-testid="page-content">Page</div>
      </AuthLayout>
    )
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
