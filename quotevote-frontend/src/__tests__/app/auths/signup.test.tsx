import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import SignupPageContent from '@/app/auths/signup/PageContent'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

describe('SignupPageContent', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders all 4 fields', () => {
    render(<SignupPageContent />)
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    render(<SignupPageContent />)
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'Password1' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password2' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for weak password', async () => {
    render(<SignupPageContent />)
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'weak' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/min 8 chars/i)).toBeInTheDocument()
    })
  })

  it('renders sign in link', () => {
    render(<SignupPageContent />)
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })
})
