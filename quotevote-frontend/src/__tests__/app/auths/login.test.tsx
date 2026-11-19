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
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
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
    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
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
    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'bad@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
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

  it('renders request access links', () => {
    render(<LoginPageContent />)
    expect(screen.getByRole('link', { name: /request an invite/i })).toHaveAttribute(
      'href',
      '/auths/request-access'
    )
    // Top right on desktop and in the header on phones
    for (const link of screen.getAllByRole('link', { name: /^request invite$/i })) {
      expect(link).toHaveAttribute('href', '/auths/request-access')
    }
  })

  it('keeps Log in disabled until both agreements are ticked', () => {
    render(<LoginPageContent />)
    const submit = screen.getByRole('button', { name: /^log in$/i })
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByLabelText(/terms of service/i))
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByLabelText(/code of conduct/i))
    expect(submit).toBeEnabled()
  })

  it('shows and hides the password', () => {
    render(<LoginPageContent />)
    const password = screen.getByLabelText(/^password$/i)
    expect(password).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: /show password/i }))
    expect(password).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: /hide password/i }))
    expect(password).toHaveAttribute('type', 'password')
  })
})
