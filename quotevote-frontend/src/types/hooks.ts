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
 * Presence data structure
 */
export interface PresenceData {
  /** User ID */
  userId: string
  /** Online status */
  isOnline: boolean
  /** Last seen timestamp */
  lastSeen?: string
  /** Additional presence metadata */
  [key: string]: unknown
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
