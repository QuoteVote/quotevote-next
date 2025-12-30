/**
 * Activity-related TypeScript types
 * 
 * Types for activity feeds, activity items, filters, and handlers.
 */

import type { Post } from './post'

// Activity event types
export type ActivityEventType = 'POSTED' | 'VOTED' | 'COMMENTED' | 'QUOTED' | 'LIKED' | 'UPVOTED' | 'DOWNVOTED'

// Activity user
export interface ActivityUser {
  _id: string
  name?: string
  username: string
  avatar?: string
  contributorBadge?: boolean
}

// Activity vote
export interface ActivityVote {
  _id: string
  startWordIndex: number
  endWordIndex: number
  created: string | number
  type: string
  tags?: string[]
}

// Activity comment
export interface ActivityComment {
  _id: string
  created: string | number
  userId: string
  content: string
  startWordIndex: number
  endWordIndex: number
}

// Activity quote
export interface ActivityQuote {
  _id: string
  startWordIndex: number
  endWordIndex: number
  created: string | number
  quote: string
}

// Activity post
export interface ActivityPost {
  _id: string
  title?: string
  text: string
  url: string
  upvotes: number
  downvotes: number
  votes?: Array<{ _id: string }>
  quotes?: Array<{ _id: string }>
  comments?: Array<{ _id: string }>
  messageRoom?: {
    _id: string
    messages?: Array<{ _id: string }>
  }
  bookmarkedBy: string[]
  created: string | number
  creator?: ActivityUser
}

// Activity entity
export interface ActivityEntity {
  _id: string
  created: string | number
  postId?: string
  userId: string
  user: ActivityUser
  activityType: ActivityEventType
  content?: string
  post?: ActivityPost
  voteId?: string
  vote?: ActivityVote
  commentId?: string
  comment?: ActivityComment
  quoteId?: string
  quote?: ActivityQuote
}

// Activity pagination
export interface ActivityPagination {
  total_count: number
  limit: number
  offset: number
}

// Activity data response
export interface ActivityData {
  entities: ActivityEntity[]
  pagination: ActivityPagination
}

// Activity query response
export interface GetUserActivityData {
  activities: ActivityData
}

// Activity query variables
export interface GetUserActivityVariables {
  user_id: string
  limit: number
  offset: number
  searchKey: string
  startDateRange?: string | null
  endDateRange?: string | null
  activityEvent: ActivityEventType[] | string[]
}

// Activity component props
export interface ActivityProps {
  showSubHeader?: boolean
  userId?: string
}

export interface ActivityListProps {
  data?: GetUserActivityData
  loading: boolean
  fetchMore?: (options: {
    variables: GetUserActivityVariables
    updateQuery: (prev: GetUserActivityData, result: { fetchMoreResult?: GetUserActivityData }) => GetUserActivityData
  }) => Promise<unknown>
  variables: GetUserActivityVariables
}

export interface PaginatedActivityListProps {
  // Pagination props
  defaultPageSize?: number
  pageParam?: string
  pageSizeParam?: string
  
  // Filter props
  userId?: string
  searchKey?: string
  startDateRange?: string
  endDateRange?: string
  activityEvent?: ActivityEventType[]
  
  // Component props
  showPageInfo?: boolean
  showFirstLast?: boolean
  maxVisiblePages?: number
  
  // Callbacks
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onRefresh?: () => void
  
  // Styling
  className?: string
  contentClassName?: string
  paginationClassName?: string
}

// Empty props type - component accepts no props
export type ActivityEmptyListProps = Record<string, never>

// ActivityCard props
export interface ActivityCardProps {
  avatar?: string | { src?: string; alt?: string }
  cardColor?: string
  name?: string
  username: string
  date: string | number
  content: string
  comments?: unknown[]
  quotes?: unknown[]
  messages?: unknown[]
  votes?: unknown[]
  liked?: boolean
  width?: 'lg' | 'md' | 'sm' | 'xl' | 'xs' | number
  onLike?: (liked: boolean, event: React.MouseEvent) => void
  onCardClick?: () => void
  handleRedirectToProfile?: (username: string) => void
  post?: Partial<Post>
  activityType?: string
  upvotes?: number
  downvotes?: number
}

// Date range filter
export interface DateRangeFilter {
  startDate: string
  endDate: string
}

