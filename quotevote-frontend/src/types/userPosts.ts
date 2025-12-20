/**
 * TypeScript types for UserPosts components
 * All types are defined here following Migration Rules
 */

import type { Post } from './post'

/**
 * Props for UserPosts component
 */
export interface UserPostsProps {
  /**
   * User ID to fetch posts for
   */
  userId: string
}

/**
 * Props for PostCard component (placeholder until Post components are migrated)
 */
export interface PostCardProps {
  /**
   * Post data to display
   */
  post: Post
  /**
   * Index of the post in the list
   */
  index?: number
}

/**
 * GraphQL response type for posts query
 */
export interface PostsQueryResponse {
  posts: {
    entities: Post[]
    pagination: {
      total_count: number
      limit: number
      offset: number
    }
  }
}

/**
 * GraphQL variables for posts query
 */
export interface PostsQueryVariables {
  limit: number
  offset: number
  searchKey: string
  startDateRange?: string | null
  endDateRange?: string | null
  friendsOnly?: boolean | null
  interactions?: boolean | null
  userId?: string | null
  sortOrder?: string | null
  groupId?: string | null
  approved?: boolean | null
}

