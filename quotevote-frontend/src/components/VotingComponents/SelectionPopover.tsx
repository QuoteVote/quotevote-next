'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { SelectionPopoverProps } from '@/types/voting'

/**
 * SelectionPopover — pure portal/positioning (issue #484).
 * No selection polling, no onSelect/onDeselect. Owner (VotingBoard) owns
 * selection state and provides `resolveAnchorRect` + `popoverRef`.
 * Preserves above/below placement, clamping, scroll handlers, z-index 50.
 */
export default function SelectionPopover({
  showPopover,
  topOffset = 30,
  resolveAnchorRect,
  popoverRef,
  style,
  children,
}: SelectionPopoverProps) {
  const [mounted, setMounted] = useState(false)
  const [popoverBox, setPopoverBox] = useState({
    top: 0,
    left: 0,
  })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const computePopoverBox = useCallback(() => {
    const selectionBox = resolveAnchorRect()
    if (!selectionBox) return
    const popoverElement = popoverRef.current
    if (!popoverElement) return

    const popoverBoxRect = popoverElement.getBoundingClientRect()
    const popoverWidth = popoverBoxRect.width || 285
    const popoverHeight = popoverBoxRect.height || 48

    // Clamp horizontally within viewport
    const margin = 10
    const viewportLeft = selectionBox.left + selectionBox.width / 2 - popoverWidth / 2
    const clampedViewportLeft = Math.max(
      margin,
      Math.min(window.innerWidth - popoverWidth - margin, viewportLeft)
    )
    const pageLeft = clampedViewportLeft + window.scrollX

    // Determine vertical position: top or bottom
    const spaceAtTop = selectionBox.top
    let pageTop: number
    if (spaceAtTop < popoverHeight + topOffset + 10) {
      // Position below the selection
      pageTop = selectionBox.bottom + window.scrollY + topOffset
    } else {
      // Position above the selection
      pageTop = selectionBox.top + window.scrollY - popoverHeight - topOffset
    }

    setPopoverBox({
      top: pageTop,
      left: pageLeft,
    })
  }, [topOffset, resolveAnchorRect, popoverRef])

  useEffect(() => {
    if (showPopover) {
      const rafId1 = requestAnimationFrame(computePopoverBox)
      const rafId2 = requestAnimationFrame(() => requestAnimationFrame(computePopoverBox))

      window.addEventListener('resize', computePopoverBox)
      window.addEventListener('orientationchange', computePopoverBox)
      window.addEventListener('scroll', computePopoverBox, { passive: true })

      return () => {
        cancelAnimationFrame(rafId1)
        cancelAnimationFrame(rafId2)
        window.removeEventListener('resize', computePopoverBox)
        window.removeEventListener('orientationchange', computePopoverBox)
        window.removeEventListener('scroll', computePopoverBox)
      }
    }
    return undefined
  }, [showPopover, computePopoverBox])

  if (!mounted) return null

  const visibility = showPopover ? 'visible' : 'hidden'
  const display = showPopover ? 'inline-block' : 'none'

  return createPortal(
    <div
      id="selectionPopover"
      data-testid="highlight-popup"
      ref={popoverRef}
      style={{
        visibility,
        display,
        position: 'absolute',
        top: popoverBox.top,
        left: popoverBox.left,
        zIndex: 50,
        ...style,
      }}
    >
      {showPopover && children}
    </div>,
    document.body
  )
}
