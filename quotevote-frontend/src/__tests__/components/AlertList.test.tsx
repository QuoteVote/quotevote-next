/**
 * AlertList Component Tests
 * 
 * Tests that verify:
 * - Component renders correctly with different props
 * - Loading state with skeleton loaders
 * - Empty state handling
 * - Multiple alerts rendering
 * - Different alert variants
 * - Dismiss functionality
 * - Accessibility attributes
 * - Styling and classes
 * - Edge cases
 */

import { render, screen, fireEvent } from '../utils/test-utils'
import { AlertList } from '@/components/AlertList'
import type { AlertItem } from '@/types/components'

describe('AlertList Component', () => {
  const mockAlerts: AlertItem[] = [
    {
      id: '1',
      variant: 'default',
      title: 'Default Alert',
      description: 'This is a default alert',
    },
    {
      id: '2',
      variant: 'success',
      title: 'Success Alert',
      description: 'This is a success alert',
    },
    {
      id: '3',
      variant: 'destructive',
      title: 'Error Alert',
      description: 'This is an error alert',
    },
  ]

  describe('Rendering', () => {
    it('renders without crashing with empty array', () => {
      const { container } = render(<AlertList alerts={[]} />)

      expect(container).toBeInTheDocument()
    })

    it('renders without crashing with alerts', () => {
      const { container } = render(<AlertList alerts={mockAlerts} />)

      expect(container).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(
        <AlertList alerts={mockAlerts} className="custom-class" />
      )

      const listContainer = container.firstChild as HTMLElement
      expect(listContainer).toHaveClass('custom-class')
    })

    it('renders all alerts in the array', () => {
      render(<AlertList alerts={mockAlerts} />)

      expect(screen.getByText('Default Alert')).toBeInTheDocument()
      expect(screen.getByText('Success Alert')).toBeInTheDocument()
      expect(screen.getByText('Error Alert')).toBeInTheDocument()
    })

    it('renders alert titles and descriptions', () => {
      render(<AlertList alerts={mockAlerts} />)

      expect(screen.getByText('Default Alert')).toBeInTheDocument()
      expect(screen.getByText('This is a default alert')).toBeInTheDocument()
      expect(screen.getByText('Success Alert')).toBeInTheDocument()
      expect(screen.getByText('This is a success alert')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('renders skeleton loaders when loading is true', () => {
      const { container } = render(<AlertList alerts={mockAlerts} loading />)

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders default number of skeleton loaders (3)', () => {
      const { container } = render(<AlertList alerts={mockAlerts} loading />)

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBe(3)
    })

    it('renders custom number of skeleton loaders', () => {
      const { container } = render(
        <AlertList alerts={mockAlerts} loading skeletonLimit={5} />
      )

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBe(5)
    })

    it('does not render alerts when loading', () => {
      render(<AlertList alerts={mockAlerts} loading />)

      expect(screen.queryByText('Default Alert')).not.toBeInTheDocument()
      expect(screen.queryByText('Success Alert')).not.toBeInTheDocument()
    })

    it('skeleton loaders have correct structure', () => {
      const { container } = render(<AlertList alerts={mockAlerts} loading />)

      const skeletons = container.querySelectorAll('.animate-pulse')
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('relative', 'w-full', 'rounded-lg', 'border')
      })
    })
  })

  describe('Empty State', () => {
    it('renders empty message when alerts array is empty', () => {
      render(<AlertList alerts={[]} />)

      expect(screen.getByText('No alerts to display')).toBeInTheDocument()
    })

    it('renders custom empty message', () => {
      render(
        <AlertList alerts={[]} emptyMessage="No notifications available" />
      )

      expect(screen.getByText('No notifications available')).toBeInTheDocument()
    })

    it('applies correct styling to empty state', () => {
      const { container } = render(<AlertList alerts={[]} />)

      const emptyState = container.firstChild as HTMLElement
      expect(emptyState).toHaveClass(
        'w-full',
        'text-center',
        'py-8',
        'text-muted-foreground'
      )
    })

    it('renders empty state with custom className', () => {
      const { container } = render(
        <AlertList alerts={[]} className="custom-empty-class" />
      )

      const emptyState = container.firstChild as HTMLElement
      expect(emptyState).toHaveClass('custom-empty-class')
    })
  })

  describe('Alert Variants', () => {
    it('renders alerts with default variant when not specified', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'No Variant Alert',
          description: 'Should use default',
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('bg-card', 'text-card-foreground')
    })

    it('renders alerts with success variant', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          variant: 'success',
          title: 'Success',
          description: 'Success message',
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('text-green-600', 'bg-card', 'border-green-500/50')
    })

    it('renders alerts with destructive variant', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          variant: 'destructive',
          title: 'Error',
          description: 'Error message',
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('text-destructive', 'bg-card', 'border-destructive/50')
    })

    it('renders alerts with warning variant', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          variant: 'warning',
          title: 'Warning',
          description: 'Warning message',
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('text-yellow-600', 'bg-card', 'border-yellow-500/50')
    })

    it('renders alerts with info variant', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          variant: 'info',
          title: 'Info',
          description: 'Info message',
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('text-blue-600', 'bg-card', 'border-blue-500/50')
    })

    it('renders multiple alerts with different variants', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          variant: 'success',
          title: 'Success',
        },
        {
          id: '2',
          variant: 'destructive',
          title: 'Error',
        },
        {
          id: '3',
          variant: 'warning',
          title: 'Warning',
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const alertElements = container.querySelectorAll('[role="alert"]')
      expect(alertElements.length).toBe(3)

      expect(alertElements[0]).toHaveClass('text-green-600')
      expect(alertElements[1]).toHaveClass('text-destructive')
      expect(alertElements[2]).toHaveClass('text-yellow-600')
    })
  })

  describe('Dismiss Functionality', () => {
    it('renders dismiss button when onDismiss is provided', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Dismissible Alert',
          description: 'Can be dismissed',
          onDismiss: jest.fn(),
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const dismissButton = container.querySelector('button[aria-label="Dismiss alert"]')
      expect(dismissButton).toBeInTheDocument()
    })

    it('does not render dismiss button when onDismiss is not provided', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Non-dismissible Alert',
          description: 'Cannot be dismissed',
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const dismissButton = container.querySelector('button[aria-label="Dismiss alert"]')
      expect(dismissButton).not.toBeInTheDocument()
    })

    it('calls onDismiss with correct alert id when dismiss button is clicked', () => {
      const onDismiss = jest.fn()
      const alerts: AlertItem[] = [
        {
          id: 'alert-123',
          title: 'Dismissible Alert',
          description: 'Can be dismissed',
          onDismiss,
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const dismissButton = container.querySelector(
        'button[aria-label="Dismiss alert"]'
      ) as HTMLButtonElement
      fireEvent.click(dismissButton)

      expect(onDismiss).toHaveBeenCalledTimes(1)
      expect(onDismiss).toHaveBeenCalledWith('alert-123')
    })

    it('calls onDismiss for correct alert when multiple alerts have dismiss handlers', () => {
      const onDismiss1 = jest.fn()
      const onDismiss2 = jest.fn()
      const alerts: AlertItem[] = [
        {
          id: 'alert-1',
          title: 'First Alert',
          onDismiss: onDismiss1,
        },
        {
          id: 'alert-2',
          title: 'Second Alert',
          onDismiss: onDismiss2,
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const dismissButtons = container.querySelectorAll(
        'button[aria-label="Dismiss alert"]'
      )
      expect(dismissButtons.length).toBe(2)

      fireEvent.click(dismissButtons[0] as HTMLButtonElement)
      expect(onDismiss1).toHaveBeenCalledWith('alert-1')
      expect(onDismiss2).not.toHaveBeenCalled()

      fireEvent.click(dismissButtons[1] as HTMLButtonElement)
      expect(onDismiss2).toHaveBeenCalledWith('alert-2')
    })

    it('dismiss button has correct accessibility attributes', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Dismissible Alert',
          onDismiss: jest.fn(),
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const dismissButton = container.querySelector(
        'button[aria-label="Dismiss alert"]'
      )
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss alert')
      expect(dismissButton).toHaveAttribute('type', 'button')
    })

    it('dismiss button has sr-only text for screen readers', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Dismissible Alert',
          onDismiss: jest.fn(),
        },
      ]

      render(<AlertList alerts={alerts} />)

      const srText = screen.getByText('Dismiss')
      expect(srText).toBeInTheDocument()
      expect(srText).toHaveClass('sr-only')
    })
  })

  describe('Styling', () => {
    it('applies correct container classes', () => {
      const { container } = render(<AlertList alerts={mockAlerts} />)

      const listContainer = container.firstChild as HTMLElement
      expect(listContainer).toHaveClass('w-full', 'space-y-4')
    })

    it('applies custom className to container', () => {
      const { container } = render(
        <AlertList alerts={mockAlerts} className="my-custom-class" />
      )

      const listContainer = container.firstChild as HTMLElement
      expect(listContainer).toHaveClass('my-custom-class')
    })

    it('renders alerts with proper spacing', () => {
      const { container } = render(<AlertList alerts={mockAlerts} />)

      const listContainer = container.firstChild as HTMLElement
      expect(listContainer).toHaveClass('space-y-4')
    })

    it('each alert has relative positioning for dismiss button', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Alert',
          onDismiss: jest.fn(),
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('relative')
    })
  })

  describe('Accessibility', () => {
    it('each alert has role="alert" attribute', () => {
      const { container } = render(<AlertList alerts={mockAlerts} />)

      const alerts = container.querySelectorAll('[role="alert"]')
      expect(alerts.length).toBe(mockAlerts.length)

      alerts.forEach((alert) => {
        expect(alert).toHaveAttribute('role', 'alert')
      })
    })

    it('dismiss buttons are keyboard accessible', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Dismissible Alert',
          onDismiss: jest.fn(),
        },
      ]

      const { container } = render(<AlertList alerts={alerts} />)

      const dismissButton = container.querySelector(
        'button[aria-label="Dismiss alert"]'
      ) as HTMLButtonElement

      // Simulate keyboard interaction
      dismissButton.focus()
      expect(document.activeElement).toBe(dismissButton)

      fireEvent.keyDown(dismissButton, { key: 'Enter', code: 'Enter' })
      // Button should be focusable and keyboard accessible
      expect(dismissButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Component Structure', () => {
    it('renders alerts in correct order', () => {
      render(<AlertList alerts={mockAlerts} />)

      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBe(3)

      // Check that alerts are rendered in the order provided
      expect(alerts[0]).toHaveTextContent('Default Alert')
      expect(alerts[1]).toHaveTextContent('Success Alert')
      expect(alerts[2]).toHaveTextContent('Error Alert')
    })

    it('renders alerts with title only', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Title Only',
        },
      ]

      render(<AlertList alerts={alerts} />)

      expect(screen.getByText('Title Only')).toBeInTheDocument()
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument()
    })

    it('renders alerts with description only', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          description: 'Description Only',
        },
      ]

      render(<AlertList alerts={alerts} />)

      expect(screen.getByText('Description Only')).toBeInTheDocument()
    })

    it('renders alerts with both title and description', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Title',
          description: 'Description',
        },
      ]

      render(<AlertList alerts={alerts} />)

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles single alert', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Single Alert',
        },
      ]

      render(<AlertList alerts={alerts} />)

      expect(screen.getByText('Single Alert')).toBeInTheDocument()
      expect(screen.getAllByRole('alert').length).toBe(1)
    })

    it('handles many alerts (10+)', () => {
      const manyAlerts: AlertItem[] = Array.from({ length: 15 }, (_, i) => ({
        id: `alert-${i}`,
        title: `Alert ${i}`,
        description: `Description ${i}`,
      }))

      const { container } = render(<AlertList alerts={manyAlerts} />)

      const alerts = container.querySelectorAll('[role="alert"]')
      expect(alerts.length).toBe(15)
    })

    it('handles alerts with empty title', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          description: 'Description only',
        },
      ]

      render(<AlertList alerts={alerts} />)

      expect(screen.getByText('Description only')).toBeInTheDocument()
    })

    it('handles alerts with empty description', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Title only',
        },
      ]

      render(<AlertList alerts={alerts} />)

      expect(screen.getByText('Title only')).toBeInTheDocument()
    })

    it('handles alerts with very long text', () => {
      const longTitle = 'A'.repeat(500)
      const longDescription = 'B'.repeat(500)
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: longTitle,
          description: longDescription,
        },
      ]

      render(<AlertList alerts={alerts} />)

      expect(screen.getByText(longTitle)).toBeInTheDocument()
      expect(screen.getByText(longDescription)).toBeInTheDocument()
    })

    it('handles alerts with special characters', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Alert with !@#$%^&*()',
          description: 'Description with <>&"\'',
        },
      ]

      render(<AlertList alerts={alerts} />)

      expect(screen.getByText('Alert with !@#$%^&*()')).toBeInTheDocument()
      expect(screen.getByText('Description with <>&"\'')).toBeInTheDocument()
    })

    it('handles alerts with React elements in title', () => {
      const alerts: AlertItem[] = [
        {
          id: '1',
          title: 'Alert with <strong>bold</strong> text',
        },
      ]

      render(<AlertList alerts={alerts} />)

      expect(screen.getByText(/Alert with.*bold.*text/)).toBeInTheDocument()
    })

    it('handles loading state with empty alerts array', () => {
      const { container } = render(<AlertList alerts={[]} loading />)

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBe(3) // Default skeletonLimit
    })

    it('handles loading state with custom skeletonLimit of 0', () => {
      const { container } = render(
        <AlertList alerts={[]} loading skeletonLimit={0} />
      )

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBe(0)
    })

    it('handles loading state with large skeletonLimit', () => {
      const { container } = render(
        <AlertList alerts={[]} loading skeletonLimit={20} />
      )

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBe(20)
    })
  })

  describe('Integration', () => {
    it('works correctly with all features together', () => {
      const onDismiss1 = jest.fn()
      const onDismiss2 = jest.fn()
      const complexAlerts: AlertItem[] = [
        {
          id: '1',
          variant: 'success',
          title: 'Success Alert',
          description: 'This is a success message',
          onDismiss: onDismiss1,
        },
        {
          id: '2',
          variant: 'destructive',
          title: 'Error Alert',
          description: 'This is an error message',
          onDismiss: onDismiss2,
        },
        {
          id: '3',
          variant: 'info',
          title: 'Info Alert',
          description: 'This is an info message',
        },
      ]

      const { container } = render(
        <AlertList alerts={complexAlerts} className="custom-class" />
      )

      // Check all alerts are rendered
      const alerts = container.querySelectorAll('[role="alert"]')
      expect(alerts.length).toBe(3)

      // Check variants
      expect(alerts[0]).toHaveClass('text-green-600')
      expect(alerts[1]).toHaveClass('text-destructive')
      expect(alerts[2]).toHaveClass('text-blue-600')

      // Check dismiss buttons
      const dismissButtons = container.querySelectorAll(
        'button[aria-label="Dismiss alert"]'
      )
      expect(dismissButtons.length).toBe(2)

      // Check content
      expect(screen.getByText('Success Alert')).toBeInTheDocument()
      expect(screen.getByText('Error Alert')).toBeInTheDocument()
      expect(screen.getByText('Info Alert')).toBeInTheDocument()

      // Check custom className
      const listContainer = container.firstChild as HTMLElement
      expect(listContainer).toHaveClass('custom-class')
    })

    it('maintains correct structure when switching between states', () => {
      const { rerender } = render(<AlertList alerts={[]} loading />)

      // Should show skeletons
      const container = document.body
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBe(3)

      // Switch to empty state
      rerender(<AlertList alerts={[]} loading={false} />)
      expect(screen.getByText('No alerts to display')).toBeInTheDocument()

      // Switch to alerts
      rerender(<AlertList alerts={mockAlerts} loading={false} />)
      const alerts = container.querySelectorAll('[role="alert"]')
      expect(alerts.length).toBe(3)
    })
  })
})

