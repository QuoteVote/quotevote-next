/**
 * Pagination Type Definitions
 * Defines all types used by pagination utilities
 */

/**
 * Result of page to offset conversion
 */
export interface PageToOffsetResult {
  limit: number;
  offset: number;
}

/**
 * Result of offset to page conversion
 */
export interface OffsetToPageResult {
  page: number;
  pageSize: number;
}

/**
 * Comprehensive pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

/**
 * Input for normalizing pagination parameters
 */
export interface NormalizePaginationParamsInput {
  page: number | string;
  pageSize: number | string;
  totalCount: number | string;
}

/**
 * Output of normalized pagination parameters
 */
export interface NormalizePaginationParamsOutput {
  page: number;
  pageSize: number;
  totalCount: number;
}

/**
 * GraphQL variable parameters for pagination and filtering
 */
export interface GraphQLVariableParams {
  page?: number | string;
  pageSize?: number | string;
  searchKey?: string;
  startDateRange?: string;
  endDateRange?: string;
  friendsOnly?: boolean;
  interactions?: boolean;
  userId?: string;
  sortOrder?: string;
  groupId?: string;
  approved?: number;
}

/**
 * GraphQL variables for queries
 */
export interface GraphQLVariables {
  limit: number;
  offset: number;
  searchKey?: string;
  startDateRange?: string;
  endDateRange?: string;
  friendsOnly?: boolean;
  interactions?: boolean;
  userId?: string;
  sortOrder?: string;
  groupId?: string;
  approved?: number;
}

/**
 * Simplified pagination info from GraphQL response
 */
export interface SimplifiedPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
}

/**
 * Result of extracting pagination data
 */
export interface ExtractPaginationDataResult<T = unknown> {
  data: T[];
  pagination: SimplifiedPagination;
}

/**
 * Raw pagination data from GraphQL response
 */
export interface GraphQLPaginationResponse {
  total_count?: number;
  limit?: number;
  offset?: number;
}

/**
 * GraphQL entity response structure
 */
export interface GraphQLEntityResponse<T = unknown> {
  entities?: T[];
  pagination?: GraphQLPaginationResponse;
}

/**
 * Pagination hook options
 */
export interface PaginationOptions {
  defaultPageSize: number;
  pageParam: string;
  pageSizeParam: string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

/**
 * Pagination state returned by hook
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}
