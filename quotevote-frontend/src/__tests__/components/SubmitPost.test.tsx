/**
 * Tests for SubmitPost components
 */

import { render } from '@testing-library/react'
import { SubmitPostSkeleton } from '@/components/SubmitPost'

// Mock useResponsive hook
jest.mock('@/hooks/useResponsive', () => ({
  useResponsive: jest.fn(() => ({
    isMobile: false,
    isSmallScreen: false,
    isMediumScreen: false,
    isLargeScreen: true,
  })),
}))

describe('SubmitPostSkeleton', () => {
  it('renders skeleton components', () => {
    render(<SubmitPostSkeleton />)
    
    // Check for skeleton elements
    const card = document.querySelector('[data-slot="card"]')
    expect(card).toBeInTheDocument()
  })
})

