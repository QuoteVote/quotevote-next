// src/lib/utils/parser.ts

import type { ParsedSelection } from "@/types/store";

export const CONTENT_REGEX = /(\w|\.)+/g;

/**
 * Parse selected text and find its position in the content
 * Supports both positional arguments (legacy) and object arguments
 */
export function parser(
  doc: string,
  selected: string,
  selection?: Selection
): ParsedSelection | undefined;
export function parser(args: {
  doc: string;
  selected: string;
}): ParsedSelection | undefined;
export function parser(
  arg1: string | { doc: string; selected: string },
  arg2?: string,
  selection?: Selection
): ParsedSelection | undefined {
  let doc: string;
  let selected: string;

  if (typeof arg1 === 'string') {
    doc = arg1;
    selected = arg2 ?? '';
  } else {
    doc = arg1.doc;
    selected = arg1.selected;
  }

  if (!selected) return undefined;

  // Try to get more accurate position from Selection API if available
  let charStartIndex = 0;
  
  if (selection && selection.rangeCount > 0) {
    try {
      const range = selection.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      const container = range.startContainer.parentElement?.closest('[data-selectable]');
      
      if (container) {
        preSelectionRange.selectNodeContents(container);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        charStartIndex = preSelectionRange.toString().length;
      }
    } catch (error) {
      // Fallback to indexOf if Selection API fails
      charStartIndex = doc.indexOf(selected);
    }
  } else {
    // Fallback to indexOf
    charStartIndex = doc.indexOf(selected);
  }

  const charEndIndex = charStartIndex !== -1 ? charStartIndex + selected.length : -1;

  return {
    startIndex: charStartIndex,
    endIndex: charEndIndex,
    text: selected,
    points: charEndIndex !== -1 ? charEndIndex - charStartIndex : 0,
  };
}
