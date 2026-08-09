import { render, screen } from '@testing-library/react'
import ExplorePage from '@/app/(app)/page'

// Mock the ExploreContent client component
jest.mock('@/app/(app)/ExploreContent', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="explore-content">Explore Content</div>
  ),
}))

describe('ExplorePage', () => {
  it('should render ExploreContent', async () => {
    render(<ExplorePage />)
    const content = await screen.findByTestId('explore-content')
    expect(content).toBeInTheDocument()
  })
})
