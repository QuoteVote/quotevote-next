/**
 * Post-related TypeScript types
 * Includes post data structure from GraphQL queries
 */

export interface PostCreator {
  _id: string
  name?: string | null
  avatar?: string | null
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

/**
 * Post component props
 */
export interface PostProps {
  post: Post
  user: {
    _id?: string
    admin?: boolean
    _followingId?: string[]
  }
  postHeight?: number
  postActions?: unknown[]
  refetchPost?: () => void
}

/**
 * PostCard component props
 */
export interface PostCardProps {
  _id: string
  text: string | null | undefined
  title: string | null | undefined
  url: string | null | undefined
  bookmarkedBy?: string[]
  approvedBy?: string[]
  rejectedBy?: string[]
  created: string
  creator?: {
    name?: string | null
    username?: string | null
    avatar?: string | null
    _id?: string | null
  }
  activityType?: string
  limitText?: boolean
  votes?: PostVote[]
  comments?: PostComment[]
  quotes?: PostQuote[]
  messageRoom?: PostMessageRoom
  groupId?: string | null
}

/**
 * PostController component props
 */
export interface PostControllerProps {
  postId?: string
}

/**
 * Posts list data structure from GraphQL
 */
export interface PostsListData {
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
 * LoadPostsList component props
 */
export interface LoadPostsListProps {
  data?: PostsListData
  onLoadMore: () => void
  loading?: boolean
}

/**
 * PostList component props
 */
export interface PostListProps {
  data?: PostsListData
  loading: boolean
  limit: number
  fetchMore: (options: {
    variables: Record<string, unknown>
    updateQuery: (
      prev: PostsListData,
      result: { fetchMoreResult?: PostsListData }
    ) => PostsListData
  }) => Promise<unknown>
  variables: Record<string, unknown>
  cols?: number
}

/**
 * Paginated posts list data structure from GraphQL
 */
export interface PaginatedPostsListData {
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
 * PaginatedPostsList component props
 */
export interface PaginatedPostsListProps {
  // Pagination props
  defaultPageSize?: number
  pageParam?: string
  pageSizeParam?: string
  
  // Filter props
  searchKey?: string
  startDateRange?: string
  endDateRange?: string
  friendsOnly?: boolean
  interactions?: boolean
  userId?: string
  sortOrder?: string
  groupId?: string
  approved?: number
  
  // Component props
  cols?: number
  showPageInfo?: boolean
  showFirstLast?: boolean
  maxVisiblePages?: number
  
  // Callbacks
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onRefresh?: () => void
  onTotalCountChange?: (count: number) => void
  
  // Styling
  className?: string
  contentClassName?: string
  paginationClassName?: string
}

