/**
 * PostActions TypeScript types
 * Types for PostActionCard and PostActionList components
 */

import type { Reaction } from './comment'

/**
 * User information for post actions
 */
export interface PostActionUser {
  _id: string
  username: string
  avatar?: string | {
    [key: string]: unknown
  } | null
  name?: string | null
}

/**
 * Base post action structure
 */
export interface BasePostAction {
  _id: string
  created: string | Date
  user: PostActionUser
  content?: string | null
  __typename: 'Vote' | 'Comment' | 'Quote' | 'Message'
  [key: string]: unknown
}

/**
 * Vote action
 */
export interface VoteAction extends BasePostAction {
  __typename: 'Vote'
  type?: 'up' | 'down' | 'upvote' | 'downvote' | null
  tags?: string[] | null
  content?: string | null
}

/**
 * Comment action
 */
export interface CommentAction extends BasePostAction {
  __typename: 'Comment'
  content: string
  commentQuote?: string | null
}

/**
 * Quote action
 */
export interface QuoteAction extends BasePostAction {
  __typename: 'Quote'
  quote?: string | null
}

/**
 * Message action (PostChat message)
 */
export interface MessageAction extends BasePostAction {
  __typename: 'Message'
  text: string
  userId: string
}

/**
 * Union type for all post actions
 */
export type PostAction = VoteAction | CommentAction | QuoteAction | MessageAction

/**
 * PostActionCard component props
 */
export interface PostActionCardProps {
  /**
   * The post action to display (vote, comment, quote, or message)
   */
  postAction: PostAction
  /**
   * URL path to the post (for generating share links)
   */
  postUrl?: string
  /**
   * Whether this action is currently selected/focused
   */
  selected?: boolean
  /**
   * Callback to refetch the post data after mutations
   */
  refetchPost?: () => void
}

/**
 * PostActionList component props
 */
export interface PostActionListProps {
  /**
   * Array of post actions to display
   */
  postActions: PostAction[]
  /**
   * Whether the actions are currently loading
   */
  loading?: boolean
  /**
   * URL path to the post (for generating share links)
   */
  postUrl?: string
  /**
   * Callback to refetch the post data after mutations
   */
  refetchPost?: () => void
}

/**
 * GraphQL query response for action reactions
 */
export interface ActionReactionsData {
  actionReactions: Reaction[]
}

/**
 * GraphQL mutation response for delete vote
 */
export interface DeleteVoteData {
  deleteVote: {
    _id: string
  }
}

/**
 * GraphQL mutation response for delete comment
 */
export interface DeleteCommentData {
  deleteComment: {
    _id: string
  }
}

/**
 * GraphQL mutation response for delete quote
 */
export interface DeleteQuoteData {
  deleteQuote: {
    _id: string
  }
}

