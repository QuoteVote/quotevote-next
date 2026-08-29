import type { ParsedSelection } from "@/types/store";

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
  content: string;
  selectedText: string;
  range: Range;
  contentRoot: HTMLElement;
}

interface NormalizedContent {
  normalized: string;
  /** map[normalizedIndex] = originalIndex for every normalized char */
  map: number[];
}

function buildNormalizedIndexMap(content: string): NormalizedContent {
  const map: number[] = [];
  let normalized = "";
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === "\r") {
      // CRLF → single LF, lone CR → LF
      if (i + 1 < content.length && content[i + 1] === "\n") {
        normalized += "\n";
        map.push(i);
        i++; // skip the '\n' half of the CRLF pair
      } else {
        normalized += "\n";
        map.push(i);
      }
    } else {
      normalized += ch;
      map.push(i);
    }
  }
  return { normalized, map };
}

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function enumerateOccurrences(haystack: string, needle: string): number[] {
  const out: number[] = [];
  if (!needle) return out;
  let from = 0;
  while (true) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) break;
    out.push(idx);
    from = idx + 1;
  }
  return out;
}

/**
 * Convert a normalized-space [start, end) range back to original-content
 * offsets, advancing over CRLF pairs as a single normalized char.
 * This is the only end-point derivation — no length arithmetic in original
 * space, so a selection can never end midway through a CRLF (P2 #2).
 */
function normalizedRangeToOriginal(
  content: string,
  map: number[],
  normStart: number,
  normLength: number
): { start: number; end: number } | null {
  if (normStart < 0 || normStart >= map.length) return null;
  const start = map[normStart];
  let n = 0;
  let o = start;
  while (n < normLength && o < content.length) {
    if (content[o] === "\r" && o + 1 < content.length && content[o + 1] === "\n") {
      o += 2;
    } else {
      o += 1;
    }
    n += 1;
  }
  if (n < normLength) return null; // ran off the end of content
  return { start, end: o };
}

/**
 * Validate range belongs to contentRoot and is non-collapsed with geometry.
 */
export function isValidRangeForRoot(range: Range, contentRoot: HTMLElement): boolean {
  if (!range || range.collapsed) return false;
  if (!contentRoot.contains(range.startContainer) || !contentRoot.contains(range.endContainer)) {
    return false;
  }
  try {
    const rect = range.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
  } catch {
    return false;
  }
  return true;
}

/**
 * Derive approximate start offset from DOM: length of text from contentRoot
 * start to range.start. This is a *normalized* offset (DOM text has no CRLF).
 */
export function domApproximateStartOffset(range: Range, contentRoot: HTMLElement): number | null {
  try {
    const prefix = document.createRange();
    prefix.selectNodeContents(contentRoot);
    prefix.setEnd(range.startContainer, range.startOffset);
    const text = prefix.toString();
    prefix.detach?.();
    return text.length;
  } catch {
    return null;
  }
}

/**
 * Main entry: resolve a Selection Range to character offsets within `content`.
 * Returns undefined if no defensible match exists.
 */
export function parseDomSelection(args: DomParserArgs): ParsedSelection | undefined {
  const { content, selectedText, range, contentRoot } = args;
  if (!selectedText) return undefined;
  if (!isValidRangeForRoot(range, contentRoot)) return undefined;

  const approx = domApproximateStartOffset(range, contentRoot);
  const normalizedSelected = normalizeText(selectedText);
  if (!normalizedSelected) return undefined;

  // Normalize content once; all matching happens in normalized space and both
  // endpoints map back through the index map (P2 #2 — fast path included).
  const { normalized: normContent, map } = buildNormalizedIndexMap(content);

  // Fast path: validate directly at the DOM-derived offset in normalized space
  if (approx != null && approx >= 0 && approx + normalizedSelected.length <= normContent.length) {
    const normSlice = normContent.slice(approx, approx + normalizedSelected.length);
    if (normSlice === normalizedSelected) {
      const original = normalizedRangeToOriginal(content, map, approx, normalizedSelected.length);
      if (original) {
        return {
          startIndex: original.start,
          endIndex: original.end,
          text: content.slice(original.start, original.end),
          points: original.end - original.start,
        };
      }
    }
  }

  // Enumerate every exact occurrence in normalized space
  const occurrences = enumerateOccurrences(normContent, normalizedSelected);
  if (occurrences.length === 0) return undefined;

  // Pick the occurrence nearest the DOM-derived approximate offset
  const target = approx ?? 0;
  let best = occurrences[0];
  let bestDist = Math.abs(best - target);
  for (let i = 1; i < occurrences.length; i++) {
    const dist = Math.abs(occurrences[i] - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = occurrences[i];
    }
  }

  const original = normalizedRangeToOriginal(content, map, best, normalizedSelected.length);
  if (!original) return undefined;

  // Final verification: raw slice must normalize back to the selection
  const rawSlice = content.slice(original.start, original.end);
  if (normalizeText(rawSlice) !== normalizedSelected) return undefined;
  return {
    startIndex: original.start,
    endIndex: original.end,
    text: rawSlice,
    points: original.end - original.start,
  };
}
