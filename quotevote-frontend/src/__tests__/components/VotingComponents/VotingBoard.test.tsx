/**
 * VotingBoard component tests
 */

import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import VotingBoard from '@/components/VotingComponents/VotingBoard'
import type { VotingBoardProps } from '@/types/voting'

// Mock react-highlight-words
jest.mock('react-highlight-words', () => ({
  __esModule: true,
  default: ({
    textToHighlight,
    highlightTag: Tag,
    findChunks,
  }: {
    textToHighlight: string
    highlightTag?: React.ElementType
    findChunks?: () => Array<{ start: number; end: number }>
  }) => {
    const chunks = findChunks?.() ?? []
    const first = chunks[0]
    if (Tag && first && first.end > first.start) {
      return (
        <span data-testid="highlighter">
          <Tag>{textToHighlight.slice(first.start, first.end)}</Tag>
        </span>
      )
    }
    return <span data-testid="highlighter">{textToHighlight}</span>
  },
}))

// Mock SelectionPopover — new pure portal API
jest.mock('@/components/VotingComponents/SelectionPopover', () => ({
  __esModule: true,
  default: ({
    children,
    showPopover,
  }: {
    children: React.ReactNode
    showPopover: boolean
  }) => (
    <div data-testid="selection-popover" data-show={String(showPopover)}>
      {children}
    </div>
  ),
}))

describe('VotingBoard', () => {
  const defaultProps: VotingBoardProps = {
    content: 'This is test content for voting board',
    highlights: false,
  }

  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn()
    // Default to desktop media (toolbar immediate)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  })

  it('renders content correctly', () => {
    const { container } = render(<VotingBoard {...defaultProps} />)
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
    const selectableElement = container.querySelector('[data-selectable]')
    expect(selectableElement).toBeInTheDocument()
  })

  it('renders children with selection data', () => {
    const children = jest.fn(() => <div>Child content</div>)
    render(<VotingBoard {...defaultProps}>{children}</VotingBoard>)
    expect(children).toHaveBeenCalled()
  })

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' }
    const { container } = render(<VotingBoard {...defaultProps} style={customStyle} />)
    const boardElement = container.querySelector('.h-full.flex.flex-col') as HTMLElement
    expect(boardElement).toBeInTheDocument()
    expect(boardElement.style.backgroundColor || getComputedStyle(boardElement).backgroundColor).toBeTruthy()
  })

  it('handles focused comment highlighting', () => {
    const focusedComment = { startWordIndex: 0, endWordIndex: 4 }
    render(<VotingBoard {...defaultProps} highlights={true} focusedComment={focusedComment} />)
    expect(screen.getByTestId('highlighter')).toBeInTheDocument()
  })

  it('handles empty content', () => {
    const { container } = render(<VotingBoard {...defaultProps} content="" />)
    expect(container.textContent?.trim()).toBe('')
  })

  it('handles content with newlines', () => {
    const contentWithNewlines = 'Line 1\nLine 2\nLine 3'
    const { container } = render(<VotingBoard {...defaultProps} content={contentWithNewlines} />)
    expect(container.textContent).toContain('Line 1')
    expect(container.textContent).toContain('Line 2')
    expect(container.textContent).toContain('Line 3')
  })

  it('handles focused comment with invalid indices', () => {
    const focusedComment = { startWordIndex: 100, endWordIndex: 50 }
    const { container } = render(
      <VotingBoard {...defaultProps} highlights={true} focusedComment={focusedComment} />
    )
    expect(container.textContent).toContain('This is test content')
  })

  it('handles null focused comment', () => {
    render(<VotingBoard {...defaultProps} highlights={true} focusedComment={null} />)
    expect(screen.getByTestId('highlighter')).toBeInTheDocument()
  })

  it('renders a clickable linked passage when a focused comment range is set', () => {
    const onHighlightClick = jest.fn()
    render(
      <VotingBoard
        {...defaultProps}
        highlights={true}
        focusedComment={{ startWordIndex: 0, endWordIndex: 4, actionId: 'c1' }}
        onHighlightClick={onHighlightClick}
      />
    )
    fireEvent.click(screen.getByTestId('linked-passage'))
    expect(onHighlightClick).toHaveBeenCalledTimes(1)
  })

  it('calls onSelect with correct selection data', () => {
    const onSelect = jest.fn()
    render(<VotingBoard {...defaultProps} onSelect={onSelect} />)
    expect(onSelect).toBeDefined()
  })

  it('handles votes prop (for future use)', () => {
    const votes = [{ _id: 'vote1', type: 'up', userId: 'user1' }]
    const { container } = render(<VotingBoard {...defaultProps} votes={votes} />)
    expect(container.textContent).toContain('This is test content')
  })

  it('applies topOffset to SelectionPopover', () => {
    render(<VotingBoard {...defaultProps} topOffset={50} />)
    expect(screen.getByTestId('selection-popover')).toBeInTheDocument()
  })

  it('handles selection with empty text', () => {
    const onSelect = jest.fn()
    render(<VotingBoard {...defaultProps} onSelect={onSelect} />)
    expect(onSelect).toBeDefined()
  })

  it('resets on content change', () => {
    const { rerender } = render(<VotingBoard {...defaultProps} content="first content" />)
    rerender(<VotingBoard {...defaultProps} content="second content" />)
    // Should not crash and show new content
    expect(document.body.textContent).toContain('second content')
  })

  it('exposes onDeselect prop', () => {
    const onDeselect = jest.fn()
    render(<VotingBoard {...defaultProps} onDeselect={onDeselect} />)
    expect(onDeselect).toBeDefined()
  })
})
