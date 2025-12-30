'use client'

import { Fragment, useState, useCallback } from 'react'
import Highlighter from 'react-highlight-words'
import { parser } from '@/lib/utils/parser'
import SelectionPopover from './SelectionPopover'
import type { VotingBoardProps, SelectedText } from '@/types/voting'

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

  const renderHighlights = () => {
    if (highlights) {
      // If there's a focused comment, highlight it
      if (endWordIndex > startWordIndex) {
        return (
          <Highlighter
            style={{
              whiteSpace: 'pre-line',
            }}
            highlightClassName="bg-[#52b274] text-white"
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
          highlightClassName="bg-[#52b274] text-white"
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
    <div className="h-full flex flex-col" style={style}>
      <div data-selectable className="flex-1 overflow-auto">
        <p
          className="voting_board-content m-0 p-0 h-full"
          onContextMenu={disableContextMenu}
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

