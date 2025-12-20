/**
 * Post-related TypeScript types
 * Includes post data structure from GraphQL queries
 */

export interface PostCreator {
  _id: string
  name?: string | null
  avatar?: string | { url: string } | null
  username?: string | null
  contributorBadge?: string | null
}

export interface PostComment {
  _id: string
  created: string
  userId: string
  content?: string | null
  startWordIndex?: number | null
  endWordIndex?: number | null
  postId?: string | null
  url?: string | null
  reaction?: string | null
  user?: PostCreator | null
}

export interface PostVote {
  _id: string
  startWordIndex?: number | null
  endWordIndex?: number | null
  created?: string | null
  type?: string | null
  tags?: string[] | null
  content?: string | null
  user?: PostCreator | null
}

export interface PostQuote {
  _id: string
  startWordIndex?: number | null
  endWordIndex?: number | null
  created?: string | null
  quote?: string | null
  user?: PostCreator | null
}

export interface PostMessageRoom {
  _id: string
  users?: string[] | null
  postId?: string | null
  messageType?: string | null
  created?: string | null
  messages?: { _id: string }[] | null
}

export interface Post {
  _id: string
  userId: string
  created: string
  groupId?: string | null
  title?: string | null
  text?: string | null
  url?: string | null
  upvotes?: number | null
  downvotes?: number | null
  approvedBy?: string[] | null
  rejectedBy?: string[] | null
  reportedBy?: string[] | null
  bookmarkedBy?: string[] | null
  enable_voting?: boolean | null
  creator?: PostCreator | null
  comments?: PostComment[] | null
  votes?: PostVote[] | null
  quotes?: PostQuote[] | null
  messageRoom?: PostMessageRoom | null
}

export interface PostQueryData {
  post: Post
}

