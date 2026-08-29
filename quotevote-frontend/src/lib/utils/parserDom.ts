import type { ParsedSelection } from "@/types/store";

export interface DomParserArgs {
  content: string;
  selectedText: string;
  range: Range;
  contentRoot: HTMLElement;
}

interface NormalizedContent {
  normalized: string;
  map: number[];
}

function buildNormalizedIndexMap(content: string): NormalizedContent {
  const map: number[] = [];
  let normalized = "";
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === "\r") {
      if (i + 1 < content.length && content[i + 1] === "\n") {
        normalized += "\n";
        map.push(i);
        i++;
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
  if (n < normLength) return null;
  return { start, end: o };
}

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

export function domApproximateStartOffset(range: Range, contentRoot: HTMLElement): number | null {
  try {
    const prefix = document.createRange();
    prefix.selectNodeContents(contentRoot);
    prefix.setEnd(range.startContainer, range.startOffset);
    const text = prefix.toString();
    prefix.detach?.();
    return normalizeText(text).length;
  } catch {
    return null;
  }
}

export function parseDomSelection(args: DomParserArgs): ParsedSelection | undefined {
  const { content, selectedText, range, contentRoot } = args;
  if (!selectedText) return undefined;
  if (!isValidRangeForRoot(range, contentRoot)) return undefined;

  const approx = domApproximateStartOffset(range, contentRoot);
  const normalizedSelected = normalizeText(selectedText);
  if (!normalizedSelected) return undefined;

  const { normalized: normContent, map } = buildNormalizedIndexMap(content);

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

  const occurrences = enumerateOccurrences(normContent, normalizedSelected);
  if (occurrences.length === 0) return undefined;

  if (approx == null) {
    if (occurrences.length > 1) return undefined;
    const original = normalizedRangeToOriginal(
      content,
      map,
      occurrences[0],
      normalizedSelected.length
    );
    if (!original) return undefined;
    const rawSlice = content.slice(original.start, original.end);
    if (normalizeText(rawSlice) !== normalizedSelected) return undefined;
    return {
      startIndex: original.start,
      endIndex: original.end,
      text: rawSlice,
      points: original.end - original.start,
    };
  }

  const target = approx;
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

  const rawSlice = content.slice(original.start, original.end);
  if (normalizeText(rawSlice) !== normalizedSelected) return undefined;
  return {
    startIndex: original.start,
    endIndex: original.end,
    text: rawSlice,
    points: original.end - original.start,
  };
}
