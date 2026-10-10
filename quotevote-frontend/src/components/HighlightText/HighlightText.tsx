"use client";

import Highlighter from "react-highlight-words";
import type { HighlightTextProps } from "@/types/components";
import { cn } from "@/lib/utils";

/**
 * HighlightText Component
 *
 * A flexible component for highlighting search terms or key phrases within text.
 * Uses react-highlight-words under the hood with proper TypeScript types and
 * Tailwind CSS styling.
 *
 * @param text - The text content to highlight
 * @param highlightTerms - Single search term or array of search terms to highlight
 * @param caseSensitive - Whether the search is case-sensitive
 * @param autoEscape - Whether to auto-escape special regex characters
 * @param highlightClassName - Custom CSS class name for highlighted spans
 * @param className - Additional CSS classes for the container
 * @param findChunks - Custom function to find chunks (advanced usage)
 *
 * @example
 * <HighlightText
 *   text="The dog is chasing the cat. Or perhaps they're just playing?"
 *   highlightTerms={['and', 'or', 'the']}
 * />
 *
 * @example
 * <HighlightText
 *   text="Hello World"
 *   highlightTerms="World"
 *   caseSensitive={true}
 * />
 */
export default function HighlightText({
  text,
  highlightTerms = [],
  caseSensitive = false,
  autoEscape = true,
  highlightClassName = "bg-yellow-200 font-semibold",
  className,
  findChunks,
}: HighlightTextProps) {
  // Normalize highlightTerms to array
  const searchWords = Array.isArray(highlightTerms)
    ? highlightTerms
    : highlightTerms
      ? [highlightTerms]
      : [];

  // Filter out empty strings
  const validSearchWords = searchWords.filter((term) => term.trim().length > 0);

  // If no valid search terms, just render the text
  if (validSearchWords.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      <Highlighter
        textToHighlight={text}
        searchWords={validSearchWords}
        autoEscape={autoEscape}
        caseSensitive={caseSensitive}
        highlightClassName={cn(highlightClassName)}
        findChunks={findChunks}
      />
    </span>
  );
}
