import { parseSearchQuery } from '~/data/utils/parseSearchQuery';
import type { ParsedSearchQuery } from '~/types/search';

describe('parseSearchQuery', () => {
  // ── Happy path ──────────────────────────────────────────────────────────

  describe('plain text queries (no tokens)', () => {
    it('returns the full string as textQuery and keywords when no tokens are present', () => {
      const result: ParsedSearchQuery = parseSearchQuery('hello world');

      expect(result.keywords).toEqual(['hello', 'world']);
      expect(result.usernames).toEqual([]);
      expect(result.hashtags).toEqual([]);
      expect(result.textQuery).toBe('hello world');
      expect(result.tokens).toEqual([]);
    });

    it('trims leading and trailing whitespace from textQuery and keywords', () => {
      const result = parseSearchQuery('  spaced out  ');

      expect(result.keywords).toEqual(['spaced', 'out']);
      expect(result.textQuery).toBe('spaced out');
      expect(result.usernames).toEqual([]);
      expect(result.hashtags).toEqual([]);
    });

    it('treats a single word as a plain keyword search', () => {
      const result = parseSearchQuery('education');

      expect(result.keywords).toEqual(['education']);
      expect(result.usernames).toEqual([]);
      expect(result.hashtags).toEqual([]);
    });
  });

  // ── @username extraction ────────────────────────────────────────────────

  describe('@username extraction', () => {
    it('extracts a single @username', () => {
      const result = parseSearchQuery('@johndoe');

      expect(result.usernames).toEqual(['johndoe']);
      expect(result.keywords).toEqual([]);
      expect(result.textQuery).toBe('');
      expect(result.tokens).toEqual([{ type: 'username', value: 'johndoe' }]);
    });

    it('extracts @username and preserves remaining text as keywords', () => {
      const result = parseSearchQuery('@alice some text here');

      expect(result.usernames).toEqual(['alice']);
      expect(result.keywords).toEqual(['some', 'text', 'here']);
      expect(result.textQuery).toBe('some text here');
    });

    it('lowercases extracted usernames', () => {
      const result = parseSearchQuery('@JohnDoe');

      expect(result.usernames).toEqual(['johndoe']);
    });

    it('extracts multiple @usernames', () => {
      const result = parseSearchQuery('@alice @bob');

      expect(result.usernames).toEqual(['alice', 'bob']);
      expect(result.keywords).toEqual([]);
      expect(result.textQuery).toBe('');
    });

    it('deduplicates repeated @usernames', () => {
      const result = parseSearchQuery('@alice @Alice @ALICE');

      expect(result.usernames).toEqual(['alice']);
    });
  });

  // ── #hashtag extraction ─────────────────────────────────────────────────

  describe('#hashtag extraction', () => {
    it('extracts a single #hashtag', () => {
      const result = parseSearchQuery('#typescript');

      expect(result.hashtags).toEqual(['typescript']);
      expect(result.keywords).toEqual([]);
      expect(result.textQuery).toBe('');
      expect(result.tokens).toEqual([{ type: 'hashtag', value: 'typescript' }]);
    });

    it('extracts #hashtag and preserves remaining text as keywords', () => {
      const result = parseSearchQuery('#react some text here');

      expect(result.hashtags).toEqual(['react']);
      expect(result.keywords).toEqual(['some', 'text', 'here']);
      expect(result.textQuery).toBe('some text here');
    });

    it('lowercases extracted hashtags', () => {
      const result = parseSearchQuery('#TypeScript');

      expect(result.hashtags).toEqual(['typescript']);
    });

    it('extracts multiple #hashtags', () => {
      const result = parseSearchQuery('#react #nextjs');

      expect(result.hashtags).toEqual(['react', 'nextjs']);
      expect(result.keywords).toEqual([]);
      expect(result.textQuery).toBe('');
    });

    it('deduplicates repeated #hashtags', () => {
      const result = parseSearchQuery('#react #React #REACT');

      expect(result.hashtags).toEqual(['react']);
    });
  });

  // ── Mixed queries ───────────────────────────────────────────────────────

  describe('mixed token queries', () => {
    it('extracts both @username and #hashtag from the same query', () => {
      const result = parseSearchQuery('@alice #typescript');

      expect(result.usernames).toEqual(['alice']);
      expect(result.hashtags).toEqual(['typescript']);
      expect(result.keywords).toEqual([]);
      expect(result.textQuery).toBe('');
    });

    it('handles tokens interleaved with plain text', () => {
      const result = parseSearchQuery('posts by @alice about #react development');

      expect(result.usernames).toEqual(['alice']);
      expect(result.hashtags).toEqual(['react']);
      expect(result.keywords).toEqual(['posts', 'by', 'about', 'development']);
      expect(result.textQuery).toBe('posts by about development');
    });

    it('parses keywords, a username, and a hashtag all together (issue example)', () => {
      const result = parseSearchQuery('school safety @marta #education');

      expect(result.keywords).toEqual(['school', 'safety']);
      expect(result.usernames).toEqual(['marta']);
      expect(result.hashtags).toEqual(['education']);
    });

    it('preserves token order in the tokens array', () => {
      const result = parseSearchQuery('#react @alice #nextjs');

      expect(result.tokens).toEqual([
        { type: 'hashtag', value: 'react' },
        { type: 'username', value: 'alice' },
        { type: 'hashtag', value: 'nextjs' },
      ]);
    });

    it('preserves all extracted values regardless of token order', () => {
      const result = parseSearchQuery('#education @marta school safety');

      expect(result.keywords).toEqual(['school', 'safety']);
      expect(result.usernames).toEqual(['marta']);
      expect(result.hashtags).toEqual(['education']);
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns empty result for an empty string', () => {
      const result = parseSearchQuery('');

      expect(result.keywords).toEqual([]);
      expect(result.usernames).toEqual([]);
      expect(result.hashtags).toEqual([]);
      expect(result.textQuery).toBe('');
      expect(result.tokens).toEqual([]);
    });

    it('returns empty result for whitespace-only input', () => {
      const result = parseSearchQuery('   ');

      expect(result.keywords).toEqual([]);
      expect(result.usernames).toEqual([]);
      expect(result.hashtags).toEqual([]);
      expect(result.textQuery).toBe('');
    });

    it('collapses repeated internal whitespace without creating empty keyword tokens', () => {
      const result = parseSearchQuery('education    reform');

      expect(result.keywords).toEqual(['education', 'reform']);
      expect(result.textQuery).toBe('education reform');
    });

    it('ignores standalone @ without a following word', () => {
      const result = parseSearchQuery('@ hello');

      expect(result.usernames).toEqual([]);
      expect(result.textQuery).toBe('@ hello');
      expect(result.keywords).toEqual(['@', 'hello']);
    });

    it('ignores standalone # without a following word', () => {
      const result = parseSearchQuery('# hello');

      expect(result.usernames).toEqual([]);
      expect(result.hashtags).toEqual([]);
      expect(result.textQuery).toBe('# hello');
      expect(result.keywords).toEqual(['#', 'hello']);
    });

    it('does not crash when the entire query is a lone @', () => {
      const result = parseSearchQuery('@');

      expect(result.usernames).toEqual([]);
      expect(result.keywords).toEqual(['@']);
    });

    it('does not crash when the entire query is a lone #', () => {
      const result = parseSearchQuery('#');

      expect(result.hashtags).toEqual([]);
      expect(result.keywords).toEqual(['#']);
    });

    it('handles @ and # embedded in words (e.g. email addresses)', () => {
      const result = parseSearchQuery('user@example.com');

      // Mid-word @ should NOT be treated as a username token
      expect(result.usernames).toEqual([]);
      expect(result.textQuery).toBe('user@example.com');
      expect(result.keywords).toEqual(['user@example.com']);
    });

    it('handles tokens with underscores and digits', () => {
      const result = parseSearchQuery('@user_123 #tag_456');

      expect(result.usernames).toEqual(['user_123']);
      expect(result.hashtags).toEqual(['tag_456']);
    });

    it('handles tokens with hyphens by truncating at the hyphen', () => {
      const result = parseSearchQuery('@some-user');

      // \w does not include hyphens, so this should extract 'some' only
      expect(result.usernames).toEqual(['some']);
    });
  });
});