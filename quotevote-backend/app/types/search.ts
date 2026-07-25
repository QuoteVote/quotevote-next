/**
 * Search Query Types
 *
 * Types for parsing and representing structured search queries
 * that support @username and #hashtag token extraction.
 */

// ============================================================================
// Token Types
// ============================================================================

/** A parsed @username token extracted from a search query */
export interface UsernameToken {
  readonly type: 'username';
  readonly value: string;
}

/** A parsed #hashtag token extracted from a search query */
export interface HashtagToken {
  readonly type: 'hashtag';
  readonly value: string;
}

/** Discriminated union of all special search tokens */
export type SearchToken = UsernameToken | HashtagToken;

// ============================================================================
// Parsed Query Result
// ============================================================================

/**
 * The result of parsing a raw search query string.
 *
 * - `usernames`  — extracted @username tokens (lowercased, without the @ prefix)
 * - `keywords`   — plain-text keyword tokens, in the order they appeared in the query
 * - `hashtags`   — extracted #hashtag tokens (lowercased, without the # prefix)
 * - `textQuery`  — the remaining plain-text portion after token extraction (trimmed)
 * - `tokens`     — ordered list of all extracted tokens for debugging/logging
 */
export interface ParsedSearchQuery {
  readonly keywords: readonly string[];
  readonly usernames: readonly string[];
  readonly hashtags: readonly string[];
  readonly textQuery: string;
  readonly tokens: readonly SearchToken[];
}
