/* eslint-disable react/display-name */
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'

// 1. Mock the specific sub-path you prefer to import from
jest.mock('@apollo/client/react', () => {
  const actual = jest.requireActual('@apollo/client/react')
  return {
    ...actual,
    __esModule: true,
    useMutation: jest.fn(),
    useApolloClient: jest.fn(),
  }
})

// 2. Import from the EXACT same path mocked above
import { useMutation } from '@apollo/client/react'
import SettingsContent from '@/components/settings/SettingsContent'
import { useAppStore } from '@/store/useAppStore'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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

const FormItemIdContext = React.createContext<string>('')

jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormField: ({
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
      <div data-testid={`field-${name}`}>
        {render({
          field: {
            name,
            value,
            onChange: setValue,
            onBlur: () => {},
          },
        })}
      </div>
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
    return <div>{React.cloneElement(children as React.ReactElement<Record<string, unknown>>, { id })}</div>
  },
  FormMessage: ({ children }: { children?: React.ReactNode }) => 
    children ? <span role="alert">{children}</span> : null,
}))

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

jest.mock('@/lib/utils/replaceGqlError', () => ({
  replaceGqlError: (msg: string) => msg.replace('GraphQL error: ', ''),
}))

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}))

jest.mock('@/graphql/mutations', () => ({
  UPDATE_USER: 'UPDATE_USER_MUTATION',
}))

jest.mock('lucide-react', () => ({
  Camera: () => <svg data-testid="camera-icon" />,
  Loader2: () => <svg data-testid="loader-icon" />,
}))

// 3. Typed Mock Definitions
const mockPush = jest.fn()
const mockUpdateUser = jest.fn()

// Double casting to bridge the gap between real functions and Jest mocks
const mockUseRouter = (useRouter as unknown) as jest.Mock
const mockUseMutation = (useMutation as unknown) as jest.Mock
const mockUseAppStore = (useAppStore as unknown) as jest.Mock

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
    })

    // Now mockReturnValue will be available because import and mock paths match
    mockUseMutation.mockReturnValue([
      mockUpdateUser,
      { loading: false, error: null, data: null },
    ])

    mockUseAppStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = {
        user: {
          data: mockUserData,
          loading: false,
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

    it('renders Manage Invites button for admin users', () => {
      mockUseAppStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
        const state = {
          user: {
            data: { ...mockUserData, admin: true },
            loading: false,
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
      const link = screen.getByText(/Forgot Password\?/i)
      expect(link).toHaveAttribute('href', '/auth/forgot')
    })
  })

  describe('Button Actions', () => {
    it('handles logout click', async () => {
      const setOpen = jest.fn()
      const mockLogout = jest.fn()
      const user = userEvent.setup()

      mockUseAppStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
        const state = {
          user: { data: mockUserData, loading: false },
          setUserData: jest.fn(),
          logout: mockLogout,
        }
        return selector(state)
      })

      const storeState = { logout: mockLogout };
      (useAppStore as unknown as { getState: () => typeof storeState }).getState = () => storeState

      renderComponent(setOpen)
      const logoutButton = screen.getByText('Sign Out')
      await user.click(logoutButton)

      expect(setOpen).toHaveBeenCalledWith(false)
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  describe('Save Button State', () => {
    it('shows loading state when submitting', () => {
      mockUseMutation.mockReturnValue([
        mockUpdateUser,
        { loading: true, error: null, data: null },
      ])

      renderComponent()
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
  })
})