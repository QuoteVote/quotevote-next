import { render, screen, act } from '@/__tests__/utils/test-utils'
import { render as baseRender } from '@testing-library/react'
import { AuthModalProvider, useAuthModal } from '@/context/AuthModalContext'

function TestComponent() {
  const { isModalOpen, openAuthModal, closeAuthModal } = useAuthModal()
  return (
    <div>
      <div data-testid="modal-state">{isModalOpen ? 'open' : 'closed'}</div>
      <button data-testid="open-button" onClick={openAuthModal}>
        Open
      </button>
      <button data-testid="close-button" onClick={closeAuthModal}>
        Close
      </button>
    </div>
  )
}

describe('AuthModalContext', () => {
  it('provides modal state and control functions', () => {
    render(
      <AuthModalProvider>
        <TestComponent />
      </AuthModalProvider>
    )

    expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')
    expect(screen.getByTestId('open-button')).toBeInTheDocument()
    expect(screen.getByTestId('close-button')).toBeInTheDocument()
  })

  it('opens modal when openAuthModal is called', () => {
    render(
      <AuthModalProvider>
        <TestComponent />
      </AuthModalProvider>
    )

    expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')

    act(() => {
      screen.getByTestId('open-button').click()
    })

    expect(screen.getByTestId('modal-state')).toHaveTextContent('open')
  })

  it('closes modal when closeAuthModal is called', () => {
    render(
      <AuthModalProvider>
        <TestComponent />
      </AuthModalProvider>
    )

    // First open the modal
    act(() => {
      screen.getByTestId('open-button').click()
    })
    expect(screen.getByTestId('modal-state')).toHaveTextContent('open')

    // Then close it
    act(() => {
      screen.getByTestId('close-button').click()
    })
    expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')
  })

  it('throws error when useAuthModal is used outside provider', () => {
    // Suppress console.error for this test
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Use base render (not the custom one with providers) to test error case
    expect(() => {
      baseRender(<TestComponent />)
    }).toThrow('useAuthModal must be used within an AuthModalProvider')

    errorSpy.mockRestore()
  })
})
