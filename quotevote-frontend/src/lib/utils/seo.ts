/**
 * SEO utility functions for pagination and meta tags
 */
import {
  SeoParams,
  PaginationUrlsResult,
  LocationLike,
  PaginationStructuredData,
} from '@/types/store'

/**
 * Generate canonical URL for paginated content
 * @param {string} baseUrl - Base URL without query parameters
 * @param {Object} params - URL parameters
 * @param {number} params.page - Current page number
 * @param {number} params.pageSize - Page size
 * @param {string} params.searchKey - Search query
 * @param {string} params.sortOrder - Sort order
 * @param {boolean} params.friendsOnly - Friends only filter
 * @param {boolean} params.interactions - Interactions filter
 * @param {string} params.startDateRange - Start date filter
 * @param {string} params.endDateRange - End date filter
 * @returns {string} Canonical URL
 */
export const generateCanonicalUrl = (baseUrl: string, params: SeoParams = {}): string => {
  const {
    page,
    pageSize,
    searchKey,
    sortOrder,
    friendsOnly,
    interactions,
    startDateRange,
    endDateRange,
    ...otherParams
  } = params

  const urlParams = new URLSearchParams()

  // Add pagination parameters (always include page if provided)
  if (typeof page === 'number') {
    urlParams.set('page', page.toString())
  }
  if (pageSize && pageSize !== 20) {
    urlParams.set('page_size', pageSize.toString())
  }

  // Add search parameters
  if (searchKey && searchKey.trim()) {
    urlParams.set('q', searchKey.trim())
  }

  // Add filter parameters
  if (sortOrder && sortOrder !== 'desc') {
    urlParams.set('sort', sortOrder)
  }
  if (friendsOnly) {
    urlParams.set('friends', 'true')
  }
  if (interactions) {
    urlParams.set('interactions', 'true')
  }
  if (startDateRange && typeof startDateRange === 'string') {
    urlParams.set('start_date', startDateRange)
  }
  if (endDateRange && typeof endDateRange === 'string') {
    urlParams.set('end_date', endDateRange)
  }

  // Add other parameters
  Object.entries(otherParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlParams.set(key, String(value))
    }
  })

  const queryString = urlParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Generate pagination URLs (prev/next)
 * @param {string} baseUrl - Base URL without query parameters
 * @param {Object} params - Current URL parameters
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @returns {Object} Object with prevUrl and nextUrl
 */
export const generatePaginationUrls = (
  baseUrl: string,
  params: SeoParams,
  currentPage: number,
  _totalPages: number,
): PaginationUrlsResult => {
  const prevUrl = currentPage > 1
    ? generateCanonicalUrl(baseUrl, { ...params, page: currentPage - 1 })
    : null

  const nextUrl = currentPage < _totalPages
    ? generateCanonicalUrl(baseUrl, { ...params, page: currentPage + 1 })
    : null

  return { 
    prevUrl: prevUrl || undefined,
    nextUrl: nextUrl || undefined,
  }
}

/**
 * Generate page title for paginated content
 * @param {string} baseTitle - Base page title
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {string} searchKey - Search query
 * @returns {string} Page title
 */
export const generatePageTitle = (
  baseTitle: string,
  currentPage: number,
  _totalPages: number,
  searchKey?: string,
): string => {
  let title = baseTitle

  if (searchKey && searchKey.trim()) {
    title = `"${searchKey.trim()}" - ${title}`
  }

  if (currentPage > 1) {
    title = `${title} - Page ${currentPage}`
  }

  return title
}

/**
 * Generate page description for paginated content
 * @param {string} baseDescription - Base page description
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {string} searchKey - Search query
 * @param {number} totalCount - Total number of items
 * @param {number} pageSize - Page size
 * @returns {string} Page description
 */
export const generatePageDescription = (
  baseDescription: string,
  currentPage: number,
  totalPages: number,
  searchKey: string | undefined,
  totalCount: number,
  pageSize: number,
): string => {
  let description = baseDescription

  if (searchKey && searchKey.trim()) {
    description = `Search results for "${searchKey.trim()}" - ${description}`
  }

  if (totalCount > 0) {
    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalCount)
    description = `${description} Showing ${startItem}-${endItem} of ${totalCount} results.`
  }

  if (currentPage > 1) {
    description = `${description} Page ${currentPage} of ${totalPages}.`
  }

  return description
}

/**
 * Extract URL parameters for SEO
 * @param {Object} location - Location-like object with pathname and search properties (compatible with Next.js)
 * @returns {Object} Extracted parameters
 */
export const extractUrlParams = (location: LocationLike): SeoParams => {
  const params = new URLSearchParams(location.search)

  return {
    page: parseInt(params.get('page') ?? '', 10) || 1,
    pageSize: parseInt(params.get('page_size') ?? '', 10) || 20,
    searchKey: params.get('q') || '',
    sortOrder: params.get('sort') || 'desc',
    friendsOnly: params.get('friends') === 'true',
    interactions: params.get('interactions') === 'true',
    startDateRange: params.get('start_date') || '',
    endDateRange: params.get('end_date') || '',
  }
}

/**
 * Generate structured data for pagination
 * @param {string} baseUrl - Base URL
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @returns {Object} Structured data object
 */
export const generatePaginationStructuredData = (
  baseUrl: string,
  // currentPage: number,
  totalPages: number,
): PaginationStructuredData | null => {
  if (totalPages <= 1) return null

  const items: unknown[] = []

  for (let i = 1; i <= totalPages; i++) {
    items.push({
      '@type': 'ListItem',
      position: i,
      url: generateCanonicalUrl(baseUrl, { page: i }),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalPages,
      itemListElement: items,
    },
  }
}

export default {
  generateCanonicalUrl,
  generatePaginationUrls,
  generatePageTitle,
  generatePageDescription,
  extractUrlParams,
  generatePaginationStructuredData,
}
