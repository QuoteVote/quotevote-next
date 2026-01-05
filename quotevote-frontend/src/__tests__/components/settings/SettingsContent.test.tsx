/* eslint-disable react/display-name */
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import SettingsContent from '@/components/settings/SettingsContent'
import { useAppStore } from '@/store/useAppStore'
import { useMutation } from '@apollo/client/react'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Apollo Client
jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
}))

// Mock Zustand store
jest.mock('@/store/useAppStore')

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
}))

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
    (props, ref) => <input ref={ref} {...props} />
  ),
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode
    variant?: string
    className?: string
  }) => (
    <div data-testid="alert" data-variant={variant} className={className}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

// ✅ Declare context ONCE at module level
const FormItemIdContext = React.createContext<string>('')

// ✅ Fixed Form mocks with shared context
jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormField: ({
    control,
    name,
    render,
  }: {
    control: unknown
    name: string
    render: (props: { 
      field: { 
        name: string
        value: string
        onChange: (val: string) => void
        onBlur: () => void
      } 
    }) => React.ReactNode
  }) => {
    const [value, setValue] = React.useState('')
    return (
      <>
        {render({
          field: {
            name,
            value,
            onChange: setValue,
            onBlur: () => {},
          },
        })}
      </>
    )
  },
  FormItem: ({ children }: { children: React.ReactNode }) => {
    const id = React.useId()
    return (
      <FormItemIdContext.Provider value={id}>
        <div>{children}</div>
      </FormItemIdContext.Provider>
    )
  },
  FormLabel: ({ children }: { children: React.ReactNode }) => {
    const id = React.useContext(FormItemIdContext)
    return <label htmlFor={id}>{children}</label>
  },
  FormControl: ({ children }: { children: React.ReactNode }) => {
    const id = React.useContext(FormItemIdContext)
    return <div>{React.cloneElement(children as React.ReactElement, { id })}</div>
  },
  FormMessage: ({ children }: { children?: React.ReactNode }) => 
    children ? <span role="alert">{children}</span> : null,
}))

// Mock Avatar component
jest.mock('@/components/Avatar', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    fallback,
    size,
    className,
  }: {
    src?: string
    alt?: string
    fallback?: string
    size?: number
    className?: string
  }) => (
    <div
      data-testid="avatar"
      data-src={src}
      data-alt={alt}
      data-fallback={fallback}
      data-size={size}
      className={className}
    >
      {fallback || alt}
    </div>
  ),
}))

// Mock utilities
jest.mock('@/lib/utils/replaceGqlError', () => ({
  replaceGqlError: (msg: string) => msg.replace('GraphQL error: ', ''),
}))

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}))

jest.mock('@/graphql/mutations', () => ({
  UPDATE_USER: 'UPDATE_USER_MUTATION',
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Camera: () => <svg data-testid="camera-icon" />,
  Loader2: () => <svg data-testid="loader-icon" />,
}))

const mockPush = jest.fn()
const mockUpdateUser = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>
const mockUseAppStore = useAppStore as unknown as jest.MockedFunction<
  (selector: (state: unknown) => unknown) => unknown
>

const mockUserData = {
  id: 'user123',
  _id: 'user123',
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  admin: false,
}

describe('SettingsContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()

    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any)

    mockUseMutation.mockReturnValue([
      mockUpdateUser,
      { loading: false, error: null, data: null },
    ] as any)

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        user: {
          data: mockUserData,
          loading: false,
          loginError: null,
        },
        setUserData: jest.fn(),
        logout: jest.fn(),
      }
      return selector(state)
    })
  })

  const renderComponent = (setOpen = jest.fn()) => {
    return render(<SettingsContent setOpen={setOpen} />)
  }

  describe('Rendering', () => {
    it('renders all form fields', () => {
      renderComponent()

      expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Username' })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument()
      expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    })

    it('renders avatar with user data', () => {
      renderComponent()

      const avatar = screen.getByTestId('avatar')
      expect(avatar).toHaveAttribute('data-src', 'https://example.com/avatar.jpg')
    })

    it('renders Sign Out button', () => {
      renderComponent()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })

    it('renders Save button', () => {
      renderComponent()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('does not render Manage Invites button for non-admin', () => {
      renderComponent()
      expect(screen.queryByText('Manage Invites')).not.toBeInTheDocument()
    })

    it('renders Manage Invites button for admin users', () => {
      mockUseAppStore.mockImplementation((selector) => {
        const state = {
          user: {
            data: { ...mockUserData, admin: true },
            loading: false,
            loginError: null,
          },
          setUserData: jest.fn(),
          logout: jest.fn(),
        }
        return selector(state)
      })

      renderComponent()
      expect(screen.getByText('Manage Invites')).toBeInTheDocument()
    })

    it('renders Forgot Password link', () => {
      renderComponent()

      const link = screen.getByText('Forgot Password?')
      expect(link).toHaveAttribute('href', '/auth/forgot')
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('renders Settings heading on desktop', () => {
      renderComponent()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('renders avatar with camera icon overlay', () => {
      renderComponent()
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument()
    })
  })

  describe('Button Actions', () => {
    it('handles avatar change click', async () => {
      const setOpen = jest.fn()
      const user = userEvent.setup()
      renderComponent(setOpen)

      const avatarButton = screen.getByTestId('avatar').closest('button')
      if (avatarButton) {
        await user.click(avatarButton)

        expect(setOpen).toHaveBeenCalledWith(false)
        expect(mockPush).toHaveBeenCalledWith('/Profile/testuser/avatar')
      }
    })

    it('handles logout click', async () => {
      const setOpen = jest.fn()
      const mockLogout = jest.fn()
      const user = userEvent.setup()

      mockUseAppStore.mockImplementation((selector) => {
        const state = {
          user: {
            data: mockUserData,
            loading: false,
            loginError: null,
          },
          setUserData: jest.fn(),
          logout: mockLogout,
        }
        return selector(state)
      })

      ;(useAppStore as any).getState = jest.fn().mockReturnValue({
        logout: mockLogout,
      })

      renderComponent(setOpen)

      const logoutButton = screen.getByText('Sign Out')
      await user.click(logoutButton)

      expect(setOpen).toHaveBeenCalledWith(false)
      expect(localStorage.getItem('token')).toBeNull()
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('handles manage invites click for admin', async () => {
      const setOpen = jest.fn()
      const user = userEvent.setup()

      mockUseAppStore.mockImplementation((selector) => {
        const state = {
          user: {
            data: { ...mockUserData, admin: true },
            loading: false,
            loginError: null,
          },
          setUserData: jest.fn(),
          logout: jest.fn(),
        }
        return selector(state)
      })

      renderComponent(setOpen)

      const inviteButton = screen.getByText('Manage Invites')
      await user.click(inviteButton)

      expect(mockPush).toHaveBeenCalledWith('/ControlPanel')
      expect(setOpen).toHaveBeenCalledWith(false)
    })
  })

  describe('Save Button State', () => {
    it('disables Save button when no changes', () => {
      renderComponent()
      const saveButton = screen.getByText('Save')
      expect(saveButton).toBeDisabled()
    })

    it('shows loading state when submitting', () => {
      mockUseMutation.mockReturnValue([
        mockUpdateUser,
        { loading: true, error: null, data: null },
      ] as any)

      renderComponent()

      expect(screen.getByText('Saving...')).toBeInTheDocument()
      const loaderIcons = screen.getAllByTestId('loader-icon')
      expect(loaderIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for all inputs', () => {
      renderComponent()

      expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Username' })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument()
      expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    })

    it('password input has type password', () => {
      renderComponent()

      const passwordInput = screen.getByLabelText(/Password/)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('email input has type email', () => {
      renderComponent()

      const emailInput = screen.getByRole('textbox', { name: 'Email' })
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('avatar button has aria-label', () => {
      renderComponent()

      const avatarButton = screen.getByTestId('avatar').closest('button')
      expect(avatarButton).toHaveAttribute('aria-label', 'Change avatar')
    })
  })

  describe('Loading States', () => {
    it('displays loading overlay when submitting', () => {
      mockUseMutation.mockReturnValue([
        mockUpdateUser,
        { loading: true, error: null, data: null },
      ] as any)

      renderComponent()

      const overlay = screen.getAllByTestId('loader-icon')
      expect(overlay.length).toBeGreaterThan(0)
    })

    it('disables buttons during loading', () => {
      mockUseMutation.mockReturnValue([
        mockUpdateUser,
        { loading: true, error: null, data: null },
      ] as any)

      renderComponent()

      const signOutButton = screen.getByText('Sign Out')
      const saveButton = screen.getByText('Saving...')

      expect(signOutButton).toBeDisabled()
      expect(saveButton).toBeDisabled()
    })
  })
})
