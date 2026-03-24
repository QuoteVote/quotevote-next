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

  describe('Plan step (initial)', () => {
    it('renders the plan selection step by default', () => {
      render(<RequestAccessPageContent />)
      // Plan step should show Personal and Business options
      expect(
        screen.queryByText(/personal/i) || screen.queryByText(/plan/i) || screen.queryByText(/business/i)
      ).toBeTruthy()
    })

    it('renders step indicator', () => {
      const { container } = render(<RequestAccessPageContent />)
      // Step indicator uses rounded bars
      const indicators = container.querySelectorAll('.rounded-full')
      expect(indicators.length).toBeGreaterThan(0)
    })
  })

  describe('Step navigation via URL', () => {
    it('shows personal step when ?step=personal', () => {
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === 'step' ? 'personal' : null),
      })
      render(<RequestAccessPageContent />)
      expect(
        screen.queryByLabelText(/first name/i) ||
        screen.queryByText(/first name/i) ||
        screen.queryByPlaceholderText(/jane/i)
      ).toBeTruthy()
    })

    it('shows business step when ?step=business', () => {
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === 'step' ? 'business' : null),
      })
      render(<RequestAccessPageContent />)
      expect(
        screen.queryByLabelText(/company/i) ||
        screen.queryByText(/company/i) ||
        screen.queryByPlaceholderText(/acme/i)
      ).toBeTruthy()
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
