import {
  DEFAULT_QUOTE_RATIO,
  MAX_QUOTE_RATIO,
  MIN_QUOTE_RATIO,
  SNAP_QUOTE_RATIOS,
  SNAP_THRESHOLD,
  SPLIT_RATIO_STORAGE_KEY,
} from "@/types/discussionSplit";
import type { LinkedPassage, TextRange } from "@/types/discussionSplit";
import type { PostAction } from "@/types/postActions";

export function clampQuoteRatio(ratio: number): number {
  if (Number.isNaN(ratio)) return DEFAULT_QUOTE_RATIO;
  return Math.min(MAX_QUOTE_RATIO, Math.max(MIN_QUOTE_RATIO, ratio));
}

/**
 * While Discussion is open, quote can grow to MAX (discussion stays ≥ 20%).
 * Releasing the divider at that floor means "close", not "remember a sliver".
 */
export function shouldCollapseOpenSplit(ratio: number): boolean {
  return clampQuoteRatio(ratio) >= MAX_QUOTE_RATIO;
}

/**
 * Snap a continuous quote-pane ratio to 75/50/25 when it is close enough.
 * Otherwise return the clamped continuous value.
 */
export function snapQuoteRatio(ratio: number): number {
  const clamped = clampQuoteRatio(ratio);
  let nearest = clamped;
  let nearestDelta = SNAP_THRESHOLD + 1;
  for (const snap of SNAP_QUOTE_RATIOS) {
    const delta = Math.abs(clamped - snap);
    if (delta < nearestDelta) {
      nearest = snap;
      nearestDelta = delta;
    }
  }
  return nearestDelta <= SNAP_THRESHOLD ? nearest : clamped;
}

export function loadPersistedQuoteRatio(): number {
  if (typeof window === "undefined") return DEFAULT_QUOTE_RATIO;
  try {
    const raw = window.localStorage.getItem(SPLIT_RATIO_STORAGE_KEY);
    if (raw == null) return DEFAULT_QUOTE_RATIO;
    const parsed = Number.parseFloat(raw);
    const clamped = clampQuoteRatio(parsed);
    if (shouldCollapseOpenSplit(clamped)) return DEFAULT_QUOTE_RATIO;
    return clamped;
  } catch {
    return DEFAULT_QUOTE_RATIO;
  }
}

export function persistQuoteRatio(ratio: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SPLIT_RATIO_STORAGE_KEY, String(clampQuoteRatio(ratio)));
  } catch {
    // Ignore quota / private-mode failures
  }
}

export function getActionTextRange(action: PostAction): TextRange | null {
  const start = action.startWordIndex;
  const end = action.endWordIndex;
  if (start == null || end == null) return null;
  const startNum = Number(start);
  const endNum = Number(end);
  if (Number.isFinite(startNum) && Number.isFinite(endNum) && endNum > startNum) {
    return { start: startNum, end: endNum };
  }
  return null;
}

export function toLinkedPassage(action: PostAction): LinkedPassage | null {
  if (action.__typename === "Message") return null;
  const range = getActionTextRange(action);
  if (!range) return null;
  return {
    actionId: action._id,
    startWordIndex: range.start,
    endWordIndex: range.end,
  };
}

function canScrollOverflowY(element: HTMLElement): boolean {
  const overflowY = window.getComputedStyle(element).overflowY;
  return (
    (overflowY === "auto" || overflowY === "scroll") &&
    element.scrollHeight > element.clientHeight + 1
  );
}

export function getOverflowParent(
  element: HTMLElement,
  boundary?: HTMLElement | null,
): HTMLElement | null {
  let current: HTMLElement | null = element.parentElement;
  while (current && current !== document.body) {
    if (canScrollOverflowY(current)) return current;
    if (boundary && current === boundary) break;
    current = current.parentElement;
  }
  return boundary ?? null;
}

/**
 * Scroll `child` inside a single overflow container. Native scrollIntoView
 * also moves ancestor scrollers (main, nested panes) and breaks the split layout.
 */
export function scrollChildIntoContainer(
  container: HTMLElement | null,
  child: HTMLElement | null,
  block: "start" | "center" | "nearest" = "center",
): void {
  if (!container || !child || !container.contains(child)) return;

  const containerRect = container.getBoundingClientRect();
  const childRect = child.getBoundingClientRect();
  let delta = 0;

  if (block === "center") {
    delta =
      childRect.top - containerRect.top - container.clientHeight / 2 + childRect.height / 2;
  } else if (block === "start") {
    delta = childRect.top - containerRect.top - 8;
  } else if (childRect.top < containerRect.top) {
    delta = childRect.top - containerRect.top;
  } else if (childRect.bottom > containerRect.bottom) {
    delta = childRect.bottom - containerRect.bottom;
  } else {
    return;
  }

  const nextTop = Math.max(0, container.scrollTop + delta);
  if (typeof container.scrollTo === "function") {
    container.scrollTo({ top: nextTop, behavior: "smooth" });
  } else {
    container.scrollTop = nextTop;
  }
}

export function scrollLinkedPassageIntoView(): void {
  const mark = document.querySelector<HTMLElement>("[data-linked-passage='true']");
  if (!mark) return;
  const pane = document.querySelector<HTMLElement>("[data-post-detail-pane='content']");
  const scroller = pane && pane.contains(mark) ? pane : getOverflowParent(mark, pane);
  if (scroller) {
    scrollChildIntoContainer(scroller, mark, "center");
    return;
  }
  mark.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function scrollActionIntoDiscussion(
  actionId: string,
  block: "center" | "nearest" = "center",
): void {
  const child = document.getElementById(actionId);
  if (!child) return;
  const container = document.querySelector<HTMLElement>("[data-discussion-scroll='true']");
  const scroller =
    container && container.contains(child) ? container : getOverflowParent(child, container);
  if (scroller) {
    scrollChildIntoContainer(scroller, child, block);
    return;
  }
  child.scrollIntoView({
    behavior: "smooth",
    block: block === "nearest" ? "nearest" : "center",
  });
}
