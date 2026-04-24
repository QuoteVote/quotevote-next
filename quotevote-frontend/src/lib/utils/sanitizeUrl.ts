/**
 * URL validation and sanitization utilities for citation links
 * 
 * @description
 * Provides strict URL validation using:
 * - Native URL constructor for parsing
 * - Emoji detection regex
 * - RFC 3986 character allowlist
 * - Protocol blocking (javascript:, data:, file:)
 */

/**
 * Regex to detect emojis in URLs (not allowed)
 */
export const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u

/**
 * Regex to detect invalid URL characters (RFC 3986 allowlist inverted)
 */
export const INVALID_URL_CHARS_REGEX = /[^a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]/

/**
 * Helper to check if text contains a URL
 * Creates a new RegExp instance each call to avoid global flag state issues
 * 
 * @param text - The text to check for URLs
 * @returns true if the text contains a URL
 */
export const containsUrl = (text: string): boolean => {
  // Using a fresh regex instance each time to avoid global flag state issues
  // Matches backend's URL_REGEX: handles http, https, ftp, www
  const urlPattern = /(?:https?:\/\/|ftp:\/\/|www\.)[^\s/$.?#].[^\s]*/i
  return urlPattern.test(text)
}

/**
 * Validate and sanitize a URL for use as a citation link
 * 
 * @param url - The URL string to validate
 * @returns The normalized URL if valid, null if invalid
 * 
 * @example
 * sanitizeUrl('https://example.com') // 'https://example.com/'
 * sanitizeUrl('javascript:alert(1)') // null
 * sanitizeUrl('https://example.com/path?q=test') // 'https://example.com/path?q=test'
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url) return null

  const trimmedUrl = url.trim()

  // Block emojis
  if (EMOJI_REGEX.test(trimmedUrl)) return null

  // Block invalid characters
  if (INVALID_URL_CHARS_REGEX.test(trimmedUrl)) return null

  try {
    const parsed = new URL(trimmedUrl)

    // Only allow http, https, and ftp protocols (matches backend)
    if (!['http:', 'https:', 'ftp:'].includes(parsed.protocol)) return null

    // Require valid hostname
    if (!parsed.hostname || parsed.hostname.length < 3) return null

    return parsed.href
  } catch {
    return null
  }
}

/**
 * Normalise a backend post URL to the Next.js app route.
 *
 * The backend stores post URLs as `/post/<group>/<title>/<id>` (monorepo
 * format).  The Next.js app routes them under `/dashboard/post/...`, so
 * every client-side navigation and every copy-link must use this helper.
 *
 * @example
 * toAppPostUrl('/post/general/some-title/abc123')
 * // '/dashboard/post/general/some-title/abc123'
 */
export const toAppPostUrl = (url: string): string => {
  const clean = url.replace(/\?/g, '')
  return clean.startsWith('/post/') ? `/dashboard${clean}` : clean
}

/**
 * Extract domain name from a URL for display
 * 
 * @param url - The URL to extract domain from
 * @returns The domain name without 'www.' prefix, or the original URL if parsing fails
 * 
 * @example
 * getDomain('https://www.example.com/path') // 'example.com'
 * getDomain('https://blog.example.com') // 'blog.example.com'
 */
export const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
