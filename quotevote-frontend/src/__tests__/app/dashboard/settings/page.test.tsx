import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import { resetStore } from '@/__tests__/utils/test-utils'
import { installMemoryStorage, restoreStorage } from '@/__tests__/utils/memoryStorage'
import { useAppStore } from '@/store/useAppStore'
import { UPDATE_USER } from '@/graphql/mutations'
import { GET_USER, GET_USER_BIO } from '@/graphql/queries'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/settings',
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
  const mod = await import('@/app/(dashboard)/settings/SettingsPageClient')
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

const getUserBioMock = {
  request: {
    query: GET_USER_BIO,
    variables: { username: 'testuser' },
  },
  result: {
    data: {
      user: {
        _id: 'user-1',
        bio: 'Thoughtful dialogue.',
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
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders unified form with all fields', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders the About field when the API supports bio', async () => {
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
    const about = await screen.findByLabelText('About')
    expect(about).toBeInTheDocument()
    await waitFor(() => {
      expect(about).toHaveValue('Thoughtful dialogue.')
    })
  })

  it('hides the About field when User.bio is unavailable', async () => {
    const bioUnavailable = {
      request: {
        query: GET_USER_BIO,
        variables: { username: 'testuser' },
      },
      result: {
        errors: [{ message: 'Cannot query field "bio" on type "User".' }],
      },
    }
    render(<SettingsPageClient />, { mocks: [getUserMock, bioUnavailable] })
    await waitFor(() => {
      expect(screen.queryByLabelText('About')).not.toBeInTheDocument()
    })
  })

  it('renders profile form with user data by default', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('renders dark mode toggle', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
    expect(screen.getByText('Dark Mode')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /toggle dark mode/i })).toBeInTheDocument()
  })

  it.skip('renders optional password field', () => {
    // Password field is currently hidden/commented out
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
    expect(screen.getByPlaceholderText('Leave blank to keep current password')).toBeInTheDocument()
  })

  it('shows save button as disabled when form is pristine', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeDisabled()
  })

  it('enables save button when form is dirty', async () => {
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock, updateUserMock] })
    const nameInput = screen.getByDisplayValue('Test User')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).not.toBeDisabled()
    })
  })

  it('shows change avatar button', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
    expect(screen.getByLabelText('Change avatar')).toBeInTheDocument()
  })

  it('navigates to avatar page when avatar is clicked', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
    fireEvent.click(screen.getByLabelText('Change avatar'))
    expect(mockPush).toHaveBeenCalledWith('/profile/testuser/avatar')
  })

  it('renders sign out button', () => {
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it.skip('validates password requirements', async () => {
    // Password field is currently hidden/commented out
    render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })

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
      render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
      expect(screen.getByText('Profile Background')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Zigzag' })).toBeInTheDocument()
      expect(screen.getByLabelText('Profile background preview')).toBeInTheDocument()
    })

    it('persists the selected pattern', async () => {
      render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
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
      render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })

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
      render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })
      fireEvent.click(screen.getByLabelText('Background color #3b82f6'))

      await waitFor(() => {
        expect(localStorage.getItem('profileBgColor')).toBe('#3b82f6')
      })
    })

    it('enables Save Changes when only the background color changes', async () => {
      render(<SettingsPageClient />, { mocks: [getUserMock, getUserBioMock] })

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
