import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import LoginPageContent from '@/app/auths/(split)/login/PageContent'

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
    expect(screen.getByPlaceholderText(/email\/username/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    const { container } = render(<LoginPageContent />)
    const form = container.querySelector('form')!
    fireEvent.submit(form)
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

    const { container } = render(<LoginPageContent />)
    fireEvent.change(screen.getByPlaceholderText(/email\/username/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('shows error toast on login failure', async () => {
    const { toast } = jest.requireMock('sonner')
    mockLoginUser.mockResolvedValue({
      success: false,
      error: 'Invalid username or password.',
    })

    const { container } = render(<LoginPageContent />)
    fireEvent.change(screen.getByPlaceholderText(/email\/username/i), {
      target: { value: 'bad@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpass' },
    })
    fireEvent.submit(container.querySelector('form')!)
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
