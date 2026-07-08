'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { SelectionPopoverProps } from '@/types/voting'

/**
 * SelectionPopover component
 * Handles text selection and displays a popover at the selection position
 */
export default function SelectionPopover({
  showPopover,
  topOffset = 30,
  onSelect,
  onDeselect,
  style,
  children,
}: SelectionPopoverProps) {
  const [mounted, setMounted] = useState(false)
  const [popoverBox, setPopoverBox] = useState({
    top: 0,
    left: 0,
  })
  const popoverRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const selectionExists = useCallback(() => {
    const selection = window.getSelection()
    return (
      selection &&
      selection.rangeCount > 0 &&
      selection.getRangeAt(0) &&
      !selection.getRangeAt(0).collapsed &&
      selection.getRangeAt(0).getBoundingClientRect().width > 0 &&
      selection.getRangeAt(0).getBoundingClientRect().height > 0
    )
  }, [])

  const clearSelection = useCallback(() => {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges()
    } else if (
      (document as unknown as { selection?: { empty: () => void } }).selection
    ) {
      ;(document as unknown as { selection: { empty: () => void } }).selection?.empty()
    }
  }, [])

  const computePopoverBox = useCallback(() => {
    const selection = window.getSelection()
    if (!selectionExists() || !selection || selection.rangeCount === 0) {
      return
    }
    const selectionBox = selection.getRangeAt(0).getBoundingClientRect()
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
  }, [topOffset, selectionExists])

  const selectionChange = useCallback(() => {
    const selection = window.getSelection()
    if (selectionExists() && selection) {
      onSelect(selection)
      computePopoverBox()
      return
    }
    onDeselect()
  }, [onSelect, onDeselect, selectionExists, computePopoverBox])

  const handleRemoveInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const handleMobileSelection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {
      selectionChange()
    }, 100)
  }, [selectionChange])

  useEffect(() => {
    if (showPopover === false) {
      clearSelection()
    }
  }, [showPopover, clearSelection])

  useEffect(() => {
    const target = document.querySelector('[data-selectable]')
    if (target) {
      target.addEventListener('selectstart', handleMobileSelection)
      target.addEventListener('pointerup', handleRemoveInterval)
      target.addEventListener('pointermove', selectionChange)

      return () => {
        target.removeEventListener('selectstart', handleMobileSelection)
        target.removeEventListener('pointerup', handleRemoveInterval)
        target.removeEventListener('pointermove', selectionChange)
      }
    }
    return undefined
  }, [handleMobileSelection, handleRemoveInterval, selectionChange])

  useEffect(() => {
    if (showPopover) {
      // Run on next frames to handle potential layout adjustments and avoid cascading renders lint rule
      const rafId1 = requestAnimationFrame(computePopoverBox)
      const rafId2 = requestAnimationFrame(() => requestAnimationFrame(computePopoverBox))

      window.addEventListener('resize', computePopoverBox)
      window.addEventListener('scroll', computePopoverBox, { passive: true })

      return () => {
        cancelAnimationFrame(rafId1)
        cancelAnimationFrame(rafId2)
        window.removeEventListener('resize', computePopoverBox)
        window.removeEventListener('scroll', computePopoverBox)
      }
    }
    return undefined
  }, [showPopover, computePopoverBox])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

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
        // Must sit above the post's sticky action bar (Disagree/Support,
        // z-10 in Post.tsx) so the selection interaction isn't hidden behind it.
        zIndex: 50,
        ...style,
      }}
    >
      {showPopover && children}
    </div>,
    document.body
  )
}

