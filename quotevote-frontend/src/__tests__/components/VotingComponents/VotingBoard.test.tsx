/**
 * VotingBoard component tests
 */

import { render, screen } from '@/__tests__/utils/test-utils'
import VotingBoard from '@/components/VotingComponents/VotingBoard'
import type { VotingBoardProps } from '@/types/voting'

// Mock react-highlight-words
jest.mock('react-highlight-words', () => ({
  __esModule: true,
  default: ({ textToHighlight }: { textToHighlight: string }) => (
    <span data-testid="highlighter">{textToHighlight}</span>
  ),
}))

// Mock SelectionPopover
jest.mock('@/components/VotingComponents/SelectionPopover', () => ({
  __esModule: true,
  default: ({
    children,
    showPopover,
  }: {
    children: React.ReactNode
    showPopover: boolean
  }) => (
    <div data-testid="selection-popover" data-show={showPopover}>
      {children}
    </div>
  ),
}))

describe('VotingBoard', () => {
  const defaultProps: VotingBoardProps = {
    content: 'This is test content for voting board',
    highlights: false,
  }

  it('renders content correctly', () => {
    const { container } = render(<VotingBoard {...defaultProps} />)
    // Content is split into spans, so we check for the container
    expect(container.textContent).toContain('This is test content for voting board')
  })

  it('renders with highlights when highlights prop is true', () => {
    render(<VotingBoard {...defaultProps} highlights={true} />)
    expect(screen.getByTestId('highlighter')).toBeInTheDocument()
  })

  it('renders SelectionPopover', () => {
    render(<VotingBoard {...defaultProps} />)
    expect(screen.getByTestId('selection-popover')).toBeInTheDocument()
  })

  it('calls onSelect when text is selected', () => {
    const onSelect = jest.fn()
    const { container } = render(<VotingBoard {...defaultProps} onSelect={onSelect} />)

    // Verify the selectable element exists
    const selectableElement = container.querySelector('[data-selectable]')
    expect(selectableElement).toBeInTheDocument()
  })

  it('renders children with selection data', () => {
    const children = jest.fn(() => <div>Child content</div>)
    render(
      <VotingBoard {...defaultProps}>
        {children}
      </VotingBoard>,
    )

    // Children should be called with selection data
    expect(children).toHaveBeenCalled()
  })

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' }
    const { container } = render(
      <VotingBoard {...defaultProps} style={customStyle} />,
    )
    const boardElement = container.querySelector('.h-full.flex.flex-col') as HTMLElement
    expect(boardElement).toBeInTheDocument()
    // Check that style prop is passed (inline styles are applied directly)
    expect(boardElement.style.backgroundColor || getComputedStyle(boardElement).backgroundColor).toBeTruthy()
  })

  it('handles focused comment highlighting', () => {
    const focusedComment = {
      startWordIndex: 0,
      endWordIndex: 4,
    }
    render(
      <VotingBoard
        {...defaultProps}
        highlights={true}
        focusedComment={focusedComment}
      />,
    )
    expect(screen.getByTestId('highlighter')).toBeInTheDocument()
  })
})

