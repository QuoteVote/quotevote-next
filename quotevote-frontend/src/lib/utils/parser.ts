import { ParsedSelection } from "@/types/store"
export const CONTENT_REGEX = /(\w|\.)+/g

export function parser({doc, selected}: {doc: string, selected: string}): ParsedSelection | undefined {
  if (!selected) return
  // Find the first occurrence of the selected text in the full document
  const charStartIndex = doc.indexOf(selected)
  const charEndIndex = charStartIndex !== -1 ? charStartIndex + selected.length : -1
  return {
    startIndex: charStartIndex,
    endIndex: charEndIndex,
    text: selected,
    points: charEndIndex !== -1 ? charEndIndex - charStartIndex : 0,
  }
}
