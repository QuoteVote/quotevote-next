/**
 * Voting-related TypeScript types
 * Types for voting components and vote-related data structures
 */

import type { PostVote } from './post'
import type { ParsedSelection } from './store'

/**
 * Vote type (upvote or downvote)
 */
export type VoteType = 'up' | 'down'

/**
 * Vote option tags
 */
export type VoteOption = '#true' | '#agree' | '#like' | '#false' | '#disagree' | '#dislike'

/**
 * Voted by entry structure
 */
export interface VotedByEntry {
  userId: string
  type: VoteType
  _id?: string
  [key: string]: unknown
}

/**
 * Selected text structure from parser
 */
export interface SelectedText extends ParsedSelection {
  startIndex: number
  endIndex: number
  text: string
  points?: number
}

/**
 * Vote handler function type
 */
export type VoteHandler = (vote: { type: VoteType; tags: VoteOption }) => void

/**
 * Comment handler function type
 */
export type CommentHandler = (comment: string, withQuote: boolean) => void

/**
 * Quote handler function type
 */
export type QuoteHandler = () => void

/**
 * Selection handler function type
 */
export type SelectionHandler = (selection: SelectedText) => void

/**
 * VotingPopup component props
 */
export interface VotingPopupProps {
  /**
   * Array of users who have voted
   */
  votedBy: VotedByEntry[]
  /**
   * Handler function called when a vote is submitted
   */
  onVote: VoteHandler
  /**
   * Handler function called when a comment is added
   */
  onAddComment: CommentHandler
  /**
   * Handler function called when a quote is added
   */
  onAddQuote: QuoteHandler
  /**
   * Currently selected text
   */
  selectedText: SelectedText
  /**
   * Whether the current user has already voted
   */
  hasVoted: boolean
  /**
   * Type of vote the current user has cast (if any)
   */
  userVoteType?: VoteType | null
}

/**
 * VotingBoard component props
 */
export interface VotingBoardProps {
  /**
   * Top offset for positioning the popover
   */
  topOffset?: number
  /**
   * Handler function called when text is selected
   */
  onSelect?: SelectionHandler
  /**
   * Whether to show highlights for votes/comments
   */
  highlights?: boolean
  /**
   * The content text to display and make selectable
   */
  content: string
  /**
   * Render prop function that receives selection data
   */
  children?: (selection: SelectedText) => React.ReactNode
  /**
   * Array of votes to highlight
   */
  votes?: PostVote[]
  /**
   * Additional style props
   */
  style?: React.CSSProperties
  /**
   * Focused comment data (optional, for highlighting specific comment ranges)
   */
  focusedComment?: {
    startWordIndex: number
    endWordIndex: number
  } | null
}

/**
 * SelectionPopover component props
 */
export interface SelectionPopoverProps {
  /**
   * Whether to show the popover
   */
  showPopover: boolean
  /**
   * Top offset for positioning
   */
  topOffset?: number
  /**
   * Handler function called when text is selected
   */
  onSelect: (selection: Selection) => void
  /**
   * Handler function called when selection is cleared
   */
  onDeselect: () => void
  /**
   * Additional style props
   */
  style?: React.CSSProperties
  /**
   * Child components to render inside the popover
   */
  children: React.ReactNode
}

