import type { ParsedSearchQuery, SearchToken } from '~/types/search';

const USERNAME_PATTERN = /(?:^|\s)@(\w+)/g;
const HASHTAG_PATTERN = /(?:^|\s)#(\w+)/g;

/**
 * Parse a raw search query string and extract @username / #hashtag tokens.
 */
export function parseSearchQuery(raw: string): ParsedSearchQuery {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { keywords: [], usernames: [], hashtags: [], textQuery: '', tokens: [] };
  }

  const usernames = new Set<string>();
  const hashtags = new Set<string>();
  const tokenSpans: { start: number; end: number }[] = [];
  const orderedTokens: { pos: number; token: SearchToken }[] = [];

  let match: RegExpExecArray | null;

  USERNAME_PATTERN.lastIndex = 0;
  while ((match = USERNAME_PATTERN.exec(trimmed)) !== null) {
    const value = match[1].toLowerCase();
    const pos = match.index + match[0].indexOf('@');
    usernames.add(value);
    tokenSpans.push({ start: pos, end: pos + match[1].length + 1 });
    orderedTokens.push({ pos, token: { type: 'username', value } });
  }

  HASHTAG_PATTERN.lastIndex = 0;
  while ((match = HASHTAG_PATTERN.exec(trimmed)) !== null) {
    const value = match[1].toLowerCase();
    const pos = match.index + match[0].indexOf('#');
    hashtags.add(value);
    tokenSpans.push({ start: pos, end: pos + match[1].length + 1 });
    orderedTokens.push({ pos, token: { type: 'hashtag', value } });
  }

  tokenSpans.sort((a, b) => a.start - b.start);
  orderedTokens.sort((a, b) => a.pos - b.pos);

  let textQuery = trimmed;
  for (let i = tokenSpans.length - 1; i >= 0; i--) {
    const span = tokenSpans[i];
    textQuery = textQuery.slice(0, span.start) + textQuery.slice(span.end);
  }
  textQuery = textQuery.replace(/\s{2,}/g, ' ').trim();

  const keywords = textQuery.length > 0
    ? textQuery.split(' ').filter((word) => /\w/.test(word))
    : [];

  return {
    keywords,
    usernames: Array.from(usernames),
    hashtags: Array.from(hashtags),
    textQuery,
    tokens: orderedTokens.map((t) => t.token),
  };
}