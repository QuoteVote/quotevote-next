'use client'

import { Fragment, useState, useCallback, useLayoutEffect, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import Highlighter from 'react-highlight-words'
import { parser } from '@/lib/utils/parser'
import { parseDomSelection } from '@/lib/utils/parserDom'
import { cn } from '@/lib/utils'
import { scrollLinkedPassageIntoView } from '@/lib/utils/discussionSplit'
import SelectionPopover from './SelectionPopover'
import type { VotingBoardProps, SelectedText, SelectionPhase } from '@/types/voting'

const LINKED_PASSAGE_CLASS =
  'bg-[#52b274]/20 text-foreground rounded-sm box-decoration-clone cursor-pointer px-0.5'

const RETAINED_PASSAGE_CLASS =
  'bg-[#52b274]/20 text-foreground rounded-sm box-decoration-clone px-0.5'

/**
 * Stable highlight tag so Highlighter does not remount on parent re-renders.
 * Clicks bubble to the passage container, which owns the reverse-nav handler.
 */
function LinkedPassageMark({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
  highlightIndex?: number
}) {
  return (
    <mark
      data-linked-passage="true"
      data-testid="linked-passage"
      className={cn(className, LINKED_PASSAGE_CLASS)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.currentTarget.click()
        }
      }}
    >
      {children}
    </mark>
  )
}

function RetainedPassageMark({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
  highlightIndex?: number
}) {
  return (
    <mark
      data-testid="retained-selection-highlight"
      className={cn(className, RETAINED_PASSAGE_CLASS)}
    >
      {children}
    </mark>
  )
}

function isCoarseTouchEnvironment(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches
}

function isDialogTarget(target: HTMLElement | null): boolean {
  if (!target) return false
  return !!target.closest('dialog[open], [role="dialog"], [role="alertdialog"]')
}

/**
 * VotingBoard — explicit selection state machine for issue #484.
 * Touch-first devices use delayed workflow; desktop opens immediately.
 */
export default function VotingBoard({
  topOffset,
  onSelect,
  onDeselect,
  highlights = false,
  content,
  children,
  votes = [],
  style,
  focusedComment,
  onHighlightClick,
}: VotingBoardProps) {
  void votes
  const [phase, setPhase] = useState<SelectionPhase>('idle')
  const phaseRef = useRef<SelectionPhase>('idle')
  const [selection, setSelection] = useState<SelectedText>({
    startIndex: 0,
    endIndex: 0,
    text: '',
    points: 0,
  })

  // Retained toolbar anchor: cached native rect for immediate positioning after flushSync
  const cachedRectRef = useRef<DOMRect | null>(null)
  const cachedSelectionRef = useRef<SelectedText | null>(null)
  const contentRef = useRef<HTMLParagraphElement>(null)
  const selectableRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Click suppression — mounted listener with pointerId + 750ms deadline (refinement 5)
  const suppressNextClickRef = useRef(false)
  const suppressPointerIdRef = useRef<number | null>(null)
  const suppressDeadlineRef = useRef<number>(0)
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setPhaseSynced = useCallback((next: SelectionPhase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const clearSuppress = useCallback(() => {
    suppressNextClickRef.current = false
    suppressPointerIdRef.current = null
    suppressDeadlineRef.current = 0
    if (suppressTimerRef.current) {
      clearTimeout(suppressTimerRef.current)
      suppressTimerRef.current = null
    }
  }, [])

  const armSuppress = useCallback(
    (pointerId: number | null) => {
      suppressNextClickRef.current = true
      suppressPointerIdRef.current = pointerId
      suppressDeadlineRef.current = Date.now() + 750
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
      suppressTimerRef.current = setTimeout(clearSuppress, 800)
    },
    [clearSuppress]
  )

  const clearNativeSelection = useCallback(() => {
    try {
      window.getSelection()?.removeAllRanges()
    } catch {
      // ignore
    }
  }, [])

  const resetToIdle = useCallback(() => {
    cachedRectRef.current = null
    cachedSelectionRef.current = null
    setSelection({ startIndex: 0, endIndex: 0, text: '', points: 0 })
    setPhaseSynced('idle')
    onDeselect?.()
  }, [onDeselect, setPhaseSynced])

  const commentData = focusedComment || null
  const startWordIndex = commentData?.startWordIndex ?? 0
  const endWordIndex = commentData?.endWordIndex ?? 0
  const highlightedText = content.substring(startWordIndex, endWordIndex).replace(/(\r\n|\n|\r)/gm, '')
  const hasLinkedRange = endWordIndex > startWordIndex
  const hasValidRetainedSelection =
    phase === 'toolbar' &&
    cachedSelectionRef.current != null &&
    cachedSelectionRef.current.endIndex > cachedSelectionRef.current.startIndex &&
    cachedSelectionRef.current.text.length > 0

  useLayoutEffect(() => {
    if (!hasLinkedRange) return
    // Retained highlight takes precedence while toolbar open; don't auto-scroll linked
    if (phase === 'toolbar' && hasValidRetainedSelection) return
    const frame = window.requestAnimationFrame(() => {
      scrollLinkedPassageIntoView()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [hasLinkedRange, commentData?.actionId, startWordIndex, endWordIndex, phase, hasValidRetainedSelection])

  // Content change / input-mode change / unmount resets
  useEffect(() => {
    resetToIdle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(hover: none) and (pointer: coarse)')
    const handler = () => {
      // Input-mode change resets state and removes stale listeners/timers
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      clearSuppress()
      cachedRectRef.current = null
      cachedSelectionRef.current = null
      setSelection({ startIndex: 0, endIndex: 0, text: '', points: 0 })
      setPhaseSynced('idle')
      onDeselect?.()
    }
    // Modern browsers
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    }
    // Safari fallback
    const legacy = mql as unknown as { addListener: (cb: () => void) => void; removeListener: (cb: () => void) => void }
    if (legacy.addListener) {
      legacy.addListener(handler)
      return () => legacy.removeListener(handler)
    }
    return undefined
  }, [clearSuppress, onDeselect, setPhaseSynced])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
    }
  }, [])

  const tryParseSelection = useCallback(
    (sel: Selection): { parsed: SelectedText; rect: DOMRect } | null => {
      const text = sel.toString()
      if (!text) return null
      if (sel.rangeCount === 0) return null
      const range = sel.getRangeAt(0)
      if (range.collapsed) return null
      const root = contentRef.current
      if (!root) return null
      if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null
      let rect: DOMRect
      try {
        rect = range.getBoundingClientRect()
      } catch {
        return null
      }
      if (rect.width <= 0 || rect.height <= 0) return null

      // DOM-aware parser for correct repeated-text handling; fallback to legacy parser for collapsed newline edge
      const domParsed = parseDomSelection({
        content,
        selectedText: text,
        range,
        contentRoot: root,
      })
      let parsed: SelectedText | null = null
      if (domParsed && typeof domParsed.startIndex === 'number' && typeof domParsed.endIndex === 'number') {
        // Validate slice matches normalized selection
        const slice = content.slice(domParsed.startIndex as number, domParsed.endIndex as number)
        const normSlice = slice.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        const normText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        if (normSlice === normText || slice === text) {
          parsed = {
            startIndex: domParsed.startIndex as number,
            endIndex: domParsed.endIndex as number,
            text: slice,
            points: (domParsed.endIndex as number) - (domParsed.startIndex as number),
          }
        }
      }
      if (!parsed) {
        // Don't use legacy indexOf as authoritative — reject if DOM parser couldn't defensibly match
        // But keep legacy as desktop fallback when DOM enumeration failed due to ephemeral rect
        const legacy = parser(content, text)
        if (!legacy || typeof legacy.startIndex !== 'number' || legacy.startIndex === -1) return null
        // Only accept legacy if it passes slice verification
        const legacySlice = content.slice(legacy.startIndex as number, legacy.endIndex as number)
        if (legacySlice !== text) return null
        parsed = {
          startIndex: legacy.startIndex as number,
          endIndex: legacy.endIndex as number,
          text,
          points: legacy.endIndex as number - (legacy.startIndex as number),
        }
      }
      if (parsed.startIndex < 0 || parsed.endIndex > content.length || parsed.endIndex <= parsed.startIndex) {
        return null
      }
      return { parsed, rect }
    },
    [content]
  )

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      // Refinement 2: collapsed with no cached passage → idle; with cached passage → ignore
      if (phaseRef.current === 'native' && cachedSelectionRef.current) return
      if (phaseRef.current === 'native' && !cachedSelectionRef.current) {
        resetToIdle()
      }
      return
    }
    const range = sel.getRangeAt(0)
    if (range.collapsed) {
      if (phaseRef.current === 'native' && cachedSelectionRef.current) return
      if (phaseRef.current === 'native' && !cachedSelectionRef.current) resetToIdle()
      return
    }
    const result = tryParseSelection(sel)
    if (!result) {
      if (phaseRef.current === 'native' && cachedSelectionRef.current) return
      return
    }
    const { parsed, rect } = result
    cachedSelectionRef.current = parsed
    cachedRectRef.current = rect
    setSelection(parsed)

    const delayed = isCoarseTouchEnvironment()
    if (delayed) {
      // Touch-first: store but keep toolbar hidden (native menu active)
      setPhaseSynced('native')
      // Don't call onSelect yet; toolbar not shown
    } else {
      // Desktop: open immediately
      setPhaseSynced('toolbar')
      onSelect?.(parsed)
    }
  }, [tryParseSelection, resetToIdle, setPhaseSynced, onSelect])

  // Selection ownership scoped to local selectable-content ref + polling fallback
  useEffect(() => {
    const target = selectableRef.current
    if (!target) return

    const onSelectStart = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        // Polling fallback for mobile handle drag; also observe selectionchange in native
        handleSelectionChange()
      }, 100)
    }
    const onPointerUp = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Let selection settle then refresh
      window.setTimeout(handleSelectionChange, 0)
    }

    target.addEventListener('selectstart', onSelectStart)
    target.addEventListener('pointerup', onPointerUp)
    // While in native, selectionchange from handle drag should refresh
    const onDocSelectionChange = () => {
      if (phaseRef.current === 'native') handleSelectionChange()
      else if (phaseRef.current === 'idle' && !isCoarseTouchEnvironment()) handleSelectionChange()
    }
    document.addEventListener('selectionchange', onDocSelectionChange)

    return () => {
      target.removeEventListener('selectstart', onSelectStart)
      target.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('selectionchange', onDocSelectionChange)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [handleSelectionChange])

  // Outside-tap handlers: only while native or toolbar active
  useEffect(() => {
    if (phase !== 'native' && phase !== 'toolbar') return

    const onPointerDownCapture = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      // Protect guest auth dialog
      if (isDialogTarget(target)) {
        // Clear stale toolbar but don't swallow dialog interaction
        if (phaseRef.current === 'toolbar' || phaseRef.current === 'native') {
          cachedRectRef.current = null
          cachedSelectionRef.current = null
          setSelection({ startIndex: 0, endIndex: 0, text: '', points: 0 })
          setPhaseSynced('idle')
          onDeselect?.()
        }
        return
      }
      // Inside popover — preserve
      if (popoverRef.current?.contains(target as Node)) return

      // Inside selectable content while native — refresh, don't transition
      if (phaseRef.current === 'native' && selectableRef.current?.contains(target as Node)) {
        // Allow native handles to move; will be handled by selectionchange
        return
      }

      if (phaseRef.current === 'native') {
        // First outside tap: native → toolbar
        // Refresh cached selection if still valid
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const refreshed = tryParseSelection(sel)
          if (refreshed) {
            cachedSelectionRef.current = refreshed.parsed
            cachedRectRef.current = refreshed.rect
            setSelection(refreshed.parsed)
          }
        }
        if (!cachedSelectionRef.current || !cachedRectRef.current) {
          resetToIdle()
          return
        }
        const rectToCache = cachedRectRef.current
        const parsedToCommit = cachedSelectionRef.current
        // Refinement 1 ordering: cache rect → phaseRef → flushSync render → clear native → position
        // Must run flushSync only from this pointerdown handler, not an effect
        flushSync(() => {
          phaseRef.current = 'toolbar'
          setPhase('toolbar')
          setSelection(parsedToCommit)
        })
        // Now retained <mark> exists; clear native
        clearNativeSelection()
        // Prime popover positioning from cached rect; recompute from retained mark on next frames handled by popover
        cachedRectRef.current = rectToCache
        onSelect?.(parsedToCommit)
        armSuppress(e.pointerId ?? null)
        e.preventDefault()
        e.stopPropagation()
        // Also suppress the compatibility click
        return
      }

      if (phaseRef.current === 'toolbar') {
        // Second outside tap: toolbar → idle
        // If tap inside content but not toolbar, dismiss
        armSuppress(e.pointerId ?? null)
        e.preventDefault()
        e.stopPropagation()
        // Clear after suppress armed so click suppression can fire
        window.setTimeout(() => resetToIdle(), 0)
      }
    }

    const onClickCapture = (e: MouseEvent) => {
      if (!suppressNextClickRef.current) return
      if (Date.now() > suppressDeadlineRef.current) {
        clearSuppress()
        return
      }
      const target = e.target as HTMLElement | null
      if (isDialogTarget(target)) {
        clearSuppress()
        return
      }
      // Only suppress if this click corresponds to the suppressed pointer
      // For mouse compatibility clicks pointerId is not available; suppress any outside click within deadline
      e.preventDefault()
      e.stopPropagation()
      if (typeof (e as unknown as { stopImmediatePropagation?: () => void }).stopImmediatePropagation === 'function') {
        ;(e as unknown as { stopImmediatePropagation: () => void }).stopImmediatePropagation!()
      }
      clearSuppress()
    }

    document.addEventListener('pointerdown', onPointerDownCapture, true)
    document.addEventListener('click', onClickCapture, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDownCapture, true)
      document.removeEventListener('click', onClickCapture, true)
    }
  }, [phase, tryParseSelection, clearNativeSelection, resetToIdle, setPhaseSynced, onSelect, onDeselect, armSuppress, clearSuppress])

  const findChunksAtBeginningOfWords = useCallback(
    () => [{ start: startWordIndex > 0 ? startWordIndex : 0, end: endWordIndex }],
    [startWordIndex, endWordIndex]
  )

  const findRetainedChunks = useCallback(() => {
    const s = cachedSelectionRef.current
    if (!s) return []
    return [{ start: s.startIndex, end: s.endIndex }]
  }, [])

  const disableContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation()
    }
  }, [])

  const handlePassageClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-linked-passage="true"]')) {
        e.preventDefault()
        onHighlightClick?.()
      }
    },
    [onHighlightClick],
  )

  const resolveAnchorRect = useCallback((): DOMRect | null => {
    // Mobile toolbar: prefer retained mark rect, fall back to cached native rect during transition frame
    if (phaseRef.current === 'toolbar') {
      const mark = document.querySelector('[data-testid="retained-selection-highlight"]') as HTMLElement | null
      if (mark) {
        const r = mark.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) return r
      }
      if (cachedRectRef.current) return cachedRectRef.current
      return null
    }
    // Desktop toolbar (immediate) or native measurement: live range
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      try {
        const r = sel.getRangeAt(0).getBoundingClientRect()
        if (r.width > 0 && r.height > 0) return r
      } catch {
        // ignore
      }
    }
    if (cachedRectRef.current) return cachedRectRef.current
    return null
  }, [])

  const showPopover = phase === 'toolbar' && hasValidRetainedSelection

  // Desktop immediate mode also uses toolbar phase; hasValidRetainedSelection may be false for desktop
  // because isCoarseTouchEnvironment() returns false → we set phase toolbar but hasValidRetainedSelection needs cache.
  // Unify: desktop should show popover whenever phase toolbar and selection has text.
  const isDesktopToolbar = phase === 'toolbar' && !isCoarseTouchEnvironment() && selection.text.length > 0
  const effectiveShowPopover = showPopover || isDesktopToolbar

  const renderHighlights = () => {
    if (effectiveShowPopover || (phase === 'toolbar' && hasValidRetainedSelection)) {
      // Refinement 4: explicit priority branch — retained takes precedence, no mutation of hasLinkedRange
      if (phase === 'toolbar' && hasValidRetainedSelection) {
        return (
          <Highlighter
            style={{ whiteSpace: 'pre-line' }}
            highlightClassName={RETAINED_PASSAGE_CLASS}
            highlightTag={RetainedPassageMark}
            textToHighlight={content}
            searchWords={[]}
            findChunks={findRetainedChunks}
            autoEscape
            onContextMenu={disableContextMenu}
          />
        )
      }
    }

    if (highlights) {
      if (hasLinkedRange && !(phase === 'toolbar' && hasValidRetainedSelection)) {
        return (
          <Highlighter
            style={{ whiteSpace: 'pre-line' }}
            highlightClassName={LINKED_PASSAGE_CLASS}
            highlightTag={LinkedPassageMark}
            textToHighlight={content}
            searchWords={[]}
            findChunks={findChunksAtBeginningOfWords}
            autoEscape
            onContextMenu={disableContextMenu}
          />
        )
      }

      // When not linked but highlights on, we still want retained to show if in toolbar; handled above
      if (phase === 'toolbar' && hasValidRetainedSelection) {
        return (
          <Highlighter
            style={{ whiteSpace: 'pre-line' }}
            highlightClassName={RETAINED_PASSAGE_CLASS}
            highlightTag={RetainedPassageMark}
            textToHighlight={content}
            searchWords={[]}
            findChunks={findRetainedChunks}
            autoEscape
            onContextMenu={disableContextMenu}
          />
        )
      }

      return (
        <Highlighter
          style={{ whiteSpace: 'pre-line' }}
          highlightClassName={LINKED_PASSAGE_CLASS}
          searchWords={[highlightedText]}
          textToHighlight={content}
          autoEscape
          caseSensitive
          onContextMenu={disableContextMenu}
        />
      )
    }

    // Non-highlight mode but toolbar active: still show retained mark
    if (phase === 'toolbar' && hasValidRetainedSelection) {
      return (
        <Highlighter
          style={{ whiteSpace: 'pre-line' }}
          highlightClassName={RETAINED_PASSAGE_CLASS}
          highlightTag={RetainedPassageMark}
          textToHighlight={content}
          searchWords={[]}
          findChunks={findRetainedChunks}
          autoEscape
          onContextMenu={disableContextMenu}
        />
      )
    }

    return content.split(/\n/g).map((line, contentIndex) => (
      <Fragment key={`frag-${contentIndex}`}>
        {line.split(/\s+/g).map((word, index) => (
          <span key={`${index}-${word}`}>{`${word} `}</span>
        ))}
        <br />
      </Fragment>
    ))
  }

  return (
    <div className="relative h-full flex flex-col" style={style}>
      <div ref={selectableRef} data-selectable className="flex-1">
        <p
          ref={contentRef}
          className="voting_board-content m-0 p-0 h-full"
          onContextMenu={disableContextMenu}
          onClick={handlePassageClick}
        >
          {renderHighlights()}
        </p>
      </div>
      <SelectionPopover
        showPopover={effectiveShowPopover}
        topOffset={topOffset}
        resolveAnchorRect={resolveAnchorRect}
        popoverRef={popoverRef}
      >
        {children && children(selection)}
      </SelectionPopover>
    </div>
  )
}
