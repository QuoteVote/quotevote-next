/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityEmptyList } from '@/components/Activity/ActivityEmptyList'
import { useAppStore } from '@/store'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock the store
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

describe('ActivityEmptyList', () => {
  const mockSetSelectedPage = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAppStore as unknown as jest.Mock).mockImplementation((selector: (state: { setSelectedPage: jest.Mock }) => unknown) => {
      if (selector) {
        return selector({ setSelectedPage: mockSetSelectedPage } as { setSelectedPage: jest.Mock })
      }
      return { setSelectedPage: mockSetSelectedPage }
    })
  })

  it('renders empty list message', () => {
    render(<ActivityEmptyList />)

    expect(
      screen.getByText(/Welcome to Quote Vote/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/FIND FRIENDS/i)).toBeInTheDocument()
    expect(screen.getByText(/GO TO SEARCH/i)).toBeInTheDocument()
  })

  it('renders image with correct alt text', () => {
    render(<ActivityEmptyList />)

    const image = screen.getByAltText('Add Buddy / Find Posts')
    expect(image).toBeInTheDocument()
  })

  it('navigates to search page when GO TO SEARCH is clicked', async () => {
    const user = userEvent.setup()
    render(<ActivityEmptyList />)

    const searchButton = screen.getByText(/GO TO SEARCH/i)
    await user.click(searchButton)

    expect(mockSetSelectedPage).toHaveBeenCalledWith('1')
    expect(mockPush).toHaveBeenCalledWith('/search')
  })
})

