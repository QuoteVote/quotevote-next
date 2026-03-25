import { render, screen, fireEvent } from '@testing-library/react'
import StripePaymentDialog from '@/components/StripePaymentDialog/StripePaymentDialog'

// Mock the dialog component
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ComponentProps<'button'>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

describe('StripePaymentDialog', () => {
  it('renders dialog when open', () => {
    render(<StripePaymentDialog open={true} onClose={jest.fn()} />)
    expect(screen.getByTestId('dialog')).toBeInTheDocument()
    expect(screen.getByText('Support Our Mission')).toBeInTheDocument()
  })

  it('does not render dialog when closed', () => {
    render(<StripePaymentDialog open={false} onClose={jest.fn()} />)
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('shows description text', () => {
    render(<StripePaymentDialog open={true} onClose={jest.fn()} />)
    expect(
      screen.getByText(/your contribution helps us continue/i)
    ).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(<StripePaymentDialog open={true} onClose={jest.fn()} />)
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(<StripePaymentDialog open={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
