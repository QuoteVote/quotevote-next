/**
 * Search Query Types (Frontend)
 *
 * Lightweight types for parsing search queries on the client side.
 * Used primarily for rendering context-aware empty states.
 */

/** The result of parsing a raw search query string on the frontend */
export interface ParsedSearchQuery {
  /** Plain-text keyword tokens, in the order they appeared in the query. Tokens made up entirely of punctuation (e.g. a lone `@` or `#`) are excluded. */
  readonly keywords: readonly string[]
  readonly usernames: readonly string[]
  readonly hashtags: readonly string[]
  /** The remaining plain-text portion after token extraction (trimmed) — kept for backwards compatibility. Unlike `keywords`, this retains punctuation-only tokens verbatim. */
  readonly textQuery: string
}