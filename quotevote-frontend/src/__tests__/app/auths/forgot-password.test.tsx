import { render, screen, fireEvent, waitFor, type MockedResponse } from '../../utils/test-utils'
import ForgotPasswordPageContent from '@/app/auths/forgot-password/PageContent'
import { SEND_PASSWORD_RESET_EMAIL } from '@/graphql/mutations'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

describe('ForgotPasswordPageContent', () => {
  it('renders email form initially', () => {
    render(<ForgotPasswordPageContent />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('shows validation error for invalid email', async () => {
    render(<ForgotPasswordPageContent />)
    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'notanemail' } })
    // Submit form directly
    fireEvent.submit(emailInput.closest('form')!)
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('shows email sent view after successful mutation', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: SEND_PASSWORD_RESET_EMAIL,
          variables: { email: 'test@example.com' },
        },
        result: { data: { sendPasswordResetEmail: true } },
      },
    ]
    render(<ForgotPasswordPageContent />, { mocks })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument()
    })
  })

  it('renders back to sign in link', () => {
    render(<ForgotPasswordPageContent />)
    expect(screen.getByText(/back to sign in/i)).toBeInTheDocument()
  })
})
