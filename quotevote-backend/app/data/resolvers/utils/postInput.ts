import { GraphQLError } from 'graphql';

/** Matches frontend `ATTRIBUTION_MAX_LENGTH` / legacy addPost limit. */
export const ATTRIBUTION_MAX_LENGTH = 120;

/** Emoji ranges blocked in citation URLs (same as frontend sanitizeUrl). */
export const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u;

/** RFC 3986 allowlist inverted — characters outside this set are rejected. */
export const INVALID_URL_CHARS_REGEX = /[^a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]/;

/**
 * True when text contains a link (http/https/ftp/www). Fresh regex each call
 * so the global flag cannot leak state between checks.
 */
export function containsUrl(text: string): boolean {
  const urlPattern = /(?:https?:\/\/|ftp:\/\/|www\.)[^\s/$.?#].[^\s]*/i;
  return urlPattern.test(text);
}

/**
 * Validate a citation URL. Returns the normalized href, or null if invalid.
 * Allows only http/https/ftp with a real hostname; blocks javascript:/data: etc.
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  if (EMOJI_REGEX.test(trimmedUrl)) return null;
  if (INVALID_URL_CHARS_REGEX.test(trimmedUrl)) return null;

  try {
    const parsed = new URL(trimmedUrl);
    if (!['http:', 'https:', 'ftp:'].includes(parsed.protocol)) return null;
    if (!parsed.hostname || parsed.hostname.length < 3) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export interface AddPostContentInput {
  text: string;
  citationUrl?: string | null;
  attribution?: string | null;
}

export interface ValidatedAddPostContent {
  text: string;
  citationUrl?: string;
  attribution?: string;
}

/**
 * Legacy addPost input checks: no links in the body, safe citation URL, and
 * attribution at most 120 characters. Call before creating the post.
 */
export function validateAddPostContent(input: AddPostContentInput): ValidatedAddPostContent {
  const text = input.text.trim();

  if (containsUrl(text)) {
    throw new GraphQLError('Post body cannot contain links. Please use the Citation field.', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const rawCitation = input.citationUrl?.trim() ?? '';
  let citationUrl: string | undefined;
  if (rawCitation) {
    const sanitized = sanitizeUrl(rawCitation);
    if (!sanitized) {
      throw new GraphQLError('Invalid citation URL. Please enter a valid http, https, or ftp URL.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    citationUrl = sanitized;
  }

  const rawAttribution = input.attribution?.trim() ?? '';
  if (rawAttribution.length > ATTRIBUTION_MAX_LENGTH) {
    throw new GraphQLError(
      `Attribution should be less than ${ATTRIBUTION_MAX_LENGTH} characters`,
      { extensions: { code: 'BAD_USER_INPUT' } }
    );
  }

  return {
    text,
    citationUrl,
    attribution: rawAttribution || undefined,
  };
}
