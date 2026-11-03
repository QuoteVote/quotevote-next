import { GraphQLError } from 'graphql'
import { toast } from 'sonner'
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import SignupPageContent from '@/app/auths/(card)/signup/PageContent'
import { VERIFY_INVITE_SIGNUP_TOKEN } from '@/graphql/queries'
import { COMPLETE_SIGNUP } from '@/graphql/mutations'
import { CURRENT_TERMS_VERSION } from '@/lib/constants/terms'

const mockPush = jest.fn()
let mockSearch = ''
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

describe('SignupPageContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearch = ''
  })

  it('renders all 4 fields', () => {
    render(<SignupPageContent />)
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    render(<SignupPageContent />)
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'Password1' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password2' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for weak password', async () => {
    render(<SignupPageContent />)
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'weak' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/min 8 chars/i)).toBeInTheDocument()
    })
  })

  it('renders sign in link', () => {
    render(<SignupPageContent />)
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })
})

describe('SignupPageContent invite signup (#592, #636)', () => {
  const token = 'invite-token'
  const invited = { _id: 'user-1', username: 'invited@example.com', email: 'invited@example.com' }
  const verifyMock = {
    request: { query: VERIFY_INVITE_SIGNUP_TOKEN, variables: { token } },
    result: { data: { verifyInviteSignupToken: invited } },
  }
  // MockLink only matches when the variables are exactly these, so no email is sent.
  const completeSignupRequest = {
    query: COMPLETE_SIGNUP,
    variables: {
      token,
      username: 'newmember',
      password: 'Password1',
      acceptedTermsVersion: CURRENT_TERMS_VERSION,
    },
  }

  const fillInviteForm = async ({ acceptTerms = true } = {}) => {
    await waitFor(() => expect(screen.getByLabelText(/email/i)).toHaveValue('invited@example.com'))
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newmember' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1' } })
    if (acceptTerms) fireEvent.click(screen.getByTestId('signup-tos-checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSearch = `token=${token}`
  })

  it('fills in the invited email and makes it read-only', async () => {
    render(<SignupPageContent />, { mocks: [verifyMock] })

    const email = await screen.findByLabelText(/email/i)
    await waitFor(() => expect(email).toHaveValue('invited@example.com'))
    expect(email).toHaveAttribute('readonly')
    expect(email).toHaveAccessibleDescription(/invite was sent to this address/i)
  })

  it('finishes the invite with completeSignup and the current Terms version, then sends the user to sign in', async () => {
    const completeMock = {
      request: completeSignupRequest,
      result: { data: { completeSignup: { _id: 'user-1', username: 'newmember' } } },
    }
    render(<SignupPageContent />, { mocks: [verifyMock, completeMock] })

    await fillInviteForm()

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auths/login'))
    expect(toast.success).toHaveBeenCalledWith('Account created! Please sign in.')
  })

  it('requires Terms acceptance before completing signup', async () => {
    render(<SignupPageContent />, { mocks: [verifyMock] })

    await fillInviteForm({ acceptTerms: false })

    expect(await screen.findByText(/you must agree to the terms of service/i)).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows the backend error and stays on the page when completeSignup fails', async () => {
    const failingMock = {
      request: completeSignupRequest,
      result: { errors: [new GraphQLError('Username already exists!')] },
    }
    render(<SignupPageContent />, { mocks: [verifyMock, failingMock] })

    await fillInviteForm()

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Username already exists!'))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows the invalid invite screen when the link is not an approved, unfinished invite', async () => {
    const expiredMock = {
      request: { query: VERIFY_INVITE_SIGNUP_TOKEN, variables: { token } },
      result: { data: { verifyInviteSignupToken: null } },
    }
    render(<SignupPageContent />, { mocks: [expiredMock] })

    expect(await screen.findByText(/invalid invite/i)).toBeInTheDocument()
    expect(screen.queryByTestId('signup-form')).not.toBeInTheDocument()
  })

  it('keeps the email editable for signup without an invite', () => {
    mockSearch = ''
    render(<SignupPageContent />)

    const email = screen.getByLabelText(/email/i)
    expect(email).not.toHaveAttribute('readonly')
    expect(email).toHaveValue('')
    expect(screen.queryByText(/invite was sent to this address/i)).not.toBeInTheDocument()
  })
})
