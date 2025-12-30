/**
 * Alert Component Tests
 * 
 * Tests that verify:
 * - Component renders correctly with different props
 * - All variants work correctly (default, destructive, success, warning, info)
 * - AlertTitle and AlertDescription components
 * - Accessibility attributes (role="alert")
 * - Styling and classes
 * - Icon support
 * - Edge cases
 */

import { render, screen } from '../utils/test-utils'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react'

describe('Alert Component', () => {
  describe('Rendering', () => {
    it('renders without crashing with default props', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Test Alert</AlertTitle>
          <AlertDescription>Test description</AlertDescription>
        </Alert>
      )

      expect(container).toBeInTheDocument()
      const alert = container.querySelector('[role="alert"]')
      expect(alert).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(
        <Alert className="custom-class">
          <AlertTitle>Test Alert</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('custom-class')
    })

    it('renders with only title', () => {
      render(
        <Alert>
          <AlertTitle>Test Title</AlertTitle>
        </Alert>
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })

    it('renders with only description', () => {
      render(
        <Alert>
          <AlertDescription>Test description</AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('renders with both title and description', () => {
      render(
        <Alert>
          <AlertTitle>Test Title</AlertTitle>
          <AlertDescription>Test description</AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('renders with icon', () => {
      const { container } = render(
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Test Alert</AlertTitle>
        </Alert>
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has role="alert" attribute', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Test Alert</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveAttribute('role', 'alert')
    })

    it('has data-slot="alert" attribute', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Test Alert</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toBeInTheDocument()
    })

    it('has data-slot="alert-title" on AlertTitle', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Test Title</AlertTitle>
        </Alert>
      )

      const title = container.querySelector('[data-slot="alert-title"]')
      expect(title).toBeInTheDocument()
    })

    it('has data-slot="alert-description" on AlertDescription', () => {
      const { container } = render(
        <Alert>
          <AlertDescription>Test description</AlertDescription>
        </Alert>
      )

      const description = container.querySelector('[data-slot="alert-description"]')
      expect(description).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('renders with default variant', () => {
      const { container } = render(
        <Alert variant="default">
          <AlertTitle>Default Alert</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('bg-card', 'text-card-foreground')
    })

    it('renders with destructive variant', () => {
      const { container } = render(
        <Alert variant="destructive">
          <AlertTitle>Error Alert</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('text-destructive', 'bg-card', 'border-destructive/50')
    })

    it('renders with success variant', () => {
      const { container } = render(
        <Alert variant="success">
          <AlertTitle>Success Alert</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('text-green-600', 'bg-card', 'border-green-500/50')
    })

    it('renders with warning variant', () => {
      const { container } = render(
        <Alert variant="warning">
          <AlertTitle>Warning Alert</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('text-yellow-600', 'bg-card', 'border-yellow-500/50')
    })

    it('renders with info variant', () => {
      const { container } = render(
        <Alert variant="info">
          <AlertTitle>Info Alert</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('text-blue-600', 'bg-card', 'border-blue-500/50')
    })

    it('uses default variant when variant is not specified', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Default Alert</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('bg-card', 'text-card-foreground')
    })
  })

  describe('AlertTitle Component', () => {
    it('renders title text', () => {
      render(
        <Alert>
          <AlertTitle>Test Title</AlertTitle>
        </Alert>
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })

    it('applies correct classes to title', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Test Title</AlertTitle>
        </Alert>
      )

      const title = container.querySelector('[data-slot="alert-title"]')
      expect(title).toHaveClass(
        'col-start-2',
        'line-clamp-1',
        'min-h-4',
        'font-medium',
        'tracking-tight'
      )
    })

    it('renders title with custom className', () => {
      const { container } = render(
        <Alert>
          <AlertTitle className="custom-title-class">Test Title</AlertTitle>
        </Alert>
      )

      const title = container.querySelector('[data-slot="alert-title"]')
      expect(title).toHaveClass('custom-title-class')
    })

    it('renders title with React children', () => {
      render(
        <Alert>
          <AlertTitle>
            <span>Custom Title</span>
          </AlertTitle>
        </Alert>
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    })
  })

  describe('AlertDescription Component', () => {
    it('renders description text', () => {
      render(
        <Alert>
          <AlertDescription>Test description</AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('applies correct classes to description', () => {
      const { container } = render(
        <Alert>
          <AlertDescription>Test description</AlertDescription>
        </Alert>
      )

      const description = container.querySelector('[data-slot="alert-description"]')
      expect(description).toHaveClass(
        'text-muted-foreground',
        'col-start-2',
        'grid',
        'justify-items-start',
        'gap-1',
        'text-sm'
      )
    })

    it('renders description with custom className', () => {
      const { container } = render(
        <Alert>
          <AlertDescription className="custom-desc-class">
            Test description
          </AlertDescription>
        </Alert>
      )

      const description = container.querySelector('[data-slot="alert-description"]')
      expect(description).toHaveClass('custom-desc-class')
    })

    it('renders description with React children', () => {
      render(
        <Alert>
          <AlertDescription>
            <p>Paragraph description</p>
          </AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Paragraph description')).toBeInTheDocument()
    })

    it('renders multiple paragraphs in description', () => {
      render(
        <Alert>
          <AlertDescription>
            <p>First paragraph</p>
            <p>Second paragraph</p>
          </AlertDescription>
        </Alert>
      )

      expect(screen.getByText('First paragraph')).toBeInTheDocument()
      expect(screen.getByText('Second paragraph')).toBeInTheDocument()
    })
  })

  describe('Icon Support', () => {
    it('renders with CheckCircle2 icon for success', () => {
      const { container } = render(
        <Alert variant="success">
          <CheckCircle2 />
          <AlertTitle>Success</AlertTitle>
        </Alert>
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders with XCircle icon for destructive', () => {
      const { container } = render(
        <Alert variant="destructive">
          <XCircle />
          <AlertTitle>Error</AlertTitle>
        </Alert>
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders with AlertCircle icon for warning', () => {
      const { container } = render(
        <Alert variant="warning">
          <AlertCircle />
          <AlertTitle>Warning</AlertTitle>
        </Alert>
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders with Info icon for info', () => {
      const { container } = render(
        <Alert variant="info">
          <Info />
          <AlertTitle>Info</AlertTitle>
        </Alert>
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('applies correct icon styling when icon is present', () => {
      const { container } = render(
        <Alert>
          <CheckCircle2 />
          <AlertTitle>With Icon</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]')
    })

    it('applies correct grid layout when icon is not present', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Without Icon</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('grid-cols-[0_1fr]')
    })
  })

  describe('Styling', () => {
    it('applies base classes to alert', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Test</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass(
        'relative',
        'w-full',
        'rounded-lg',
        'border',
        'px-4',
        'py-3',
        'text-sm',
        'grid'
      )
    })

    it('applies variant-specific text colors', () => {
      const { container: destructiveContainer } = render(
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
        </Alert>
      )

      const destructiveAlert = destructiveContainer.querySelector('[role="alert"]')
      expect(destructiveAlert).toHaveClass('text-destructive')

      const { container: successContainer } = render(
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
        </Alert>
      )

      const successAlert = successContainer.querySelector('[role="alert"]')
      expect(successAlert).toHaveClass('text-green-600')
    })

    it('applies variant-specific border colors', () => {
      const { container } = render(
        <Alert variant="warning">
          <AlertTitle>Warning</AlertTitle>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('border-yellow-500/50')
    })
  })

  describe('Component Structure', () => {
    it('has correct DOM structure with all elements', () => {
      const { container } = render(
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Title</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      const icon = alert?.querySelector('svg')
      const title = container.querySelector('[data-slot="alert-title"]')
      const description = container.querySelector('[data-slot="alert-description"]')

      expect(alert).toBeInTheDocument()
      expect(icon).toBeInTheDocument()
      expect(title).toBeInTheDocument()
      expect(description).toBeInTheDocument()
    })

    it('maintains correct grid layout with icon', () => {
      const { container } = render(
        <Alert>
          <Info />
          <AlertTitle>Title</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]')
    })

    it('maintains correct grid layout without icon', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('grid-cols-[0_1fr]')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty title', () => {
      const { container } = render(
        <Alert>
          <AlertTitle></AlertTitle>
        </Alert>
      )

      const title = container.querySelector('[data-slot="alert-title"]')
      expect(title).toBeInTheDocument()
    })

    it('handles empty description', () => {
      const { container } = render(
        <Alert>
          <AlertDescription></AlertDescription>
        </Alert>
      )

      const description = container.querySelector('[data-slot="alert-description"]')
      expect(description).toBeInTheDocument()
    })

    it('handles very long title text', () => {
      const longTitle = 'A'.repeat(200)
      render(
        <Alert>
          <AlertTitle>{longTitle}</AlertTitle>
        </Alert>
      )

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('handles very long description text', () => {
      const longDescription = 'B'.repeat(500)
      render(
        <Alert>
          <AlertDescription>{longDescription}</AlertDescription>
        </Alert>
      )

      expect(screen.getByText(longDescription)).toBeInTheDocument()
    })

    it('handles special characters in title', () => {
      render(
        <Alert>
          <AlertTitle>Alert with special chars: !@#$%^&*()</AlertTitle>
        </Alert>
      )

      expect(screen.getByText('Alert with special chars: !@#$%^&*()')).toBeInTheDocument()
    })

    it('handles HTML entities in description', () => {
      render(
        <Alert>
          <AlertDescription>&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;</AlertDescription>
        </Alert>
      )

      expect(screen.getByText(/script/)).toBeInTheDocument()
    })

    it('handles multiple alerts on the same page', () => {
      render(
        <>
          <Alert variant="success">
            <AlertTitle>First Alert</AlertTitle>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Second Alert</AlertTitle>
          </Alert>
        </>
      )

      expect(screen.getByText('First Alert')).toBeInTheDocument()
      expect(screen.getByText('Second Alert')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('works correctly with all variants and components together', () => {
      const variants: Array<'default' | 'destructive' | 'success' | 'warning' | 'info'> = [
        'default',
        'destructive',
        'success',
        'warning',
        'info',
      ]

      variants.forEach((variant) => {
        const { container } = render(
          <Alert variant={variant}>
            <AlertTitle>{variant} Title</AlertTitle>
            <AlertDescription>{variant} Description</AlertDescription>
          </Alert>
        )

        const alert = container.querySelector('[role="alert"]')
        expect(alert).toBeInTheDocument()
        expect(screen.getByText(`${variant} Title`)).toBeInTheDocument()
        expect(screen.getByText(`${variant} Description`)).toBeInTheDocument()
      })
    })

    it('maintains accessibility with complex content', () => {
      const { container } = render(
        <Alert variant="info">
          <Info />
          <AlertTitle>
            <strong>Important</strong> Alert
          </AlertTitle>
          <AlertDescription>
            <p>First paragraph</p>
            <p>Second paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </AlertDescription>
        </Alert>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveAttribute('role', 'alert')
      expect(screen.getByText('Important')).toBeInTheDocument()
      expect(screen.getByText('First paragraph')).toBeInTheDocument()
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })
  })
})

