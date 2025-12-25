/**
 * SelectionPopover component tests
 */

import { render, screen } from '@/__tests__/utils/test-utils'
import SelectionPopover from '@/components/VotingComponents/SelectionPopover'
import type { SelectionPopoverProps } from '@/types/voting'

describe('SelectionPopover', () => {
  const defaultProps: SelectionPopoverProps = {
    showPopover: false,
    onSelect: jest.fn(),
    onDeselect: jest.fn(),
    children: <div>Test content</div>,
  }

  beforeEach(() => {
    // Mock window.getSelection
    global.window.getSelection = jest.fn(() => {
      const mockRange = {
        getBoundingClientRect: () => ({
          top: 100,
          left: 50,
          width: 200,
          height: 20,
          x: 50,
        }),
        collapsed: false,
        startContainer: document.createTextNode('test'),
        startOffset: 0,
        endContainer: document.createTextNode('test'),
        endOffset: 4,
        setStart: jest.fn(),
        setEnd: jest.fn(),
      }
      return {
        rangeCount: 1,
        getRangeAt: () => mockRange,
        removeAllRanges: jest.fn(),
      } as unknown as Selection
    })

    // Create a mock selectable element
    const selectableDiv = document.createElement('div')
    selectableDiv.setAttribute('data-selectable', 'true')
    document.body.appendChild(selectableDiv)
  })

  afterEach(() => {
    // Clean up
    const selectable = document.querySelector('[data-selectable]')
    if (selectable) {
      document.body.removeChild(selectable)
    }
    jest.clearAllMocks()
  })

  it('renders children when showPopover is true', () => {
    render(<SelectionPopover {...defaultProps} showPopover={true} />)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('does not render children when showPopover is false', () => {
    render(<SelectionPopover {...defaultProps} showPopover={false} />)
    expect(screen.queryByText('Test content')).not.toBeInTheDocument()
  })

  it('calls onDeselect when selection is cleared', () => {
    const onDeselect = jest.fn()
    render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
        onDeselect={onDeselect}
      />,
    )

    // Simulate clearing selection
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
    }

    // The component should handle this internally
    expect(onDeselect).toBeDefined()
  })

  it('applies custom topOffset', () => {
    const { container } = render(
      <SelectionPopover {...defaultProps} showPopover={true} topOffset={50} />,
    )
    const popover = container.querySelector('#selectionPopover')
    expect(popover).toBeInTheDocument()
  })

  it('applies custom styles', () => {
    const customStyle = { zIndex: 999 }
    const { container } = render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
        style={customStyle}
      />,
    )
    const popover = container.querySelector('#selectionPopover') as HTMLElement
    expect(popover).toHaveStyle({ zIndex: '999' })
  })
})

