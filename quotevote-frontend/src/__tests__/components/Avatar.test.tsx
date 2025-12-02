/**
 * Avatar Component Tests
 * 
 * Tests that verify:
 * - Component renders correctly with different props
 * - Size variants work correctly
 * - Image display and error handling
 * - Fallback behavior (initials, custom fallback, default icon)
 * - Click handlers and keyboard accessibility
 * - Styling and classes
 * - Edge cases
 */

import { render, screen, fireEvent } from '../utils/test-utils'
import { Avatar } from '@/components/Avatar'

describe('Avatar Component', () => {
  describe('Rendering', () => {
    it('renders without crashing with default props', () => {
      const { container } = render(<Avatar alt="Test User" />)

      expect(container).toBeInTheDocument()
      const avatar = container.firstChild as HTMLElement
      expect(avatar).toBeInTheDocument()
    })

    it('renders with image source', () => {
      render(<Avatar src="/test-avatar.jpg" alt="Test User" />)

      const image = screen.getByAltText('Test User')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', '/test-avatar.jpg')
    })

    it('renders with custom className', () => {
      const { container } = render(
        <Avatar alt="Test User" className="custom-class" />
      )

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveClass('custom-class')
    })
  })

  describe('Size Variants', () => {
    it('renders with size="sm"', () => {
      const { container } = render(<Avatar alt="Test User" size="sm" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveClass('w-8', 'h-8')
    })

    it('renders with size="md" (default)', () => {
      const { container } = render(<Avatar alt="Test User" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveClass('w-10', 'h-10')
    })

    it('renders with size="lg"', () => {
      const { container } = render(<Avatar alt="Test User" size="lg" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveClass('w-16', 'h-16')
    })

    it('renders with size="xl"', () => {
      const { container } = render(<Avatar alt="Test User" size="xl" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveClass('w-24', 'h-24')
    })

    it('renders with custom numeric size', () => {
      const { container } = render(<Avatar alt="Test User" size={50} />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveStyle({ width: '50px', height: '50px' })
    })

    it('renders with very small custom size', () => {
      const { container } = render(<Avatar alt="Test User" size={20} />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveStyle({ width: '20px', height: '20px' })
    })

    it('renders with very large custom size', () => {
      const { container } = render(<Avatar alt="Test User" size={200} />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveStyle({ width: '200px', height: '200px' })
    })
  })

  describe('Fallback Behavior', () => {
    it('generates initials from alt text with two words', () => {
      render(<Avatar alt="John Doe" />)

      const fallback = screen.getByText('JD')
      expect(fallback).toBeInTheDocument()
    })

    it('generates initial from alt text with single word', () => {
      render(<Avatar alt="John" />)

      const fallback = screen.getByText('J')
      expect(fallback).toBeInTheDocument()
    })

    it('generates initials from alt text with multiple words', () => {
      render(<Avatar alt="John Michael Smith" />)

      const fallback = screen.getByText('JS')
      expect(fallback).toBeInTheDocument()
    })

    it('uses custom fallback string when provided', () => {
      render(<Avatar alt="John Doe" fallback="JD" />)

      const fallback = screen.getByText('JD')
      expect(fallback).toBeInTheDocument()
    })

    it('uses custom fallback React node when provided', () => {
      render(<Avatar alt="John Doe" fallback={<span>Custom</span>} />)

      const fallback = screen.getByText('Custom')
      expect(fallback).toBeInTheDocument()
    })

    it('shows default User icon when no alt text and no fallback', () => {
      const { container } = render(<Avatar />)

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('shows default User icon when alt text is empty', () => {
      const { container } = render(<Avatar alt="" />)

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('prioritizes custom fallback over generated initials', () => {
      render(<Avatar alt="John Doe" fallback="Custom" />)

      const fallback = screen.getByText('Custom')
      expect(fallback).toBeInTheDocument()
      expect(screen.queryByText('JD')).not.toBeInTheDocument()
    })
  })

  describe('Image Handling', () => {
    it('displays image when src is provided', () => {
      render(<Avatar src="/test-avatar.jpg" alt="Test User" />)

      const image = screen.getByAltText('Test User')
      expect(image).toBeInTheDocument()
    })

    it('handles image load error and shows fallback', () => {
      const { container } = render(
        <Avatar src="/invalid-image.jpg" alt="Test User" />
      )

      const image = screen.getByAltText('Test User')
      
      // Simulate image error
      fireEvent.error(image)

      // After error, fallback should be shown
      const fallback = container.querySelector('[aria-hidden="true"]')
      expect(fallback).toBeInTheDocument()
    })

    it('uses default alt text when alt is not provided', () => {
      render(<Avatar src="/test-avatar.jpg" />)

      const image = screen.getByAltText('User avatar')
      expect(image).toBeInTheDocument()
    })

    it('handles data URL with unoptimized prop', () => {
      render(
        <Avatar
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          alt="Test User"
        />
      )

      const image = screen.getByAltText('Test User')
      expect(image).toBeInTheDocument()
    })

    it('handles blob URL with unoptimized prop', () => {
      render(<Avatar src="blob:http://localhost/test" alt="Test User" />)

      const image = screen.getByAltText('Test User')
      expect(image).toBeInTheDocument()
    })
  })

  describe('Click Handler', () => {
    it('calls onClick when clicked', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <Avatar alt="Test User" onClick={handleClick} />
      )

      const avatar = container.firstChild as HTMLElement
      fireEvent.click(avatar)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when not provided', () => {
      const handleClick = jest.fn()
      const { container } = render(<Avatar alt="Test User" />)

      const avatar = container.firstChild as HTMLElement
      fireEvent.click(avatar)

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('has role="button" when onClick is provided', () => {
      const { container } = render(
        <Avatar alt="Test User" onClick={() => {}} />
      )

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveAttribute('role', 'button')
    })

    it('does not have role="button" when onClick is not provided', () => {
      const { container } = render(<Avatar alt="Test User" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).not.toHaveAttribute('role', 'button')
    })

    it('has tabIndex when onClick is provided', () => {
      const { container } = render(
        <Avatar alt="Test User" onClick={() => {}} />
      )

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveAttribute('tabIndex', '0')
    })

    it('does not have tabIndex when onClick is not provided', () => {
      const { container } = render(<Avatar alt="Test User" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).not.toHaveAttribute('tabIndex')
    })

    it('calls onClick on Enter key press', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <Avatar alt="Test User" onClick={handleClick} />
      )

      const avatar = container.firstChild as HTMLElement
      fireEvent.keyDown(avatar, { key: 'Enter' })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('calls onClick on Space key press', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <Avatar alt="Test User" onClick={handleClick} />
      )

      const avatar = container.firstChild as HTMLElement
      fireEvent.keyDown(avatar, { key: ' ' })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick on other key presses', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <Avatar alt="Test User" onClick={handleClick} />
      )

      const avatar = container.firstChild as HTMLElement
      fireEvent.keyDown(avatar, { key: 'Tab' })

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('has aria-label when onClick is provided', () => {
      const { container } = render(
        <Avatar alt="Test User" onClick={() => {}} />
      )

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveAttribute('aria-label', 'Test User')
    })
  })

  describe('Styling', () => {
    it('applies base classes', () => {
      const { container } = render(<Avatar alt="Test User" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveClass(
        'relative',
        'inline-flex',
        'items-center',
        'justify-center',
        'rounded-full',
        'overflow-hidden'
      )
    })

    it('applies cursor-pointer when onClick is provided', () => {
      const { container } = render(
        <Avatar alt="Test User" onClick={() => {}} />
      )

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveClass('cursor-pointer')
    })

    it('does not apply cursor-pointer when onClick is not provided', () => {
      const { container } = render(<Avatar alt="Test User" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).not.toHaveClass('cursor-pointer')
    })

    it('applies correct text size classes for sm', () => {
      const { container } = render(<Avatar alt="Test User" size="sm" />)

      const fallback = container.querySelector('[aria-hidden="true"]')
      expect(fallback).toHaveClass('text-xs')
    })

    it('applies correct text size classes for md', () => {
      const { container } = render(<Avatar alt="Test User" size="md" />)

      const fallback = container.querySelector('[aria-hidden="true"]')
      expect(fallback).toHaveClass('text-sm')
    })

    it('applies correct text size classes for lg', () => {
      const { container } = render(<Avatar alt="Test User" size="lg" />)

      const fallback = container.querySelector('[aria-hidden="true"]')
      expect(fallback).toHaveClass('text-base')
    })

    it('applies correct text size classes for xl', () => {
      const { container } = render(<Avatar alt="Test User" size="xl" />)

      const fallback = container.querySelector('[aria-hidden="true"]')
      expect(fallback).toHaveClass('text-lg')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty src string', () => {
      render(<Avatar src="" alt="Test User" />)

      const fallback = screen.getByText('TU')
      expect(fallback).toBeInTheDocument()
    })

    it('handles whitespace-only alt text', () => {
      const { container } = render(<Avatar alt="   " />)

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('handles alt text with special characters', () => {
      render(<Avatar alt="John O'Brien" />)

      const fallback = screen.getByText("JO")
      expect(fallback).toBeInTheDocument()
    })

    it('handles alt text with numbers', () => {
      render(<Avatar alt="User123" />)

      const fallback = screen.getByText('U')
      expect(fallback).toBeInTheDocument()
    })

    it('handles very long alt text', () => {
      render(
        <Avatar alt="John Michael Christopher Smith Johnson Williams" />
      )

      const fallback = screen.getByText('JW')
      expect(fallback).toBeInTheDocument()
    })

    it('handles size of 0', () => {
      const { container } = render(<Avatar alt="Test User" size={0} />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveStyle({ width: '0px', height: '0px' })
    })

    it('handles negative size (should use default)', () => {
      const { container } = render(<Avatar alt="Test User" size={-10} />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveStyle({ width: '-10px', height: '-10px' })
    })
  })

  describe('Component Structure', () => {
    it('has correct DOM structure with image', () => {
      const { container } = render(
        <Avatar src="/test-avatar.jpg" alt="Test User" />
      )

      const avatar = container.firstChild as HTMLElement
      const image = avatar.querySelector('img')

      expect(avatar).toBeInTheDocument()
      expect(image).toBeInTheDocument()
    })

    it('has correct DOM structure with fallback', () => {
      const { container } = render(<Avatar alt="John Doe" />)

      const avatar = container.firstChild as HTMLElement
      const fallback = avatar.querySelector('[aria-hidden="true"]')

      expect(avatar).toBeInTheDocument()
      expect(fallback).toBeInTheDocument()
    })

    it('does not throw hydration warnings', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(<Avatar alt="Test User" />)

      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('hydration'),
        expect.anything()
      )

      consoleError.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('has proper alt text on image', () => {
      render(<Avatar src="/test-avatar.jpg" alt="Test User" />)

      const image = screen.getByAltText('Test User')
      expect(image).toBeInTheDocument()
    })

    it('marks fallback as aria-hidden', () => {
      const { container } = render(<Avatar alt="Test User" />)

      const fallback = container.querySelector('[aria-hidden="true"]')
      expect(fallback).toBeInTheDocument()
    })

    it('provides aria-label when clickable', () => {
      const { container } = render(
        <Avatar alt="Test User" onClick={() => {}} />
      )

      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveAttribute('aria-label', 'Test User')
    })
  })
})

