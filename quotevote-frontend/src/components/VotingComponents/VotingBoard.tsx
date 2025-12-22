// src/components/Voting/VotingBoard.tsx
"use client";

import { Fragment, useState, useEffect } from "react";
import Highlighter from "react-highlight-words";
import { useAppStore } from "@/store";
import { parser } from "@/lib/utils/parser";
import { SelectionPopover } from "./SelectionPopover";
import type { VotingBoardProps, SelectedText } from "@/types/voting";

/**
 * VotingBoard - Interactive text content with selection and highlighting
 *
 * Features:
 * - Text selection tracking
 * - Highlight focused comments
 * - Selection popover for actions
 * - Context menu disabled for better UX
 */
export function VotingBoard({
  content,
  onSelect,
  highlights = false,
  votes = [],
  selectedText,
  topOffset,
  children,
}: VotingBoardProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<SelectedText>({
    text: "",
    startIndex: 0,
    endIndex: 0,
  });

  // Get focused comment from store
  const focusedComment = useAppStore((state) => state.ui?.focusedComment);
  const { startWordIndex = 0, endWordIndex = 0 } = focusedComment || {};

  const highlightedText = content
    .substring(startWordIndex, endWordIndex)
    .replace(/(\r\n|\n|\r)/gm, "");

  // Handle text selection
  const handleSelect = (select: Selection): void => {
    const text = select.toString();

    if (!text) return;

    const selectionVal = parser(content, text, select);

    if (text.length > 0 && onSelect) {
      setOpen(true);
      setSelection(selectionVal);
      onSelect(selectionVal);
    } else {
      setSelection({
        text: "",
        startIndex: 0,
        endIndex: 0,
      });
    }
  };

  // Find chunks for highlighting focused comment
  const findChunksAtBeginningOfWords = (): Array<{ start: number; end: number }> => {
    return [
      {
        start: startWordIndex > 0 ? startWordIndex : 0,
        end: endWordIndex,
      },
    ];
  };

  // Disable context menu for better UX
  const disableContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
  };

  // Render content with highlights
  const renderHighlights = (): React.ReactNode => {
    if (highlights) {
      // If there's a focused comment, highlight it
      if (endWordIndex > startWordIndex) {
        return (
          <Highlighter
            className="whitespace-pre-line"
            highlightClassName="bg-[#52b274] text-white"
            textToHighlight={content}
            findChunks={findChunksAtBeginningOfWords}
            autoEscape
            onContextMenu={disableContextMenu}
          />
        );
      }

      // Highlight specific text
      return (
        <Highlighter
          className="whitespace-pre-line"
          highlightClassName="bg-[#52b274] text-white"
          searchWords={[highlightedText]}
          textToHighlight={content}
          autoEscape
          caseSensitive
          onContextMenu={disableContextMenu}
        />
      );
    }

    // No highlights - render plain text with line breaks
    return content.split(/\n/g).map((line, contentIndex) => (
      <Fragment key={`frag-${contentIndex}`}>
        {line.split(/\s+/g).map((word, index) => (
          <span key={`${index}-${word}`}>{`${word} `}</span>
        ))}
        <br />
      </Fragment>
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <div data-selectable className="flex-1 overflow-auto">
        <p
          className="m-0 p-0 h-full"
          onContextMenu={disableContextMenu}
          data-testid="voting-board-content"
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
        {children(selection)}
      </SelectionPopover>
    </div>
  );
}
