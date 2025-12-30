/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import { Activity } from '@/components/Activity'
import { ApolloProviderWrapper } from '@/lib/apollo/apollo-provider'
import { useAppStore } from '@/store'

// Mock the store
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

// Mock SubHeader
jest.mock('@/components/SubHeader', () => ({
  SubHeader: ({ headerName }: { headerName: string }) => (
    <div data-testid="subheader">{headerName}</div>
  ),
}))

// Mock PaginatedActivityList
jest.mock('@/components/Activity/PaginatedActivityList', () => ({
  PaginatedActivityList: ({ userId }: { userId?: string }) => (
    <div data-testid="paginated-activity-list">
      {userId ? `User ID: ${userId}` : 'All Activities'}
    </div>
  ),
}))

// Mock ErrorBoundary
jest.mock('@/components/ErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('Activity', () => {
  const mockSetFilterValue = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAppStore as unknown as jest.Mock).mockImplementation((selector) => {
      const mockState = {
        setFilterValue: mockSetFilterValue,
      }
      return selector ? selector(mockState) : mockState
    })
  })

  it('renders with default props', () => {
    render(
      <ApolloProviderWrapper>
        <Activity />
      </ApolloProviderWrapper>
    )

    expect(screen.getByTestId('subheader')).toBeInTheDocument()
    expect(screen.getByTestId('paginated-activity-list')).toBeInTheDocument()
  })

  it('renders with showSubHeader false', () => {
    render(
      <ApolloProviderWrapper>
        <Activity showSubHeader={false} />
      </ApolloProviderWrapper>
    )

    expect(screen.queryByTestId('subheader')).not.toBeInTheDocument()
    expect(screen.getByTestId('paginated-activity-list')).toBeInTheDocument()
  })

  it('renders with userId prop', () => {
    render(
      <ApolloProviderWrapper>
        <Activity userId="test-user-id" />
      </ApolloProviderWrapper>
    )

    expect(screen.getByText('User ID: test-user-id')).toBeInTheDocument()
  })

  it('scrolls to top on mount', () => {
    const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {})
    
    render(
      <ApolloProviderWrapper>
        <Activity />
      </ApolloProviderWrapper>
    )

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0)
    
    scrollToSpy.mockRestore()
  })
})

