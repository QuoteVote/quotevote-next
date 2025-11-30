/**
 * TypeScript interfaces for the global application store
 * These types define the structure of state that will be managed by Zustand
 */

// User state interface
export interface UserState {
  loading: boolean;
  loginError: string | null;
  data: {
    id?: string;
    username?: string;
    email?: string;
    avatar?: string;
    admin?: boolean;
    _followingId?: string;
    [key: string]: unknown;
  };
  isLoggedIn?: boolean;
}

// UI state interface
export interface UIState {
  filter: {
    visibility: boolean;
    value: string | string[];
  };
  date: {
    visibility: boolean;
    value: string;
  };
  search: {
    visibility: boolean;
    value: string;
  };
  selectedPost: {
    id: string | null;
  };
  selectedPage: string;
  hiddenPosts: string[];
  snackbar: {
    open: boolean;
    type: string;
    message: string;
  };
  selectedPlan: string;
  focusedComment: string | null;
  sharedComment: string | null;
}

// Chat state interface
export interface ChatState {
  submitting: boolean;
  selectedRoom: string | null;
  open: boolean;
  buddyList: unknown[];
  presenceMap: Record<string, {
    status: string;
    statusMessage: string;
    lastSeen: number;
  }>;
  typingUsers: Record<string, string[]>;
  userStatus: string;
  userStatusMessage: string;
  pendingBuddyRequests: unknown[];
  blockedUsers: string[];
  statusEditorOpen: boolean;
}

// Filter state interface
export interface FilterState {
  filter: {
    visibility: boolean;
    value: string[];
  };
  date: {
    visibility: boolean;
    value: string;
  };
  search: {
    visibility: boolean;
    value: string;
  };
}

// Root application state interface
export interface AppState {
  user: UserState;
  ui: UIState;
  chat: ChatState;
  filter: FilterState;
}

// ===== Types used by display utilities =====

// Activity-related types used in composePost
export type ActivityEvent = 'VOTED' | 'POSTED' | 'QUOTED' | 'COMMENTED' | 'HEARTED'

export type VoteType = 'up' | 'down'

export interface ActivityCreator {
  id?: string
  username?: string
  avatar?: string
}

export interface ActivityContent {
  title?: string
}

export interface ActivityData {
  _id: string
  type?: VoteType | string
  points?: number
  title?: string
  quote?: string
  content?: ActivityContent | { title?: string; content?: string }
  created: string | Date
  creator?: ActivityCreator
}

export interface Activity {
  event: ActivityEvent | string
  data: ActivityData
}

// Minimal theme shape required by composePost
export interface ActivityCardTheme {
  color: string
}

export interface ActivityCardsTheme {
  quoted: ActivityCardTheme
  commented: ActivityCardTheme
}

export interface ThemeShape {
  activityCards: ActivityCardsTheme
}

export type DecodedToken = {
  exp?: number
  [key: string]: unknown
}

export type ActivityContentType =
  | 'LIKED'
  | 'POSTED'
  | 'COMMENTED'
  | 'UPVOTED'
  | 'DOWNVOTED'
  | 'QUOTED'
  | string

export interface PostText {
  text: string
}

export interface WordRange {
  startWordIndex: number
  endWordIndex: number
}

export type QuoteSelection = WordRange
export type VoteSelection = WordRange
export type CommentSelection = WordRange

export interface GetActivityContentArgs {
  type: ActivityContentType
  post: PostText
  quote: QuoteSelection
  vote: VoteSelection
  comment: CommentSelection
}

export interface VoteStyle {
  backgroundImage?: string
  backgroundColor?: string
}

export interface Vote {
  startWordIndex: number
  endWordIndex: number
  type: 'up' | 'down'
}

export interface VotePoint {
  up: number
  down: number
  total: number
  range: string
  start: number
  end: number
}

export interface Span {
  startIndex: number
  endIndex?: number
  spanBg: VoteStyle
  value: VotePoint
  text?: string
}

export interface ReduceAccumulator {
  prevVal: VotePoint | Record<string, never>
  prevKey: number | string
}

// ===== Types for ObjectID serialization utilities =====

export interface MongoObjectID {
  _bsontype: 'ObjectID'
  id: Buffer | string
  toString?: () => string
}

export type IdLike = string | MongoObjectID | null | undefined

export interface VotedByEntry {
  userId?: IdLike
  _id?: IdLike
  [key: string]: unknown
}

export interface CreatorRef {
  _id?: IdLike
  [key: string]: unknown
}

export interface PostWithIds {
  votedBy?: Array<VotedByEntry | unknown>
  approvedBy?: IdLike[] | unknown
  rejectedBy?: IdLike[] | unknown
  bookmarkedBy?: IdLike[] | unknown
  reportedBy?: IdLike[] | unknown
  _id?: IdLike
  userId?: IdLike
  groupId?: IdLike
  creator?: CreatorRef | unknown
  [key: string]: unknown
}

export interface ParsedSelection {
  startIndex: number
  endIndex: number
  text: string
  points: number
}


export interface PageToOffsetResult {
  limit: number
  offset: number
}

export interface OffsetToPageResult {
  page: number
  pageSize: number
}

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  startIndex: number
  endIndex: number
}

export interface NormalizePaginationParamsInput {
  page: number
  pageSize: number
  totalCount: number
}

export type NormalizePaginationParamsOutput = NormalizePaginationParamsInput

export interface GraphQLVariableParams {
  page: number
  pageSize: number
  searchKey?: string
  startDateRange?: string
  endDateRange?: string
  friendsOnly?: boolean
  interactions?: boolean
  userId?: string
  sortOrder?: string
  groupId?: string
  approved?: boolean
}

export interface GraphQLVariables {
  limit: number
  offset: number
  searchKey: string
  startDateRange?: string
  endDateRange?: string
  friendsOnly: boolean
  interactions: boolean
  userId?: string
  sortOrder?: string
  groupId?: string
  approved?: boolean
}

export interface ExtractPaginationDataResult<T = unknown> {
  entities: T[]
  pagination: {
    total_count: number
    limit: number
    offset: number
  }
}

export interface UserLoginSuccessPayload {
  data: UserState['data']
  loading: boolean
  loginError: null
}

export interface UserLoginFailurePayload {
  loginError: string | null
  loading: boolean
}

export interface UserUpdateAvatarPayload {
  avatar: string
}

export interface UpdateFollowingPayload {
  _followingId: string
}

// ===== Types for SEO utilities =====
export interface SeoParams {
  page?: number
  pageSize?: number
  searchKey?: string
  sortOrder?: 'asc' | 'desc' | string
  friendsOnly?: boolean
  interactions?: boolean
  startDateRange?: string
  endDateRange?: string
  [key: string]: unknown
}

export interface PaginationUrlsResult {
  prevUrl: string | null
  nextUrl: string | null
}

export interface LocationLike {
  search: string
}

export interface PaginationStructuredDataItem {
  '@type': 'ListItem'
  position: number
  url: string
}

export interface PaginationStructuredData {
  '@context': 'https://schema.org'
  '@type': 'CollectionPage'
  mainEntity: {
    '@type': 'ItemList'
    numberOfItems: number
    itemListElement: PaginationStructuredDataItem[]
  }
}