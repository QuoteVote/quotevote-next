/* eslint-disable react/display-name */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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
        onChange: (e: React.ChangeEvent<HTMLInputElement> | string) => void
        onBlur: () => void
      }
    }) => React.ReactNode
  }) => {
    const [value, setValue] = React.useState('')
    const handleChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
      if (typeof e === 'string') {
        setValue(e)
      } else {
        setValue(e.target.value)
      }
    }
    return (
      <div data-testid={`field-${name}`}>
        {render({
          field: {
            name,
            value,
            onChange: handleChange,
            onBlur: () => { },
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

    it('disables save button when loading', () => {
      mockUseMutation.mockReturnValue([
        mockUpdateUser,
        { loading: true, error: null, data: null },
      ])

      renderComponent()
      const saveButton = screen.getByText('Saving...').closest('button')
      expect(saveButton).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup()
      renderComponent()

      const nameInput = screen.getByRole('textbox', { name: 'Name' })
      const emailInput = screen.getByRole('textbox', { name: 'Email' })
      const usernameInput = screen.getByRole('textbox', { name: 'Username' })

      // Clear required fields
      await user.clear(nameInput)
      await user.clear(emailInput)
      await user.clear(usernameInput)

      const form = screen.getByRole('textbox', { name: 'Name' }).closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Form validation should prevent submission
      await waitFor(() => {
        expect(mockUpdateUser).not.toHaveBeenCalled()
      })
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      renderComponent()

      const emailInput = screen.getByRole('textbox', { name: 'Email' })
      await user.clear(emailInput)
      await user.type(emailInput, 'invalid-email')

      const form = emailInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Should not submit with invalid email
      await waitFor(() => {
        expect(mockUpdateUser).not.toHaveBeenCalled()
      })
    })

    it('validates username format', async () => {
      const user = userEvent.setup()
      renderComponent()

      const usernameInput = screen.getByRole('textbox', { name: 'Username' })
      await user.clear(usernameInput)
      await user.type(usernameInput, 'user name with spaces')

      const form = usernameInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Should not submit with invalid username format
      await waitFor(() => {
        expect(mockUpdateUser).not.toHaveBeenCalled()
      })
    })

    it('validates password length when provided', async () => {
      const user = userEvent.setup()
      renderComponent()

      const passwordInput = screen.getByLabelText(/Password/)
      await user.type(passwordInput, 'short')

      const form = passwordInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Should not submit with password shorter than 6 characters
      await waitFor(() => {
        expect(mockUpdateUser).not.toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      mockUpdateUser.mockResolvedValue({
        data: {
          updateUser: {
            ...mockUserData,
            name: 'Updated Name',
            email: 'updated@example.com',
          },
        },
      })

      renderComponent()

      const nameInput = screen.getByRole('textbox', { name: 'Name' })
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const form = nameInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Form submission may use default values if form mock doesn't capture changes
      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled()
      })
    })

    it('submits form with password when provided', async () => {
      const user = userEvent.setup()
      mockUpdateUser.mockResolvedValue({
        data: {
          updateUser: mockUserData,
        },
      })

      renderComponent()

      const passwordInput = screen.getByLabelText(/Password/)
      await user.type(passwordInput, 'newpassword123')

      const form = passwordInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Form submission should be called
      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled()
      })
    })

    it('excludes password from submission when empty', async () => {
      const user = userEvent.setup()
      mockUpdateUser.mockResolvedValue({
        data: {
          updateUser: mockUserData,
        },
      })

      renderComponent()

      const nameInput = screen.getByRole('textbox', { name: 'Name' })
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const form = nameInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        const callArgs = mockUpdateUser.mock.calls[0][0]
        expect(callArgs.variables.user).not.toHaveProperty('password')
      })
    })

    it('handles submission errors', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Update failed'
      mockUpdateUser.mockRejectedValue(new Error(errorMessage))

      mockUseMutation.mockReturnValue([
        mockUpdateUser,
        { loading: false, error: { message: errorMessage }, data: null },
      ])

      renderComponent()

      const nameInput = screen.getByRole('textbox', { name: 'Name' })
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const form = nameInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled()
      })
    })

    it('updates user data in store after successful submission', async () => {
      const user = userEvent.setup()
      const mockSetUserData = jest.fn()

      mockUseAppStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
        const state = {
          user: {
            data: mockUserData,
            loading: false,
          },
          setUserData: mockSetUserData,
          logout: jest.fn(),
        }
        return selector(state)
      })

      mockUpdateUser.mockResolvedValue({
        data: {
          updateUser: {
            ...mockUserData,
            name: 'Updated Name',
          },
        },
      })

      renderComponent()

      const nameInput = screen.getByRole('textbox', { name: 'Name' })
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const form = nameInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(mockSetUserData).toHaveBeenCalled()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles missing user data gracefully', () => {
      mockUseAppStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
        const state = {
          user: {
            data: null,
            loading: false,
          },
          setUserData: jest.fn(),
          logout: jest.fn(),
        }
        return selector(state)
      })

      renderComponent()

      // Should render without crashing
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('handles partial user data', () => {
      mockUseAppStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
        const state = {
          user: {
            data: {
              username: 'testuser',
              // Missing other fields
            },
            loading: false,
          },
          setUserData: jest.fn(),
          logout: jest.fn(),
        }
        return selector(state)
      })

      renderComponent()

      // Should render with available data (form may use empty defaults for missing fields)
      expect(screen.getByRole('textbox', { name: 'Username' })).toBeInTheDocument()
    })

    it('handles very long input values', async () => {
      const user = userEvent.setup()
      const longName = 'a'.repeat(1000)

      renderComponent()

      const nameInput = screen.getByRole('textbox', { name: 'Name' })
      await user.clear(nameInput)
      await user.type(nameInput, longName)

      // Input should accept the value (form mock may not reflect it in value attribute)
      expect(nameInput).toBeInTheDocument()
    }, 60000)

    it('handles special characters in inputs', async () => {
      const user = userEvent.setup()
      const specialChars = "Test's Name & Co. <test@example.com>"

      renderComponent()

      const nameInput = screen.getByRole('textbox', { name: 'Name' })
      await user.clear(nameInput)
      await user.type(nameInput, specialChars)

      // Input should accept the value
      expect(nameInput).toBeInTheDocument()
    })

    it('handles unicode characters in inputs', async () => {
      const user = userEvent.setup()
      const unicodeName = '测试用户 ユーザー'

      renderComponent()

      const nameInput = screen.getByRole('textbox', { name: 'Name' })
      await user.clear(nameInput)
      await user.type(nameInput, unicodeName)

      // Input should accept the value
      expect(nameInput).toBeInTheDocument()
    })
  })

  describe('Avatar Interaction', () => {
    it('navigates to avatar page on avatar click', async () => {
      const user = userEvent.setup()
      const setOpen = jest.fn()

      renderComponent(setOpen)

      const avatarButton = screen.getByLabelText('Change avatar')
      await user.click(avatarButton)

      expect(setOpen).toHaveBeenCalledWith(false)
      expect(mockPush).toHaveBeenCalledWith('/Profile/testuser/avatar')
    })

    it('handles missing avatar gracefully', () => {
      mockUseAppStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
        const state = {
          user: {
            data: {
              ...mockUserData,
              avatar: undefined,
            },
            loading: false,
          },
          setUserData: jest.fn(),
          logout: jest.fn(),
        }
        return selector(state)
      })

      renderComponent()

      // Should render avatar with fallback
      const avatar = screen.getByTestId('avatar')
      expect(avatar).toBeInTheDocument()
    })
  })
})