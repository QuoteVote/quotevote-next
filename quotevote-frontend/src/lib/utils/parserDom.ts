import type { ParsedSelection } from "@/types/store"

/**
 * DOM-aware parser for VotingBoard (issue #484).
 *
 * Legacy parser.ts used `doc.indexOf(selected)` which always returns the first
 * occurrence — wrong for repeated passages.
 *
 * This module derives the *approximate* offset from a live Range → prefix text
 * length, then enumerates every exact occurrence and picks the nearest to the
 * DOM offset. Safer to return undefined (no toolbar) than to bind a vote to
 * the wrong passage.
 */

export interface DomParserArgs {
  content: string
  selectedText: string
  range: Range
  contentRoot: HTMLElement
}

function buildNormalizedIndexMap(content: string): { normalized: string; map: number[] } {
  const map: number[] = []
  let normalized = ""
  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (ch === "\r") {
      // CRLF → single LF, lone CR → LF
      if (i + 1 < content.length && content[i + 1] === "\n") {
        normalized += "\n"
        map.push(i)
        i++ // skip the '\n' part of CRLF, but map normalized char to start of CRLF
      } else {
        normalized += "\n"
        map.push(i)
      }
    } else {
      normalized += ch
      map.push(i)
    }
  }
  return { normalized, map }
}

function enumerateOccurrences(haystack: string, needle: string): number[] {
  const out: number[] = []
  if (!needle) return out
  let from = 0
  while (true) {
    const idx = haystack.indexOf(needle, from)
    if (idx === -1) break
    out.push(idx)
    from = idx + 1
  }
  return out
}

/**
 * Validate range belongs to contentRoot and is non-collapsed with geometry.
 */
export function isValidRangeForRoot(range: Range, contentRoot: HTMLElement): boolean {
  if (!range || range.collapsed) return false
  if (!contentRoot.contains(range.startContainer) || !contentRoot.contains(range.endContainer)) {
    return false
  }
  // Reverse range (end before start) collapses or produces negative geometry elsewhere;
  // DOM Range is always normalized, but guard against zero-area selections.
  try {
    const rect = range.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false
  } catch {
    return false
  }
  return true
}

/**
 * Derive approximate start offset from DOM: length of text from contentRoot start to range.start.
 */
export function domApproximateStartOffset(range: Range, contentRoot: HTMLElement): number | null {
  try {
    const prefix = document.createRange()
    prefix.selectNodeContents(contentRoot)
    prefix.setEnd(range.startContainer, range.startOffset)
    const text = prefix.toString()
    prefix.detach?.()
    return text.length
  } catch {
    return null
  }
}

/**
 * Main entry: resolve a Selection Range to character offsets within `content`.
 * Returns undefined if no defensible match exists.
 */
export function parseDomSelection(args: DomParserArgs): ParsedSelection | undefined {
  const { content, selectedText, range, contentRoot } = args
  if (!selectedText) return undefined
  if (!isValidRangeForRoot(range, contentRoot)) return undefined

  const approx = domApproximateStartOffset(range, contentRoot)
  const normalizedSelected = selectedText.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  // Fast path: direct validation at approx
  if (approx != null) {
    // Try raw content first (common case: DOM text equals content slice)
    if (approx >= 0 && approx + normalizedSelected.length <= content.length) {
      const rawSlice = content.slice(approx, approx + normalizedSelected.length)
      const normSlice = rawSlice.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
      if (normSlice === normalizedSelected) {
        return {
          startIndex: approx,
          endIndex: approx + selectedText.length,
          text: selectedText,
          points: selectedText.length,
        }
      }
    }
  }

  // Normalize content for CRLF differences, keep map to original offsets
  const { normalized: normContent, map } = buildNormalizedIndexMap(content)

  // Enumerate every occurrence in normalized space
  const occurrences = enumerateOccurrences(normContent, normalizedSelected)
  if (occurrences.length === 0) return undefined

  // If single occurrence, map back via index map
  if (occurrences.length === 1) {
    const normStart = occurrences[0]
    const origStart = map[normStart]
    // Map normalized length back to original length (CRLF counts as 2)
    // For normalized length L, original length is determined by scanning.
    let origEnd: number
    if (normStart + normalizedSelected.length < map.length) {
      // Next normalized char maps to that original index
      // Original end is start of next char after the selection
      const nextOrig = map[normStart + normalizedSelected.length]
      // Handle case where selection ends with CRLF-expanded char: we need to include full CRLF
      // Heuristic: if normContent slice maps back via prefix length counting CRLFs, compute via scanning.
      // Simpler: find original end by advancing over original content counting normalized chars.
      let n = 0
      let o = origStart
      while (n < normalizedSelected.length && o < content.length) {
        if (content[o] === "\r" && o + 1 < content.length && content[o + 1] === "\n") {
          o += 2
        } else {
          o += 1
        }
        n += 1
      }
      origEnd = o
      // If we computed via map next, prefer that when it covers CRLFs correctly; fallback to scan
      if (nextOrig !== undefined && nextOrig <= origEnd) {
        // Keep scanned origEnd as ground truth
      }
    } else {
      // Selection reaches end of content
      origEnd = content.length
    }
    return {
      startIndex: origStart,
      endIndex: origEnd,
      text: content.slice(origStart, origEnd),
      points: origEnd - origStart,
    }
  }

  // Multiple occurrences: pick nearest to approx
  const target = approx ?? 0
  // Convert approx (DOM prefix length, which is normalized) to normalized-content offset
  // approx already equals normalized prefix length, so compare directly in normalized space
  let best = occurrences[0]
  let bestDist = Math.abs(best - target)
  for (let i = 1; i < occurrences.length; i++) {
    const dist = Math.abs(occurrences[i] - target)
    if (dist < bestDist) {
      bestDist = dist
      best = occurrences[i]
    }
  }
  const origStart = map[best]
  // Compute original end via scan (handles CRLF)
  let n = 0
  let o = origStart
  while (n < normalizedSelected.length && o < content.length) {
    if (content[o] === "\r" && o + 1 < content.length && content[o + 1] === "\n") {
      o += 2
    } else {
      o += 1
    }
    n += 1
  }
  const origEnd = o
  // Final verification in normalized space already passed; also verify raw slice normalizes correctly
  const rawSlice = content.slice(origStart, origEnd)
  const normSlice = rawSlice.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  if (normSlice !== normalizedSelected) return undefined
  return {
    startIndex: origStart,
    endIndex: origEnd,
    text: content.slice(origStart, origEnd),
    points: origEnd - origStart,
  }
}
