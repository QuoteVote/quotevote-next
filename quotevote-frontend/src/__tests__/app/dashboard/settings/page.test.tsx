import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import { resetStore } from '@/__tests__/utils/test-utils'
import { useAppStore } from '@/store/useAppStore'
import { UPDATE_USER } from '@/graphql/mutations'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/dashboard/settings',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock ThemeContext
const mockToggleTheme = jest.fn()
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    themeMode: 'light',
    toggleTheme: mockToggleTheme,
    isDarkMode: false,
    theme: { mode: 'light', palette: { background: '#ffffff', text: '#111827' } },
  }),
}))

let SettingsPageClient: React.ComponentType
beforeAll(async () => {
  const mod = await import('@/app/dashboard/settings/SettingsPageClient')
  SettingsPageClient = mod.default
})

const mockUser = {
  id: 'user-1',
  _id: 'user-1',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.png',
  admin: false,
  accountStatus: 'active',
}

const updateUserMock = {
  request: {
    query: UPDATE_USER,
    variables: {
      user: {
        _id: 'user-1',
        name: 'Updated Name',
        username: 'testuser',
        email: 'test@example.com',
      },
    },
  },
  result: {
    data: {
      updateUser: {
        _id: 'user-1',
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Updated Name',
        avatar: 'https://example.com/avatar.png',
        admin: false,
        accountStatus: 'active',
        created: '2025-01-01',
        updated: '2025-01-02',
      },
    },
  },
}

describe('Settings Page', () => {
  beforeEach(() => {
    resetStore()
    mockPush.mockClear()
    useAppStore.getState().setUserData(mockUser)
  })

  it('renders settings page heading', () => {
    render(<SettingsPageClient />)
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('renders navigation buttons for Profile, Account, Password', () => {
    render(<SettingsPageClient />)
    // Navigation buttons
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Password' })).toBeInTheDocument()
  })

  it('renders profile form with user data by default', () => {
    render(<SettingsPageClient />)
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('switches to account section when clicked', () => {
    render(<SettingsPageClient />)
    fireEvent.click(screen.getByRole('button', { name: 'Account' }))
    expect(screen.getByText('Account Status')).toBeInTheDocument()
  })

  it('switches to password section when clicked', () => {
    render(<SettingsPageClient />)
    fireEvent.click(screen.getByRole('button', { name: 'Password' }))
    expect(screen.getByText('Change Password')).toBeInTheDocument()
    expect(screen.getByText('Current Password')).toBeInTheDocument()
    expect(screen.getByText('New Password')).toBeInTheDocument()
  })

  it('shows save button as disabled when form is pristine', () => {
    render(<SettingsPageClient />)
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeDisabled()
  })

  it('enables save button when form is dirty', async () => {
    render(<SettingsPageClient />, { mocks: [updateUserMock] })
    const nameInput = screen.getByDisplayValue('Test User')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).not.toBeDisabled()
    })
  })

  it('shows change avatar button', () => {
    render(<SettingsPageClient />)
    expect(screen.getByLabelText('Change avatar')).toBeInTheDocument()
  })

  it('navigates to avatar page when avatar is clicked', () => {
    render(<SettingsPageClient />)
    fireEvent.click(screen.getByLabelText('Change avatar'))
    expect(mockPush).toHaveBeenCalledWith('/dashboard/profile/testuser/avatar')
  })

  it('shows account status as Active', () => {
    render(<SettingsPageClient />)
    fireEvent.click(screen.getByRole('button', { name: 'Account' }))
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('validates password requirements', async () => {
    render(<SettingsPageClient />)
    fireEvent.click(screen.getByRole('button', { name: 'Password' }))

    const currentPw = screen.getByPlaceholderText('Enter current password')
    fireEvent.change(currentPw, { target: { value: 'oldpass123' } })

    const newPw = screen.getByPlaceholderText('Enter new password')
    fireEvent.change(newPw, { target: { value: 'short' } })

    const confirmPw = screen.getByPlaceholderText('Confirm new password')
    fireEvent.change(confirmPw, { target: { value: 'short' } })

    const updateButton = screen.getByRole('button', { name: /update password/i })
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
  })
})
