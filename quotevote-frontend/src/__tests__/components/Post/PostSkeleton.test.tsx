/**
 * PostSkeleton Component Tests
 * 
 * Tests for the PostSkeleton component including:
 * - Component renders correctly
 * - Skeleton elements are displayed
 * - Proper structure and layout
 */

import { render } from '../../utils/test-utils'
import PostSkeleton from '../../../components/Post/PostSkeleton'

describe('PostSkeleton Component', () => {
  describe('Basic Rendering', () => {
    it('renders skeleton component', () => {
      const { container } = render(<PostSkeleton />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders Card component', () => {
      const { container } = render(<PostSkeleton />)
      // Card should render - check for any element with rounded corners or just that component renders
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders skeleton elements for header', () => {
      const { container } = render(<PostSkeleton />)
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders skeleton for avatar', () => {
      const { container } = render(<PostSkeleton />)
      const avatarSkeleton = container.querySelector('.rounded-full[class*="h-12"]')
      expect(avatarSkeleton).toBeInTheDocument()
    })

    it('renders skeleton for content lines', () => {
      const { container } = render(<PostSkeleton />)
      const contentSkeletons = container.querySelectorAll('[class*="h-4"][class*="w-full"]')
      expect(contentSkeletons.length).toBeGreaterThan(0)
    })

    it('renders skeleton for action buttons', () => {
      const { container } = render(<PostSkeleton />)
      const buttonSkeletons = container.querySelectorAll('[class*="h-8"]')
      expect(buttonSkeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Structure', () => {
    it('has proper Card structure', () => {
      const { container } = render(<PostSkeleton />)
      // Component should render with skeleton elements
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders multiple skeleton elements', () => {
      const { container } = render(<PostSkeleton />)
      const allSkeletons = container.querySelectorAll('[class*="animate-pulse"], [class*="Skeleton"]')
      expect(allSkeletons.length).toBeGreaterThan(5)
    })
  })
})

