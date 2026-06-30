'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SelectionPopoverProps } from '@/types/voting'

/**
 * SelectionPopover component
 * Handles text selection and displays a popover at the selection position
 */
export default function SelectionPopover({
  showPopover,
  topOffset: _topOffset = 30,
  onSelect,
  onDeselect,
  style,
  children,
}: SelectionPopoverProps) {
  const [popoverBox, setPopoverBox] = useState({
    top: 0,
    left: 0,
    right: 0,
  })
  const popoverRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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
    const halfWindowWidth = window.innerWidth / 2
    const targetElement = document.querySelector('[data-selectable]')
    if (!targetElement) return

    const targetBox = targetElement.getBoundingClientRect()

    const popupH = popoverBoxRect.height || 48
    const popupW = popoverBoxRect.width || 285

    if (window.innerWidth > 960) {
      // Desktop: popup above the selection, horizontally centred over it
      setPopoverBox({
        top: selectionBox.top - popupH - 8 - targetBox.top,
        left:
          selectionBox.left - targetBox.left +
          selectionBox.width / 2 -
          popupW / 2,
        right: 0,
      })
    } else if (
      window.innerWidth > 500 &&
      window.innerWidth <= 960 &&
      selectionBox.x > halfWindowWidth
    ) {
      // Tablet, right-side selection: popup below, right-aligned
      setPopoverBox({
        top: selectionBox.bottom - targetBox.top + 8,
        right: window.innerWidth - selectionBox.x + popupW,
        left: 0,
      })
    } else {
      // Mobile: popup below the selection, left-aligned
      setPopoverBox({
        top: selectionBox.bottom - targetBox.top + 8,
        left: 0,
        right: 0,
      })
    }
  }, [selectionExists])

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
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const visibility = showPopover ? 'visible' : 'hidden'
  const display = showPopover ? 'inline-block' : 'none'

  return (
    <div
      id="selectionPopover"
      ref={popoverRef}
      style={{
        visibility,
        display,
        position: 'absolute',
        top: popoverBox.top,
        left: popoverBox.left || undefined,
        right: popoverBox.right || undefined,
        // Must sit above the post's sticky action bar (Disagree/Support,
        // z-10 in Post.tsx) so the selection interaction isn't hidden behind it.
        zIndex: 50,
        ...style,
      }}
    >
      {showPopover && children}
    </div>
  )
}

