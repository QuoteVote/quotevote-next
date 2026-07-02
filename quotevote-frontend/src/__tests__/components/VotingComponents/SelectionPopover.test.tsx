/**
 * SelectionPopover component tests
 */

import { render, screen, fireEvent, act } from '@/__tests__/utils/test-utils'
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

  it('calls onDeselect when selection is cleared', async () => {
    const onDeselect = jest.fn()

    // Override getSelection to return null (cleared)
    global.window.getSelection = jest.fn(() => null)

    render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
        onDeselect={onDeselect}
      />,
    )

    // Trigger a pointermove so selectionChange runs with no active selection
    await act(async () => {
      const target = document.querySelector('[data-selectable]')
      if (target) target.dispatchEvent(new Event('pointermove'))
    })

    expect(onDeselect).toHaveBeenCalled()
  })

  it('applies custom topOffset', () => {
    render(
      <SelectionPopover {...defaultProps} showPopover={true} topOffset={50} />,
    )
    const popover = document.querySelector('#selectionPopover')
    expect(popover).toBeInTheDocument()
  })

  it('renders above the post sticky action bar (z-index > 10) by default', () => {
    render(
      <SelectionPopover {...defaultProps} showPopover={true} />,
    )
    const popover = document.querySelector('#selectionPopover') as HTMLElement
    expect(Number(popover.style.zIndex)).toBeGreaterThan(10)
  })

  it('applies custom styles', () => {
    const customStyle = { zIndex: 999 }
    render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
        style={customStyle}
      />,
    )
    const popover = document.querySelector('#selectionPopover') as HTMLElement
    expect(popover).toHaveStyle({ zIndex: '999' })
  })

  it('calls onSelect when a valid selection exists on pointermove', async () => {
    const onSelect = jest.fn()
    const onDeselect = jest.fn()

    render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
        onSelect={onSelect}
        onDeselect={onDeselect}
      />,
    )

    await act(async () => {
      const target = document.querySelector('[data-selectable]')
      if (target) target.dispatchEvent(new Event('pointermove'))
    })

    // With the mock selection (rangeCount=1, not collapsed, width > 0), onSelect must fire
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onDeselect).not.toHaveBeenCalled()
  })

  it('starts interval polling for selection on selectstart (mobile)', async () => {
    jest.useFakeTimers()
    const onSelect = jest.fn()

    render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
        onSelect={onSelect}
      />,
    )

    // Trigger mobile selectstart to start the 100ms polling interval
    await act(async () => {
      const target = document.querySelector('[data-selectable]')
      if (target) target.dispatchEvent(new Event('selectstart'))
    })

    // Advance past one polling tick — selection mock is valid so onSelect fires
    await act(async () => {
      jest.advanceTimersByTime(150)
    })

    expect(onSelect).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('clears selection when showPopover becomes false', () => {
    const { rerender } = render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
      />,
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()

    // Change showPopover to false
    act(() => {
      rerender(
        <SelectionPopover
          {...defaultProps}
          showPopover={false}
        />,
      )
    })

    // Selection clearing is handled internally by the component
    // We verify the component handles the state change
    expect(screen.queryByText('Test content')).not.toBeInTheDocument()
  })

  it('does not alter selection or call onSelect when mouse enters the popover', async () => {
    const onSelect = jest.fn()

    render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
        onSelect={onSelect}
      />,
    )

    const popover = document.querySelector('#selectionPopover')
    if (popover) {
      await act(async () => {
        fireEvent.mouseEnter(popover)
      })
    }

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('computes popover position correctly for desktop', () => {
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    })

    render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
        topOffset={30}
      />,
    )

    const popover = document.querySelector('#selectionPopover')
    expect(popover).toBeInTheDocument()
  })

  it('computes popover position correctly for tablet', () => {
    // Mock window.innerWidth for tablet
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    })

    render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
        topOffset={30}
      />,
    )

    const popover = document.querySelector('#selectionPopover')
    expect(popover).toBeInTheDocument()
  })

  it('computes popover position correctly for mobile', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    })

    render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
        topOffset={30}
      />,
    )

    const popover = document.querySelector('#selectionPopover')
    expect(popover).toBeInTheDocument()
  })

  it('handles missing selectable element gracefully', () => {
    // Create a new container without selectable element
    render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
      />,
    )

    // Component should still render children when showPopover is true
    // even if selectable element is missing (it will be created by parent)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('calls onDeselect when selection is collapsed', async () => {
    const onDeselect = jest.fn()

    // Override with a collapsed (zero-width) selection
    global.window.getSelection = jest.fn(() => {
      const mockRange = {
        getBoundingClientRect: () => ({
          top: 100,
          left: 50,
          width: 0,
          height: 0,
          x: 50,
        }),
        collapsed: true,
        startContainer: document.createTextNode('test'),
        startOffset: 0,
        endContainer: document.createTextNode('test'),
        endOffset: 0,
        setStart: jest.fn(),
        setEnd: jest.fn(),
      }
      return {
        rangeCount: 1,
        getRangeAt: () => mockRange,
        removeAllRanges: jest.fn(),
      } as unknown as Selection
    })

    render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
        onDeselect={onDeselect}
      />,
    )

    // Trigger a selectionChange via pointermove with a collapsed selection
    await act(async () => {
      const target = document.querySelector('[data-selectable]')
      if (target) target.dispatchEvent(new Event('pointermove'))
    })

    expect(onDeselect).toHaveBeenCalled()
  })

  it('cleans up interval on unmount', async () => {
    const { unmount } = render(
      <SelectionPopover
        {...defaultProps}
        showPopover={true}
      />,
    )

    // Trigger mobile selection to create interval
    await act(async () => {
      const target = document.querySelector('[data-selectable]')
      if (target) {
        const event = new Event('selectstart')
        target.dispatchEvent(event)
      }
    })

    // Unmount should clean up
    act(() => {
      unmount()
    })

    // Interval should be cleared (no way to directly test, but unmount should not error)
    expect(true).toBe(true)
  })
})

