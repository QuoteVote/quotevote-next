/**
 * Types and constants for the mobile Quote page linked split-screen discussion UX.
 */

import type { ReactNode } from "react";

export const DISCUSSION_BAR_HEIGHT_PX = 56;
export const DEFAULT_QUOTE_RATIO = 0.45;
export const SNAP_QUOTE_RATIOS = [0.75, 0.5, 0.25] as const;
export const SNAP_THRESHOLD = 0.045;
/** Smallest Quote share while Discussion stays open (~80/20). */
export const MIN_QUOTE_RATIO = 0.2;
/** Largest Quote share while Discussion stays open. Releasing here collapses. */
export const MAX_QUOTE_RATIO = 0.8;
export const SPLIT_RATIO_STORAGE_KEY = "qv-mobile-discussion-split";

/**
 * A comment (or other action) that references a specific passage in the Quote.
 */
export interface LinkedPassage {
  actionId: string;
  startWordIndex: number;
  endWordIndex: number;
}

export interface TextRange {
  start: number;
  end: number;
}

export interface MobileDiscussionSplitProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discussionCount: number;
  quotePane: ReactNode;
  children: ReactNode;
}
