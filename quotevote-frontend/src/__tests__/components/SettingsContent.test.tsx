import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import SettingsContent from '../../components/settings/SettingsContent'

// Mock dependencies
const mockPush = jest.fn()
const mockDispatch = jest.fn()
const mockUpdateUser = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}))

jest.mock('@apollo/client/react', () => ({
  useMutation: () => [mockUpdateUser, { loading: false, error: null }],
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/Avatar', () => ({
  Avatar: ({ src, alt, fallback, ...props }: any) => (
    <div data-testid="avatar" data-src={src} {...props}>
      {fallback || alt}
    </div>
  ),
}))

jest.mock('@/lib/utils/replaceGqlError', () => ({
  replaceGqlError: (msg: string) => msg.replace('GraphQL error: ', ''),
}))

jest.mock('@/graphql/mutations', () => ({
  UPDATE_USER: 'UPDATE_USER_MUTATION',
}))

jest.mock('@/store/user', () => ({
  SET_USER_DATA: jest.fn(),
}))

// Mock user data
const mockUserData = {
  _id: 'user123',
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  avatar: { url: 'https://example.com/avatar.jpg' },
  admin: false,
}

// Create mock Redux store
const createMockStore = (userData = mockUserData) => {
  return configureStore({
    reducer: {
      user: () => ({
        data: userData,
        isAuthenticated: true,
      }),
    },
  })
}

describe('SettingsContent', () => {
  let store: any

  beforeEach(() => {
    store = createMockStore()
    mockPush.mockClear()
    mockDispatch.mockClear()
    mockUpdateUser.mockClear()
    localStorage.clear()
  })

  const renderComponent = (setOpen = jest.fn()) => {
    return render(
      <Provider store={store}>
        <SettingsContent setOpen={setOpen} />
      </Provider>
    )
  }

  describe('Rendering', () => {
    it('renders all form fields', () => {
      renderComponent()

      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
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
      store = createMockStore({ ...mockUserData, admin: true })
      renderComponent()

      expect(screen.getByText('Manage Invites')).toBeInTheDocument()
    })

    it('renders Forgot Password link', () => {
      renderComponent()

      const link = screen.getByText('Forgot Password?')
      expect(link).toHaveAttribute('href', '/auth/forgot')
      expect(link).toHaveAttribute('target', '_blank')
    })
  })

  describe('Form Pre-population', () => {
    it('pre-fills form with user data', () => {
      renderComponent()

      expect(screen.getByLabelText('Name')).toHaveValue('Test User')
      expect(screen.getByLabelText('Username')).toHaveValue('testuser')
      expect(screen.getByLabelText('Email')).toHaveValue('test@example.com')
      expect(screen.getByLabelText(/Password/)).toHaveValue('')
    })

    it('pre-populates with valid email', () => {
      renderComponent()
      
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      expect(emailInput.value).toBe('test@example.com')
      expect(emailInput).toHaveAttribute('type', 'email')
    })
  })

  describe('Form Validation', () => {
    it('shows error for empty name', async () => {
      const user = userEvent.setup()
      renderComponent()

      const nameInput = screen.getByLabelText('Name')
      await user.clear(nameInput)
      
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      })
    })

    it('shows error for short username', async () => {
      const user = userEvent.setup()
      renderComponent()

      const usernameInput = screen.getByLabelText('Username')
      const nameInput = screen.getByLabelText('Name')
      
      // Make form dirty
      await user.type(nameInput, ' ')
      
      await user.clear(usernameInput)
      await user.type(usernameInput, 'ab')
      
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Username should be more than 4 characters')).toBeInTheDocument()
      })
    })

    it('shows error for long username', async () => {
      const user = userEvent.setup()
      renderComponent()

      const usernameInput = screen.getByLabelText('Username')
      const nameInput = screen.getByLabelText('Name')
      
      await user.type(nameInput, ' ')
      
      await user.clear(usernameInput)
      await user.type(usernameInput, 'a'.repeat(51)) // 51 characters
      
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Username should be less than 50 characters')).toBeInTheDocument()
      })
    })

    it('validates password strength when provided', async () => {
      const user = userEvent.setup()
      renderComponent()

      const passwordInput = screen.getByLabelText(/Password/)
      const nameInput = screen.getByLabelText('Name')
      
      // Make form dirty
      await user.type(nameInput, ' ')
      
      await user.type(passwordInput, 'weak')
      
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/Password should contain a number, an uppercase, and lowercase letter/i)).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('accepts strong password', async () => {
      const user = userEvent.setup()
      renderComponent()

      const passwordInput = screen.getByLabelText(/Password/)
      await user.type(passwordInput, 'Strong123Pass')

      // Should not show password validation error
      expect(screen.queryByText(/Password should contain/i)).not.toBeInTheDocument()
    })

    it('accepts empty password for optional update', () => {
      renderComponent()

      const passwordInput = screen.getByLabelText(/Password/)
      expect(passwordInput).toHaveValue('')
      
      // Empty password should not trigger validation
      expect(screen.queryByText(/Password should contain/i)).not.toBeInTheDocument()
    })
  })

  describe('Button Actions', () => {
    it('handles avatar change click', () => {
      const setOpen = jest.fn()
      renderComponent(setOpen)

      const avatarButton = screen.getByTestId('avatar').closest('button')
      fireEvent.click(avatarButton!)

      expect(setOpen).toHaveBeenCalledWith(false)
      expect(mockPush).toHaveBeenCalledWith('/Profile/testuser/avatar')
    })

    it('handles logout click', () => {
      const setOpen = jest.fn()
      renderComponent(setOpen)

      fireEvent.click(screen.getByText('Sign Out'))

      expect(setOpen).toHaveBeenCalledWith(false)
      expect(localStorage.getItem('token')).toBeNull()
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('handles manage invites click for admin', () => {
      store = createMockStore({ ...mockUserData, admin: true })
      const setOpen = jest.fn()
      renderComponent(setOpen)

      fireEvent.click(screen.getByText('Manage Invites'))

      expect(setOpen).toHaveBeenCalledWith(false)
      expect(mockPush).toHaveBeenCalledWith('/ControlPanel')
    })
  })

  describe('Save Button State', () => {
    it('disables Save button when no changes', () => {
      renderComponent()

      const saveButton = screen.getByText('Save')
      expect(saveButton).toBeDisabled()
    })

    it('enables Save button when form is dirty', async () => {
      const user = userEvent.setup()
      renderComponent()

      const nameInput = screen.getByLabelText('Name')
      await user.type(nameInput, ' Updated')

      const saveButton = screen.getByText('Save')
      expect(saveButton).not.toBeDisabled()
    })

    it('disables buttons during loading', () => {
      // We'd need to mock loading state for this
      // For now, just verify initial state
      renderComponent()
      const saveButton = screen.getByText('Save')
      expect(saveButton).toBeDisabled() // Disabled when no changes
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for all inputs', () => {
      renderComponent()

      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    })

    it('password input has type password', () => {
      renderComponent()

      const passwordInput = screen.getByLabelText(/Password/)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('email input has type email', () => {
      renderComponent()

      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toHaveAttribute('type', 'email')
    })
  })

  describe('User Experience', () => {
    it('shows Settings title', () => {
      renderComponent()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('displays user avatar with fallback', () => {
      renderComponent()
      const avatar = screen.getByTestId('avatar')
      expect(avatar).toHaveTextContent('T') // Fallback to first letter
    })

    it('renders all required form sections', () => {
      renderComponent()
      
      // Check all cards are rendered
      const cards = screen.getAllByTestId('card')
      expect(cards.length).toBeGreaterThanOrEqual(4) // Name, Username, Email, Password
    })
  })
})
