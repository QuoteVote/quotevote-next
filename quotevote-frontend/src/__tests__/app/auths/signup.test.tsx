import { GraphQLError } from 'graphql'
import { toast } from 'sonner'
import { redirect } from 'next/navigation'
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import SignupPage from '@/app/auths/(card)/signup/page'
import SignupPageContent from '@/app/auths/(card)/signup/PageContent'
import { VERIFY_INVITE_SIGNUP_TOKEN } from '@/graphql/queries'
import { COMPLETE_SIGNUP } from '@/graphql/mutations'
import { CURRENT_TERMS_VERSION } from '@/lib/constants/terms'

const mockPush = jest.fn()
let mockSearch = ''
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(mockSearch),
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

const token = 'invite-token'
const invited = { _id: 'user-1', username: 'invited@example.com', email: 'invited@example.com' }
const verifyMock = {
  request: { query: VERIFY_INVITE_SIGNUP_TOKEN, variables: { token } },
  result: { data: { verifyInviteSignupToken: invited } },
}

const renderInvite = (mocks: unknown[] = [verifyMock]) =>
  render(<SignupPageContent />, { mocks: mocks as never })

const waitForInviteForm = () =>
  waitFor(() => expect(screen.getByLabelText(/email/i)).toHaveValue('invited@example.com'))

beforeEach(() => {
  jest.clearAllMocks()
  mockSearch = `token=${token}`
})

describe('SignupPage invitation-only access (#665)', () => {
  it.each([
    ['no token', {}],
    ['an empty token', { token: '  ' }],
    ['a repeated token parameter', { token: ['a', 'b'] }],
  ])('redirects to Request Access when the link has %s', async (_label, searchParams) => {
    await expect(SignupPage({ searchParams: Promise.resolve(searchParams) })).rejects.toThrow(
      'NEXT_REDIRECT'
    )
    expect(redirect).toHaveBeenCalledWith('/auths/request-access')
  })

  it('renders the signup form for an invite link', async () => {
    await expect(SignupPage({ searchParams: Promise.resolve({ token }) })).resolves.toBeTruthy()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('shows the invalid invite screen and no form when the content renders without a token', () => {
    mockSearch = ''
    render(<SignupPageContent />)

    expect(screen.getByText(/invalid invite/i)).toBeInTheDocument()
    expect(screen.queryByTestId('signup-form')).not.toBeInTheDocument()
  })
})

describe('SignupPageContent form', () => {
  it('renders all 4 fields', async () => {
    renderInvite()
    await waitForInviteForm()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    renderInvite()
    await waitForInviteForm()
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password2' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('shows validation error for weak password', async () => {
    renderInvite()
    await waitForInviteForm()
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'weak' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/min 8 chars/i)).toBeInTheDocument()
  })

  it('renders sign in link', async () => {
    renderInvite()
    await waitForInviteForm()
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })
})

describe('SignupPageContent invite signup (#592, #636)', () => {
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
    await waitForInviteForm()
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newmember' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1' } })
    if (acceptTerms) fireEvent.click(screen.getByTestId('signup-tos-checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
  }

  it('fills in the invited email and makes it read-only', async () => {
    renderInvite()

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
    renderInvite([verifyMock, completeMock])

    await fillInviteForm()

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auths/login'))
    expect(toast.success).toHaveBeenCalledWith('Account created! Please sign in.')
  })

  it('requires Terms acceptance before completing signup', async () => {
    renderInvite()

    await fillInviteForm({ acceptTerms: false })

    expect(await screen.findByText(/you must agree to the terms of service/i)).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows the backend error and stays on the page when completeSignup fails', async () => {
    const failingMock = {
      request: completeSignupRequest,
      result: { errors: [new GraphQLError('Username already exists!')] },
    }
    renderInvite([verifyMock, failingMock])

    await fillInviteForm()

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Username already exists!'))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows the invalid invite screen when the link is not an approved, unfinished invite', async () => {
    const expiredMock = {
      request: { query: VERIFY_INVITE_SIGNUP_TOKEN, variables: { token } },
      result: { data: { verifyInviteSignupToken: null } },
    }
    renderInvite([expiredMock])

    expect(await screen.findByText(/invalid invite/i)).toBeInTheDocument()
    expect(screen.queryByTestId('signup-form')).not.toBeInTheDocument()
  })
})
