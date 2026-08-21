'use client'

import { Fragment, useState, useCallback, useLayoutEffect } from 'react'
import Highlighter from 'react-highlight-words'
import { parser } from '@/lib/utils/parser'
import { cn } from '@/lib/utils'
import { scrollLinkedPassageIntoView } from '@/lib/utils/discussionSplit'
import SelectionPopover from './SelectionPopover'
import type { VotingBoardProps, SelectedText } from '@/types/voting'

const LINKED_PASSAGE_CLASS =
  'bg-[#52b274]/20 text-foreground rounded-sm box-decoration-clone cursor-pointer px-0.5'

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

/**
 * VotingBoard component
 * Displays selectable text content with highlighting support for votes and comments
 */
export default function VotingBoard({
  topOffset,
  onSelect,
  highlights = false,
  content,
  children,
  votes = [],
  style,
  focusedComment,
  onHighlightClick,
}: VotingBoardProps) {
  // votes prop is available for future use (e.g., highlighting vote ranges)
  // Currently unused but kept for API compatibility
  void votes
  const [open, setOpen] = useState(false)
  const [selection, setSelection] = useState<SelectedText>({
    startIndex: 0,
    endIndex: 0,
    text: '',
    points: 0,
  })

  // Use prop if provided, otherwise default to no highlight
  // Note: store has commentId as string, but we need startWordIndex/endWordIndex
  // The parent component should provide focusedComment with the proper structure
  const commentData = focusedComment || null

  const startWordIndex = commentData?.startWordIndex ?? 0
  const endWordIndex = commentData?.endWordIndex ?? 0
  const highlightedText = content.substring(startWordIndex, endWordIndex).replace(/(\r\n|\n|\r)/gm, '')
  const hasLinkedRange = endWordIndex > startWordIndex

  useLayoutEffect(() => {
    if (!hasLinkedRange) return
    const frame = window.requestAnimationFrame(() => {
      scrollLinkedPassageIntoView()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [hasLinkedRange, commentData?.actionId, startWordIndex, endWordIndex])

  const handleSelect = useCallback(
    (select: Selection) => {
      const text = select.toString()

      if (!text) {
        setSelection({
          startIndex: 0,
          endIndex: 0,
          text: '',
          points: 0,
        })
        return
      }

      const selectionVal = parser(content, text, select)

      if (text.length > 0 && onSelect && selectionVal) {
        setOpen(true)
        const parsedSelection: SelectedText = {
          startIndex:
            typeof selectionVal.startIndex === 'number'
              ? selectionVal.startIndex
              : 0,
          endIndex:
            typeof selectionVal.endIndex === 'number'
              ? selectionVal.endIndex
              : 0,
          text: typeof selectionVal.text === 'string' ? selectionVal.text : '',
          points:
            typeof selectionVal.points === 'number' ? selectionVal.points : 0,
        }
        setSelection(parsedSelection)
        onSelect(parsedSelection)
      } else {
        setSelection({
          startIndex: 0,
          endIndex: 0,
          text: '',
          points: 0,
        })
      }
    },
    [content, onSelect],
  )

  const findChunksAtBeginningOfWords = useCallback(
    () => [{ start: startWordIndex > 0 ? startWordIndex : 0, end: endWordIndex }],
    [startWordIndex, endWordIndex],
  )

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

  const renderHighlights = () => {
    if (highlights) {
      // If there's a focused comment, highlight it
      if (hasLinkedRange) {
        return (
          <Highlighter
            style={{
              whiteSpace: 'pre-line',
            }}
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

      return (
        <Highlighter
          style={{
            whiteSpace: 'pre-line',
          }}
          highlightClassName={LINKED_PASSAGE_CLASS}
          searchWords={[highlightedText]}
          textToHighlight={content}
          autoEscape
          caseSensitive
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
      <div data-selectable className="flex-1">
        <p
          className="voting_board-content m-0 p-0 h-full"
          onContextMenu={disableContextMenu}
          onClick={handlePassageClick}
        >
          {renderHighlights()}
        </p>
      </div>
      <SelectionPopover
        showPopover={open}
        topOffset={topOffset}
        onSelect={handleSelect}
        onDeselect={() => setOpen(false)}
      >
        {children && children(selection)}
      </SelectionPopover>
    </div>
  )
}

