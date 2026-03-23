import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import LoginPageContent from '@/app/auths/login/PageContent'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (s: { setUserData: jest.Mock }) => unknown) =>
    selector({ setUserData: jest.fn() }),
}))

const mockLoginUser = jest.fn()
jest.mock('@/lib/auth', () => ({
  loginUser: (...args: unknown[]) => mockLoginUser(...args),
  setToken: jest.fn(),
  getToken: jest.fn(),
  removeToken: jest.fn(),
}))

describe('LoginPageContent', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders username/email and password fields', () => {
    render(<LoginPageContent />)
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    render(<LoginPageContent />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/username or email is required/i)).toBeInTheDocument()
    })
  })

  it('calls loginUser on valid submit and redirects', async () => {
    mockLoginUser.mockResolvedValue({
      success: true,
      data: {
        user: {
          _id: '1',
          username: 'test',
          email: 'test@example.com',
        },
        token: 'test-token',
      },
    })

    render(<LoginPageContent />)
    fireEvent.change(screen.getByLabelText(/username or email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockPush).toHaveBeenCalledWith('/dashboard/explore')
    })
  })

  it('shows error toast on login failure', async () => {
    const { toast } = jest.requireMock('sonner')
    mockLoginUser.mockResolvedValue({
      success: false,
      error: 'Invalid username or password.',
    })

    render(<LoginPageContent />)
    fireEvent.change(screen.getByLabelText(/username or email/i), {
      target: { value: 'bad@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid username or password.')
    })
  })

  it('renders forgot password link', () => {
    render(<LoginPageContent />)
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
  })

  it('renders request access link', () => {
    render(<LoginPageContent />)
    expect(screen.getByText(/request access/i)).toBeInTheDocument()
  })
})
