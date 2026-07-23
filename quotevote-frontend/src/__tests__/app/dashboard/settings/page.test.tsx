import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import { resetStore } from '@/__tests__/utils/test-utils'
import { installMemoryStorage, restoreStorage } from '@/__tests__/utils/memoryStorage'
import { useAppStore } from '@/store/useAppStore'
import { UPDATE_USER } from '@/graphql/mutations'
import { GET_USER } from '@/graphql/queries'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/dashboard/settings',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock ThemeContext
const mockToggleTheme = jest.fn().mockReturnValue('light')
const mockSetTheme = jest.fn()
const mockToggleNeoBrutalism = jest.fn().mockReturnValue(false)
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    themeMode: 'light',
    setTheme: mockSetTheme,
    toggleTheme: mockToggleTheme,
    isDarkMode: false,
    neoBrutalism: false,
    toggleNeoBrutalism: mockToggleNeoBrutalism,
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
  bio: 'Existing about text',
  avatar: 'https://example.com/avatar.png',
  admin: false,
  accountStatus: 'active',
}

const getUserMock = {
  request: {
    query: GET_USER,
    variables: { username: 'testuser' },
  },
  result: {
    data: {
      user: {
        _id: 'user-1',
        name: 'Test User',
        username: 'testuser',
        bio: 'Existing about text',
        upvotes: 0,
        downvotes: 0,
        _followingId: [],
        _followersId: [],
        avatar: 'https://example.com/avatar.png',
        contributorBadge: false,
        reputation: null,
      },
    },
  },
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
        bio: 'Existing about text',
        themePreference: 'light',
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
        bio: 'Existing about text',
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
    render(<SettingsPageClient />, { mocks: [getUserMock] })
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders unified form with all fields', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock] })
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('About')).toBeInTheDocument()
  })

  it('renders profile form with user data by default', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock] })
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing about text')).toBeInTheDocument()
  })

  it('renders dark mode toggle', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock] })
    expect(screen.getByText('Dark Mode')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /toggle dark mode/i })).toBeInTheDocument()
  })

  it.skip('renders optional password field', () => {
    // Password field is currently hidden/commented out
    render(<SettingsPageClient />, { mocks: [getUserMock] })
    expect(screen.getByPlaceholderText('Leave blank to keep current password')).toBeInTheDocument()
  })

  it('shows save button as disabled when form is pristine', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock] })
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeDisabled()
  })

  it('enables save button when form is dirty', async () => {
    render(<SettingsPageClient />, { mocks: [getUserMock, updateUserMock] })
    const nameInput = screen.getByDisplayValue('Test User')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).not.toBeDisabled()
    })
  })

  it('shows change avatar button', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock] })
    expect(screen.getByLabelText('Change avatar')).toBeInTheDocument()
  })

  it('navigates to avatar page when avatar is clicked', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock] })
    fireEvent.click(screen.getByLabelText('Change avatar'))
    expect(mockPush).toHaveBeenCalledWith('/dashboard/profile/testuser/avatar')
  })

  it('renders sign out button', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock] })
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it.skip('validates password requirements', async () => {
    // Password field is currently hidden/commented out
    render(<SettingsPageClient />, { mocks: [getUserMock] })

    const pwInput = screen.getByPlaceholderText('Leave blank to keep current password')
    fireEvent.change(pwInput, { target: { value: 'short' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
  })

  describe('Profile Background', () => {
    beforeEach(() => {
      installMemoryStorage()
    })

    afterEach(() => {
      restoreStorage()
    })

    it('renders the profile background section with pattern options', () => {
      render(<SettingsPageClient />, { mocks: [getUserMock] })
      expect(screen.getByText('Profile Background')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Zigzag' })).toBeInTheDocument()
      expect(screen.getByLabelText('Profile background preview')).toBeInTheDocument()
    })

    it('persists the selected pattern', async () => {
      render(<SettingsPageClient />, { mocks: [getUserMock] })
      fireEvent.click(screen.getByRole('button', { name: 'Zigzag' }))

      await waitFor(() => {
        expect(localStorage.getItem('profileBgPattern')).toBe('zigzag')
      })
      expect(screen.getByRole('button', { name: 'Zigzag' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    })

    it('enables Save Changes when only the background pattern changes', async () => {
      render(<SettingsPageClient />, { mocks: [getUserMock] })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
      })

      // Default pattern is zigzag — switch to a different one to dirty the form.
      fireEvent.click(screen.getByRole('button', { name: 'Solid' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled()
      })
    })

    it('persists the selected color swatch', async () => {
      render(<SettingsPageClient />, { mocks: [getUserMock] })
      fireEvent.click(screen.getByLabelText('Background color #3b82f6'))

      await waitFor(() => {
        expect(localStorage.getItem('profileBgColor')).toBe('#3b82f6')
      })
    })

    it('enables Save Changes when only the background color changes', async () => {
      render(<SettingsPageClient />, { mocks: [getUserMock] })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
      })

      fireEvent.click(screen.getByLabelText('Background color #3b82f6'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled()
      })
    })
  })
})
