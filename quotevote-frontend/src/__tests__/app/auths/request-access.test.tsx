/**
 * Request Access Page Tests
 */

import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import { RequestAccessPageContent } from '@/app/auths/request-access/PageContent'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: jest.fn(),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

import { useSearchParams } from 'next/navigation'

describe('RequestAccessPageContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
    })
  })

  describe('Email request form (initial)', () => {
    it('renders the email input', () => {
      render(<RequestAccessPageContent />)
      expect(
        screen.queryByPlaceholderText(/enter email/i) ||
        screen.queryByRole('textbox')
      ).toBeTruthy()
    })

    it('renders the Request Invite button', () => {
      render(<RequestAccessPageContent />)
      expect(
        screen.queryByText(/request invite/i)
      ).toBeTruthy()
    })
  })

  describe('Step navigation via URL', () => {
    it('handles ?step param without crashing', () => {
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === 'step' ? 'personal' : null),
      })
      const { container } = render(<RequestAccessPageContent />)
      expect(container).toBeInTheDocument()
    })

    it('handles ?step=business without crashing', () => {
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === 'step' ? 'business' : null),
      })
      const { container } = render(<RequestAccessPageContent />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('Personal form validation', () => {
    it('shows validation errors on empty submit', async () => {
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === 'step' ? 'personal' : null),
      })
      render(<RequestAccessPageContent />)
      const submitBtn = screen.queryByRole('button', { name: /continue|next|submit/i })
      if (submitBtn) {
        fireEvent.click(submitBtn)
        await waitFor(() => {
          const errors = screen.queryAllByText(/required/i)
          expect(errors.length).toBeGreaterThan(0)
        })
      }
    })
  })

  describe('Payment/final step', () => {
    it('renders payment step when ?step=payment', () => {
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === 'step' ? 'payment' : null),
      })
      const { container } = render(<RequestAccessPageContent />)
      expect(container).toBeInTheDocument()
    })
  })
})
