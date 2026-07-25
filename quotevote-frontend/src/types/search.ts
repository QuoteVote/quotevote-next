/**
 * Search Query Types (Frontend)
 *
 * Lightweight types for parsing search queries on the client side.
 * Used primarily for rendering context-aware empty states.
 */

/** The result of parsing a raw search query string on the frontend */
export interface ParsedSearchQuery {
  readonly keywords: readonly string[]
  readonly usernames: readonly string[]
  readonly hashtags: readonly string[]
  readonly textQuery: string
}
