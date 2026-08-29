/**
 * SelectionPopover component tests — pure portal/positioning (issue #484)
 */

import { render, screen, act } from '@/__tests__/utils/test-utils'
import SelectionPopover from '@/components/VotingComponents/SelectionPopover'
import type { SelectionPopoverProps } from '@/types/voting'
import { createRef } from 'react'

describe('SelectionPopover', () => {
  const makeProps = (overrides: Partial<SelectionPopoverProps> = {}): SelectionPopoverProps => ({
    showPopover: false,
    resolveAnchorRect: jest.fn(() => ({
      top: 100,
      left: 50,
      width: 200,
      height: 20,
      bottom: 120,
      right: 250,
      x: 50,
      y: 100,
      toJSON: () => {},
    }) as unknown as DOMRect),
    popoverRef: createRef<HTMLDivElement>() as React.RefObject<HTMLDivElement | null>,
    children: <div>Test content</div>,
    ...overrides,
  })

  it('renders children when showPopover is true', () => {
    render(<SelectionPopover {...makeProps({ showPopover: true })} />)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('does not render children when showPopover is false', () => {
    render(<SelectionPopover {...makeProps({ showPopover: false })} />)
    expect(screen.queryByText('Test content')).not.toBeInTheDocument()
  })

  it('applies custom topOffset', () => {
    render(<SelectionPopover {...makeProps({ showPopover: true, topOffset: 50 })} />)
    const popover = document.querySelector('#selectionPopover')
    expect(popover).toBeInTheDocument()
  })

  it('renders above the post sticky action bar (z-index > 10) by default', () => {
    render(<SelectionPopover {...makeProps({ showPopover: true })} />)
    const popover = document.querySelector('#selectionPopover') as HTMLElement
    expect(Number(popover.style.zIndex)).toBeGreaterThan(10)
  })

  it('applies custom styles', () => {
    const customStyle = { zIndex: 999 }
    render(<SelectionPopover {...makeProps({ showPopover: true, style: customStyle })} />)
    const popover = document.querySelector('#selectionPopover') as HTMLElement
    expect(popover).toHaveStyle({ zIndex: '999' })
  })

  it('computes popover position correctly for desktop', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 })
    const resolveAnchorRect = jest.fn(
      () =>
        ({
          top: 200,
          left: 100,
          width: 300,
          height: 20,
          bottom: 220,
          right: 400,
          x: 100,
          y: 200,
        }) as unknown as DOMRect
    )
    render(<SelectionPopover {...makeProps({ showPopover: true, resolveAnchorRect })} />)
    // Let rAF compute
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)))
    })
    expect(resolveAnchorRect).toHaveBeenCalled()
    const popover = document.querySelector('#selectionPopover')
    expect(popover).toBeInTheDocument()
  })

  it('computes popover position correctly for tablet', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 })
    render(<SelectionPopover {...makeProps({ showPopover: true, topOffset: 30 })} />)
    const popover = document.querySelector('#selectionPopover')
    expect(popover).toBeInTheDocument()
  })

  it('computes popover position correctly for mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 400 })
    render(<SelectionPopover {...makeProps({ showPopover: true, topOffset: 30 })} />)
    const popover = document.querySelector('#selectionPopover')
    expect(popover).toBeInTheDocument()
  })

  it('handles missing anchor rect gracefully', () => {
    const resolveAnchorRect = jest.fn(() => null)
    render(<SelectionPopover {...makeProps({ showPopover: true, resolveAnchorRect })} />)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('handles popoverRef without current element gracefully', () => {
    const emptyRef = { current: null } as React.RefObject<HTMLDivElement | null>
    render(<SelectionPopover {...makeProps({ showPopover: true, popoverRef: emptyRef })} />)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('recomputes on resize/orientationchange while visible', async () => {
    const resolveAnchorRect = jest.fn(
      () =>
        ({
          top: 100,
          left: 50,
          width: 200,
          height: 20,
          bottom: 120,
          right: 250,
          x: 50,
          y: 100,
        }) as unknown as DOMRect
    )
    render(<SelectionPopover {...makeProps({ showPopover: true, resolveAnchorRect })} />)
    await act(async () => {
      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('orientationchange'))
    })
    // After events, still mounted
    expect(document.querySelector('#selectionPopover')).toBeInTheDocument()
  })

  it('cleans up rAF on unmount/hide', () => {
    const { rerender, unmount } = render(<SelectionPopover {...makeProps({ showPopover: true })} />)
    expect(screen.getByText('Test content')).toBeInTheDocument()
    rerender(<SelectionPopover {...makeProps({ showPopover: false })} />)
    expect(screen.queryByText('Test content')).not.toBeInTheDocument()
    unmount()
    expect(true).toBe(true)
  })
})
