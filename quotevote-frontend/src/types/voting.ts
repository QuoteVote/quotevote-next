/**
 * Voting-related TypeScript types
 * Types for voting components and vote-related data structures
 */

import type { LucideIcon } from "lucide-react";
import type { PostVote } from "./post";
import type { ParsedSelection } from "./store";

/**
 * Vote type (upvote or downvote)
 */
export type VoteType = "up" | "down";

/**
 * Vote option tags
 */
export type VoteOption = "#true" | "#agree" | "#like" | "#false" | "#disagree" | "#dislike";

/**
 * Selected text structure from parser
 */
export interface SelectedText extends ParsedSelection {
  startIndex: number;
  endIndex: number;
  text: string;
  points?: number;
}

/**
 * The three independent response pairs. A passage can hold one response per pair.
 */
export type VoteAxis = "agreement" | "truth" | "liking";

/**
 * Vote handler function type
 */
export type VoteHandler = (vote: { type: VoteType; tags: VoteOption }) => void | Promise<void>;

/**
 * Quote handler function type. Receives the passage to place in the Discussion composer.
 */
export type QuoteHandler = (selection: SelectedText) => void;

/**
 * Mutually exclusive modes of the selection popup (issue #529)
 */
export type SelectionPopupMode = "quote" | "vote";

/**
 * One response row cell in the popup's Vote mode
 */
export interface VoteResponseOption {
  type: VoteType;
  tags: VoteOption;
  label: string;
  icon: LucideIcon;
  /** Render the icon filled (the design's solid heart) */
  filledIcon?: boolean;
  testId: string;
}

/**
 * One of the current user's existing votes on the selected passage
 */
export interface UserVote {
  _id: string;
  type: VoteType;
  tags?: string | null;
}

/**
 * Controls VotingBoard passes to its popup render prop
 */
export interface SelectionPopupControls {
  /** Clears the text selection and hides the popup */
  dismiss: () => void;
  /** True on phones, where the popup is a bottom sheet instead of floating by the text */
  sheet: boolean;
}

/**
 * Props for the VotingBoard helper that renders the popup render prop
 */
export interface SelectionPopupContentProps {
  render: (selection: SelectedText, controls: SelectionPopupControls) => React.ReactNode;
  selection: SelectedText;
  dismiss: () => void;
  sheet: boolean;
}

/**
 * Selection handler function type
 */
export type SelectionHandler = (selection: SelectedText) => void;

/**
 * VotingPopup component props
 */
export interface VotingPopupProps {
  /**
   * Handler function called when a vote response is chosen
   */
  onVote: VoteHandler;
  /**
   * Handler function called when Quote is chosen
   */
  onQuote: QuoteHandler;
  /**
   * Currently selected text
   */
  selectedText: SelectedText;
  /**
   * The current user's votes on the selected passage (several responses can be active)
   */
  userVotes: UserVote[];
  /**
   * Handler function called to remove one of the user's votes
   */
  onRemoveVote: (voteId: string) => void | Promise<void>;
  /**
   * Hides the popup and clears the selection
   */
  onDismiss?: () => void;
  /**
   * `popover` floats next to the selection; `sheet` is the phone bottom sheet, with a
   * drag handle and the selected passage on top.
   */
  variant?: "popover" | "sheet";
}

/**
 * Explicit delayed-mobile selection state machine (issue #484).
 */
export type SelectionPhase = "idle" | "native" | "toolbar";

/**
 * VotingBoard component props
 */
export interface VotingBoardProps {
  /**
   * Top offset for positioning the popover
   */
  topOffset?: number;
  /**
   * Handler function called when text is selected
   */
  onSelect?: SelectionHandler;
  /**
   * Handler called when selection is dismissed (background tap, reset, mode change).
   * Parent should clear its selectedText to empty indices/text.
   */
  onDeselect?: () => void;
  /**
   * Whether to show highlights for votes/comments
   */
  highlights?: boolean;
  /**
   * The content text to display and make selectable
   */
  content: string;
  /**
   * Render prop function that receives selection data
   */
  children?: (selection: SelectedText, controls: SelectionPopupControls) => React.ReactNode;
  /**
   * Array of votes to highlight
   */
  votes?: PostVote[];
  /**
   * Additional style props
   */
  style?: React.CSSProperties;
  /**
   * Focused comment data (optional, for highlighting specific comment ranges)
   */
  focusedComment?: {
    startWordIndex: number;
    endWordIndex: number;
    actionId?: string;
  } | null;
  /**
   * Called when the highlighted (linked) passage is tapped.
   */
  onHighlightClick?: () => void;
  /**
   * Passages that already have votes, quotes or comments, marked in the text (#548)
   */
  activity?: PassageActivitySegment[];
  /**
   * Called when a marked passage is clicked or activated with the keyboard
   */
  onActivityClick?: (segment: PassageActivitySegment) => void;
}

/**
 * SelectionPopover component props — pure portal/positioning (issue #484).
 * No selection polling, no onSelect/onDeselect. Owner (VotingBoard) resolves the anchor.
 */
export interface SelectionPopoverProps {
  /**
   * Whether to show the popover
   */
  showPopover: boolean;
  /**
   * Top offset for positioning
   */
  topOffset?: number;
  /**
   * Resolve the current anchor rectangle for positioning.
   * Desktop: live browser range rect; Mobile toolbar: retained mark rect or cached native rect.
   */
  resolveAnchorRect: () => DOMRect | null;
  /**
   * Ref to the popover element (owned by VotingBoard)
   */
  popoverRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Additional style props
   */
  style?: React.CSSProperties;
  /**
   * Phone layout: a bottom sheet over a dimmed backdrop instead of a popover by the text
   */
  sheet?: boolean;
  /**
   * Closes the popup (backdrop tap and Escape)
   */
  onDismiss?: () => void;
  /**
   * Child components to render inside the popover
   */
  children: React.ReactNode;
}

/**
 * A stretch of post text with community activity on it (#548). Overlapping or
 * touching votes, quotes and passage comments merge into one segment.
 */
export interface PassageActivitySegment {
  /** Character offsets into the post text, end exclusive */
  start: number;
  end: number;
  upvotes: number;
  downvotes: number;
  quotes: number;
  comments: number;
  /** Ids of the actions in this segment, newest first (matches the Discussion item ids) */
  actionIds: string[];
}

/** Any action with a passage range: a vote, quote or comment */
export interface PassageAction {
  _id: string;
  startWordIndex?: number | null;
  endWordIndex?: number | null;
  created?: string | null;
}
