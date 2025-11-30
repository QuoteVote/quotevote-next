import { ParsedSelection } from "@/types/store"
export const CONTENT_REGEX = /(\w|\.)+/g

// Backward-compatible overloads: accept positional args or object args
export function parser(doc: string, selected: string, _ranges?: unknown): ParsedSelection | undefined
export function parser(args: { doc: string; selected: string }): ParsedSelection | undefined
export function parser(arg1: string | { doc: string; selected: string }, arg2?: string, _ranges?: unknown): ParsedSelection | undefined {
  let doc: string
  let selected: string

  if (typeof arg1 === 'string') {
    doc = arg1
    selected = arg2 ?? ''
  } else {
    doc = arg1.doc
    selected = arg1.selected
  }

  if (!selected) return
  const charStartIndex = doc.indexOf(selected)
  const charEndIndex = charStartIndex !== -1 ? charStartIndex + selected.length : -1
  return {
    startIndex: charStartIndex,
    endIndex: charEndIndex,
    text: selected,
    points: charEndIndex !== -1 ? charEndIndex - charStartIndex : 0,
  }
}
