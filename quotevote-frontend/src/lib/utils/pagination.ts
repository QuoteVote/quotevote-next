import {
  PageToOffsetResult,
  OffsetToPageResult,
  PaginationMeta,
  NormalizePaginationParamsInput,
  NormalizePaginationParamsOutput,
  GraphQLVariableParams,
  GraphQLVariables,
  ExtractPaginationDataResult,
} from "@/types/store"
/**
 * Utility functions for pagination
 */

/**
 * Convert page-based pagination to offset-based pagination
 * @param {number} page - Current page (1-based)
 * @param {number} pageSize - Number of items per page
 * @returns {Object} Object with limit and offset
 */
export const pageToOffset = (page: number, pageSize: number): PageToOffsetResult => {
  const limit = pageSize
  const offset = (page - 1) * pageSize
  return { limit, offset }
}

/**
 * Convert offset-based pagination to page-based pagination
 * @param {number} offset - Current offset
 * @param {number} limit - Number of items per page
 * @returns {Object} Object with page and pageSize
 */
export const offsetToPage = (offset: number, limit: number): OffsetToPageResult => {
  const page = Math.floor(offset / limit) + 1
  const pageSize = limit
  return { page, pageSize }
}

/**
 * Calculate pagination metadata
 * @param {number} totalCount - Total number of items
 * @param {number} page - Current page (1-based)
 * @param {number} pageSize - Number of items per page
 * @returns {Object} Pagination metadata
 */
export const calculatePagination = (totalCount: number, page: number, pageSize: number): PaginationMeta => {
  const totalPages = Math.ceil(totalCount / pageSize)
  const normalizedPage = Math.min(Math.max(page, 1), totalPages || 1)

  return {
    currentPage: normalizedPage,
    totalPages: Math.max(totalPages, 1),
    totalCount,
    pageSize,
    hasNextPage: normalizedPage < totalPages,
    hasPreviousPage: normalizedPage > 1,
    startIndex: (normalizedPage - 1) * pageSize,
    endIndex: Math.min(normalizedPage * pageSize, totalCount),
  }
}

/**
 * Generate page numbers for pagination display
 * @param {number} currentPage - Current page
 * @param {number} totalPages - Total number of pages
 * @param {number} maxVisible - Maximum number of visible pages
 * @returns {Array} Array of page numbers to display
 */
export const generatePageNumbers = (currentPage: number, totalPages: number, maxVisible: number = 5): number[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, currentPage - half)
  const end = Math.min(totalPages, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
}

/**
 * Validate and normalize pagination parameters
 * @param {Object} params - Pagination parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Page size
 * @param {number} params.totalCount - Total count
 * @returns {Object} Normalized pagination parameters
 */
export const normalizePaginationParams = ({ page, pageSize, totalCount }: NormalizePaginationParamsInput): NormalizePaginationParamsOutput => {
  const normalizedPage = Math.max(1, Math.floor(page) || 1)
  const normalizedPageSize = Math.max(1, Math.min(100, Math.floor(pageSize) || 20))
  const normalizedTotalCount = Math.max(0, Math.floor(totalCount) || 0)

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalCount: normalizedTotalCount,
  }
}

/**
 * Create GraphQL variables for paginated queries
 * @param {Object} params - Pagination and filter parameters
 * @returns {Object} GraphQL variables
 */
export const createGraphQLVariables = (params: GraphQLVariableParams): GraphQLVariables => {
  const {
    page,
    pageSize,
    searchKey = '',
    startDateRange,
    endDateRange,
    friendsOnly = false,
    interactions = false,
    userId,
    sortOrder,
    groupId,
    approved,
  } = params

  const { limit, offset } = pageToOffset(page, pageSize)

  return {
    limit,
    offset,
    searchKey,
    startDateRange,
    endDateRange,
    friendsOnly,
    interactions,
    userId,
    sortOrder,
    groupId,
    approved,
  }
}

/**
 * Extract pagination data from GraphQL response
 * @param {Object} data - GraphQL response data
 * @param {string} entityName - Name of the entity (e.g., 'posts', 'activities')
 * @returns {Object} Pagination data
 */
export const extractPaginationData = <T = unknown>(data: Record<string, unknown>, entityName: string): ExtractPaginationDataResult<T> => {
  if (!data || !data[entityName]) {
    return {
      entities: [],
      pagination: {
        total_count: 0,
        limit: 0,
        offset: 0,
      },
    }
  }

  const { entities, pagination } = data[entityName] as {
    entities?: T[]
    pagination?: { total_count?: number; limit?: number; offset?: number }
  }

  return {
    entities: entities ?? [],
    pagination: {
      total_count: pagination?.total_count ?? 0,
      limit: pagination?.limit ?? 0,
      offset: pagination?.offset ?? 0,
    },
  }
}

export default {
  pageToOffset,
  offsetToPage,
  calculatePagination,
  generatePageNumbers,
  normalizePaginationParams,
  createGraphQLVariables,
  extractPaginationData,
}
