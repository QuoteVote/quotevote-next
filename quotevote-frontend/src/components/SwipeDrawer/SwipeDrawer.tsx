'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SwipeDrawerProps {
  children: React.ReactNode
  title?: string
  /** Height when collapsed (just the handle + title bar) */
  peekHeight?: number
  /** Max height as percentage of viewport */
  maxHeightVh?: number
}

/**
 * A mobile-friendly bottom drawer with swipe gesture support.
 * Swipe up to expand, swipe down to collapse.
 */
export default function SwipeDrawer({
  children,
  title = 'Discussion',
  peekHeight = 56,
  maxHeightVh = 75,
}: SwipeDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const expandedHeight = typeof window !== 'undefined'
    ? window.innerHeight * (maxHeightVh / 100)
    : 500

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    startY.current = touch.clientY
    currentY.current = touch.clientY
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    currentY.current = touch.clientY
    const diff = startY.current - currentY.current

    if (isOpen) {
      // When open, only allow dragging down (negative diff)
      setDragOffset(Math.min(0, diff))
    } else {
      // When closed, only allow dragging up (positive diff)
      setDragOffset(Math.max(0, diff))
    }
  }, [isDragging, isOpen])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    const diff = startY.current - currentY.current
    const threshold = 50

    if (isOpen) {
      // If dragged down enough, close
      if (diff < -threshold) {
        setIsOpen(false)
      }
    } else {
      // If dragged up enough, open
      if (diff > threshold) {
        setIsOpen(true)
      }
    }
    setDragOffset(0)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  const drawerHeight = isOpen
    ? expandedHeight + (isDragging ? dragOffset : 0)
    : peekHeight + (isDragging ? dragOffset : 0)

  return (
    <div
      ref={drawerRef}
      className={cn(
        'fixed bottom-14 left-0 right-0 z-30 bg-card border-t border-border rounded-t-2xl shadow-lg',
        !isDragging && 'transition-all duration-300 ease-out'
      )}
      style={{ height: Math.max(peekHeight, Math.min(drawerHeight, expandedHeight)) }}
      role="region"
      aria-label={title}
    >
      {/* Swipe handle */}
      <div
        className="flex flex-col items-center cursor-grab active:cursor-grabbing touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen) } }}
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Collapse discussion' : 'Expand discussion'}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mt-2 mb-1" />
        <div className="flex items-center justify-between w-full px-4 py-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <svg
            className={cn(
              'size-4 text-muted-foreground transition-transform duration-300',
              isOpen && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </div>

      {/* Drawer content */}
      <div
        className={cn(
          'overflow-y-auto overscroll-contain',
          !isOpen && 'hidden'
        )}
        style={{ height: `calc(100% - ${peekHeight}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
