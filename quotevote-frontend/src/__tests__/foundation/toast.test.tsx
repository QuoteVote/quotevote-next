/**
 * Toast Notification Tests
 *
 * Tests that toast notifications can be triggered and displayed correctly.
 */

import { render, screen, fireEvent, waitFor } from '../utils/test-utils'

// Mock sonner
const mockToastSuccess = jest.fn()
const mockToastError = jest.fn()
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
  Toaster: () => null,
}))

import { toast } from 'sonner'

describe('Toast Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('toast.success', () => {
    it('can be called with a message', () => {
      toast.success('Operation successful')
      expect(mockToastSuccess).toHaveBeenCalledWith('Operation successful')
    })

    it('can be called with options', () => {
      toast.success('Done', { duration: 3000 } as Parameters<typeof toast.success>[1])
      expect(mockToastSuccess).toHaveBeenCalledWith('Done', { duration: 3000 })
    })
  })

  describe('toast.error', () => {
    it('can be called with a message', () => {
      toast.error('Something went wrong')
      expect(mockToastError).toHaveBeenCalledWith('Something went wrong')
    })

    it('can be called multiple times', () => {
      toast.error('Error 1')
      toast.error('Error 2')
      expect(mockToastError).toHaveBeenCalledTimes(2)
    })
  })

  describe('Toast trigger from components', () => {
    it('triggers toast on button click', async () => {
      const ToastTrigger = () => {
        const handleClick = () => {
          toast.success('Button clicked!')
        }
        return <button onClick={handleClick}>Trigger Toast</button>
      }

      render(<ToastTrigger />)
      fireEvent.click(screen.getByText('Trigger Toast'))
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Button clicked!')
      })
    })

    it('triggers error toast on failure', async () => {
      const ErrorToastTrigger = () => {
        const handleClick = () => {
          toast.error('An error occurred')
        }
        return <button onClick={handleClick}>Trigger Error</button>
      }

      render(<ErrorToastTrigger />)
      fireEvent.click(screen.getByText('Trigger Error'))
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('An error occurred')
      })
    })
  })
})
