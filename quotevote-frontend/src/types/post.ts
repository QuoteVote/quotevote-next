/**
 * User/Creator information
 */
export interface Creator {
  name: string;
  avatar: {
    url?: string;
    color?: string;
    initials?: string;
  };
  username: string;
}

/**
 * Vote information
 */
export interface Vote {
  userId: string;
  type: 'up' | 'down';
  deleted?: boolean;
  content?: string;
  tags?: string[];
  startWordIndex?: number;
  endWordIndex?: number;
  created?: string;
}

/**
 * Post entity
 */
export interface Post {
  _id: string;
  id: string;
  title: string;
  text: string;
  content?: string;
  url?: string;
  creator: Creator;
  userId: string;
  created: string;
  createdAt: string;
  enable_voting: boolean;
  votedBy: Vote[];
  votes?: Vote[];
  approvedBy: string[];
  rejectedBy: string[];
  reportedBy?: string[];
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isAuthor?: boolean;
  rank?: number;
}

/**
 * Pagination metadata
 */
export interface Pagination {
  total_count: number;
  offset: number;
  limit: number;
  page?: number;
}

/**
 * Posts query response
 */
export interface PostsQueryData {
  posts: {
    entities: Post[];
    pagination: Pagination;
  };
}

/**
 * Single post query response
 */
export interface PostQueryData {
  post: Post;
}

/**
 * Selected text for voting/commenting
 */
export interface SelectedText {
  text: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Vote object for mutations
 */
export interface VoteInput {
  content: string;
  postId: string;
  userId: string;
  type: 'up' | 'down';
  tags: string[];
  startWordIndex: number;
  endWordIndex: number;
}

/**
 * Comment input
 */
export interface CommentInput {
  userId: string;
  content: string;
  startWordIndex: number;
  endWordIndex: number;
  postId: string;
  url?: string;
  quote?: string;
}

/**
 * Quote input
 */
export interface QuoteInput {
  quote: string;
  postId: string;
  quoter: string;
  quoted: string;
  startWordIndex: number;
  endWordIndex: number;
}

/**
 * PaginatedPostsList component props
 */
export interface PaginatedPostsListProps {
  // Pagination props
  defaultPageSize?: number;
  pageParam?: string;
  pageSizeParam?: string;
  
  // Filter props
  searchKey?: string;
  startDateRange?: string;
  endDateRange?: string;
  friendsOnly?: boolean;
  interactions?: boolean;
  userId?: string;
  sortOrder?: string;
  groupId?: string;
  approved?: number;
  
  // Component props
  cols?: number;
  showPageInfo?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  
  // Callbacks
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRefresh?: () => void;
  onTotalCountChange?: (count: number) => void;
  
  // Styling
  className?: string;
  contentClassName?: string;
  paginationClassName?: string;
}

/**
 * Post component props
 */
export interface PostComponentProps {
  post: Post;
  user: {
    _id: string;
    _followingId: string[];
    admin?: boolean;
    name?: string;
    username?: string;
  };
  postHeight?: number;
  postActions?: unknown[];
  refetchPost?: () => void;
}

/**
 * PostsList component props (for infinite scroll)
 */
export interface PostsListProps {
  userId?: string;
  limit?: number;
  variables?: Record<string, any>;
}

/**
 * Posts data structure from GraphQL (for PostsList)
 */
export interface PostsData {
  posts: {
    entities: Post[];
    pagination: Pagination;
  };
}

/**
 * LoadPostsList component props (for rendering post lists)
 */
export interface LoadPostsListProps {
  data: PostsData | undefined;
  loading: boolean;
  onLoadMore: () => void;
  hiddenPosts?: string[];
  onHidePost?: (postId: string) => void;
  currentUserId?: string;
}
