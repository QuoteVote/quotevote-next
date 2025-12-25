/**
 * Type definitions for custom hooks
 * All hook-related types are defined here following Migration Rules
 */

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Configuration options for usePagination hook
 */
export interface PaginationOptions {
  /** Default page number (default: 1) */
  defaultPage?: number
  /** Default page size (default: 20) */
  defaultPageSize?: number
  /** URL parameter name for page (default: 'page') */
  pageParam?: string
  /** URL parameter name for page size (default: 'page_size') */
  pageSizeParam?: string
  /** Callback when page changes */
  onPageChange?: (page: number) => void
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void
  /** Reset to page 1 when filters change (default: true) */
  resetOnFilterChange?: boolean
}

/**
 * Pagination calculation result
 */
export interface PaginationCalculation {
  /** Current page number (normalized) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total count of items */
  totalCount: number
  /** Items per page */
  pageSize: number
  /** Whether there is a next page */
  hasNextPage: boolean
  /** Whether there is a previous page */
  hasPreviousPage: boolean
  /** Start index for current page */
  startIndex: number
  /** End index for current page */
  endIndex: number
}

/**
 * Return type for usePagination hook
 */
export interface UsePaginationReturn {
  /** Current page number */
  currentPage: number
  /** Current page size */
  pageSize: number
  /** Handler to change page */
  handlePageChange: (page: number) => void
  /** Handler to change page size */
  handlePageSizeChange: (size: number) => void
  /** Reset to first page */
  resetToFirstPage: () => void
  /** Calculate pagination metadata */
  calculatePagination: (totalCount: number) => PaginationCalculation
  /** Legacy support - alias for handlePageChange */
  setCurrentPage: (page: number) => void
  /** Legacy support - alias for handlePageSizeChange */
  setPageSize: (size: number) => void
}

// ============================================================================
// Presence Heartbeat Types
// ============================================================================

/**
 * Return type for usePresenceHeartbeat hook
 */
export interface UsePresenceHeartbeatReturn {
  /** Apollo mutation error if heartbeat fails */
  error: Error | undefined
}

// ============================================================================
// Presence Subscription Types
// ============================================================================

/**
 * Presence data structure from subscription
 */
export interface PresenceData {
  /** User ID */
  userId: string
  /** Status (e.g., 'online', 'offline', 'away') */
  status: string
  /** Status message */
  statusMessage?: string
  /** Last seen timestamp (ISO string) */
  lastSeen?: string
}

/**
 * Presence subscription result
 */
export interface PresenceSubscriptionResult {
  /** Presence data from subscription */
  presence: PresenceData
}

// ============================================================================
// Responsive Types
// ============================================================================

/**
 * Tailwind breakpoint names
 */
export type ResponsiveBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Return type for useResponsive hook
 */
export interface UseResponsiveReturn {
  /** Current breakpoint */
  breakpoint: ResponsiveBreakpoint
  /** Whether screen is small (< 640px) */
  isSmallScreen: boolean
  /** Whether screen is medium (>= 768px) */
  isMediumScreen: boolean
  /** Whether screen is large (>= 1024px) */
  isLargeScreen: boolean
  /** Whether screen is extra large (>= 1280px) */
  isExtraLargeScreen: boolean
}

// ============================================================================
// Roster Management Types
// ============================================================================

/**
 * Roster mutation result (generic structure)
 */
export interface RosterMutationResult {
  /** Success status */
  success: boolean
  /** Result message */
  message?: string
  /** Additional data */
  [key: string]: unknown
}

/**
 * Return type for useRosterManagement hook
 */
export interface UseRosterManagementReturn {
  /** Add a buddy (send friend request) */
  addBuddy: (buddyId: string) => Promise<RosterMutationResult>
  /** Accept a buddy request */
  acceptBuddy: (rosterId: string) => Promise<RosterMutationResult>
  /** Decline a buddy request */
  declineBuddy: (rosterId: string) => Promise<RosterMutationResult>
  /** Block a buddy */
  blockBuddy: (buddyId: string) => Promise<RosterMutationResult>
  /** Unblock a buddy */
  unblockBuddy: (buddyId: string) => Promise<RosterMutationResult>
  /** Remove a buddy */
  removeBuddy: (buddyId: string) => Promise<RosterMutationResult>
}

// ============================================================================
// Typing Indicator Types
// ============================================================================

/**
 * Typing mutation variables
 */
export interface TypingMutationVariables {
  typing: {
    /** Message room ID */
    messageRoomId: string
    /** Whether user is typing */
    isTyping: boolean
  }
}

/**
 * Return type for useTypingIndicator hook
 */
export interface UseTypingIndicatorReturn {
  /** Handler to call when user starts typing */
  handleTyping: () => void
  /** Handler to call when user stops typing */
  stopTyping: () => void
}

// ============================================================================
// Message Subscription Types
// ============================================================================

/**
 * Message data structure from subscription
 */
export interface MessageSubscriptionData {
  /** Message ID */
  _id: string
  /** Message room ID */
  messageRoomId: string
  /** User ID who sent the message */
  userId: string
  /** User name */
  userName: string
  /** Message title */
  title?: string
  /** Message text */
  text: string
  /** Creation timestamp */
  created: string
  /** Message type */
  type?: string
  /** Mutation type */
  mutation_type?: string
}

/**
 * Message subscription result
 */
export interface MessageSubscriptionResult {
  /** Message data from subscription */
  message: MessageSubscriptionData
}

// ============================================================================
// Typing Subscription Types
// ============================================================================

/**
 * Typing event data structure from subscription
 */
export interface TypingEventData {
  /** Message room ID */
  messageRoomId: string
  /** User ID who is typing */
  userId: string
  /** User information */
  user?: {
    _id: string
    name?: string | null
    username?: string | null
  } | null
  /** Whether user is typing */
  isTyping: boolean
  /** Timestamp of typing event */
  timestamp: string
}

/**
 * Typing subscription result
 */
export interface TypingSubscriptionResult {
  /** Typing event data from subscription */
  typing: TypingEventData | null
}

// ============================================================================
// Notification Subscription Types
// ============================================================================

/**
 * Notification data structure from subscription
 */
export interface NotificationSubscriptionData {
  /** Notification ID */
  _id: string
  /** User ID who receives the notification */
  userId: string
  /** User ID who triggered the notification */
  userIdBy: string
  /** User information who triggered the notification */
  userBy?: {
    name?: string | null
    avatar?: string | null
  } | null
  /** Notification label */
  label?: string
  /** Notification status */
  status?: string
  /** Creation timestamp */
  created: string
  /** Notification type */
  notificationType: string
  /** Related post (if applicable) */
  post?: {
    _id: string
    url?: string
  } | null
}

/**
 * Notification subscription result
 */
export interface NotificationSubscriptionResult {
  /** Notification data from subscription */
  notification: NotificationSubscriptionData
}

// ============================================================================
// Roster Subscription Types
// ============================================================================

/**
 * Roster entry data structure from subscription
 */
export interface RosterEntryData {
  /** Roster entry ID */
  _id: string
  /** User ID */
  userId: string
  /** Buddy ID */
  buddyId: string
  /** Roster status */
  status: string
  /** Who initiated the relationship */
  initiatedBy: string
  /** Creation timestamp */
  created: string
  /** Last update timestamp */
  updated: string
  /** Buddy information */
  buddy?: {
    _id: string
    name?: string | null
    username?: string | null
    avatar?: string | null
  } | null
}

/**
 * Roster subscription result
 */
export interface RosterSubscriptionResult {
  /** Roster entry data from subscription */
  roster: RosterEntryData
}
