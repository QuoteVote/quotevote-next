/**
 * Password Reset Page Tests
 */

import { render, screen, fireEvent, waitFor, type MockedResponse } from '../../utils/test-utils'
import PasswordResetPageContent from '@/app/auths/password-reset/PageContent'
import { VERIFY_PASSWORD_RESET_TOKEN } from '@/graphql/queries'
import { UPDATE_USER_PASSWORD } from '@/graphql/mutations'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: jest.fn(),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

import { useSearchParams } from 'next/navigation'

describe('PasswordResetPageContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when no token in URL', () => {
    it('shows invalid link message', () => {
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === 'token' ? '' : null),
      })
      render(<PasswordResetPageContent />)
      expect(screen.getByText(/invalid link/i)).toBeInTheDocument()
    })

    it('shows link to request new reset', () => {
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: () => '',
      })
      render(<PasswordResetPageContent />)
      expect(screen.getByText(/request a new link/i)).toBeInTheDocument()
    })
  })

  describe('when token is valid', () => {
    const validTokenMock: MockedResponse[] = [
      {
        request: {
          query: VERIFY_PASSWORD_RESET_TOKEN,
          variables: { token: 'valid-token' },
        },
        result: {
          data: { verifyUserPasswordResetToken: true },
        },
      },
    ]

    beforeEach(() => {
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => {
          if (key === 'token') return 'valid-token'
          if (key === 'username') return 'testuser'
          return null
        },
      })
    })

    it('renders password form after token verified', async () => {
      render(<PasswordResetPageContent />, { mocks: validTokenMock })
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })
    })

    it('renders confirm password field', async () => {
      render(<PasswordResetPageContent />, { mocks: validTokenMock })
      await waitFor(() => {
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      })
    })

    it('renders Set New Password heading', async () => {
      render(<PasswordResetPageContent />, { mocks: validTokenMock })
      await waitFor(() => {
        expect(screen.getByText(/set new password/i)).toBeInTheDocument()
      })
    })
  })

  describe('when token is invalid', () => {
    beforeEach(() => {
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === 'token' ? 'expired-token' : null),
      })
    })

    it('shows link expired message', async () => {
      const invalidMock: MockedResponse[] = [
        {
          request: {
            query: VERIFY_PASSWORD_RESET_TOKEN,
            variables: { token: 'expired-token' },
          },
          result: {
            data: { verifyUserPasswordResetToken: false },
          },
        },
      ]
      render(<PasswordResetPageContent />, { mocks: invalidMock })
      await waitFor(() => {
        expect(screen.getByText(/link expired/i)).toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    const token = 'valid-token'
    const username = 'testuser'

    const mocks: MockedResponse[] = [
      {
        request: {
          query: VERIFY_PASSWORD_RESET_TOKEN,
          variables: { token },
        },
        result: { data: { verifyUserPasswordResetToken: true } },
      },
      {
        request: {
          query: UPDATE_USER_PASSWORD,
          variables: { token, password: 'Newpass1', username },
        },
        result: { data: { updateUserPassword: true } },
      },
    ]

    it('shows validation error for weak password', async () => {
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === 'token' ? token : key === 'username' ? username : null),
      })
      render(<PasswordResetPageContent />, { mocks })
      await waitFor(() => screen.getByLabelText(/new password/i))
      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'weak' },
      })
      fireEvent.click(screen.getByRole('button', { name: /update password/i }))
      await waitFor(() => {
        // Zod min(8) error or regex error both indicate invalid password
        const errors = document.querySelectorAll('.text-destructive')
        expect(errors.length).toBeGreaterThan(0)
      })
    })
  })
})
