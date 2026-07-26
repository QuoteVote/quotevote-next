import { parseSearchQuery } from '@/utils/parseSearchQuery'

describe('parseSearchQuery (Frontend)', () => {
  // ── Plain keyword queries ────────────────────────────────────────────────

  describe('plain keyword queries', () => {
    it('treats a single word as a keyword search', () => {
      const result = parseSearchQuery('education')
      expect(result.keywords).toEqual(['education'])
      expect(result.usernames).toEqual([])
      expect(result.hashtags).toEqual([])
      expect(result.textQuery).toBe('education')
    })

    it('treats multiple words as keyword search when no tokens exist', () => {
      const result = parseSearchQuery('hello world')
      expect(result.keywords).toEqual(['hello', 'world'])
      expect(result.usernames).toEqual([])
      expect(result.hashtags).toEqual([])
      expect(result.textQuery).toBe('hello world')
    })
  })

  // ── @username queries ────────────────────────────────────────────────────

  describe('@username queries', () => {
    it('treats @username as a username filter', () => {
      const result = parseSearchQuery('@marta')
      expect(result.usernames).toEqual(['marta'])
      expect(result.keywords).toEqual([])
      expect(result.textQuery).toBe('')
    })

    it('normalizes username casing to lowercase', () => {
      const result = parseSearchQuery('@Marta')
      expect(result.usernames).toEqual(['marta'])
    })

    it('extracts multiple usernames', () => {
      const result = parseSearchQuery('@alice @bob')
      expect(result.usernames).toEqual(['alice', 'bob'])
      expect(result.keywords).toEqual([])
    })

    it('deduplicates repeated usernames regardless of case', () => {
      const result = parseSearchQuery('@alice @Alice @ALICE')
      expect(result.usernames).toEqual(['alice'])
    })

    it('truncates usernames with hyphens at the hyphen (word-char rule)', () => {
      const result = parseSearchQuery('@marta-smith')
      expect(result.usernames).toEqual(['marta'])
    })

    it('supports underscores in usernames', () => {
      const result = parseSearchQuery('@marta_smith')
      expect(result.usernames).toEqual(['marta_smith'])
    })

    it('does not crash on a standalone @ with nothing following, and excludes it from keywords', () => {
      const result = parseSearchQuery('@')
      expect(result.usernames).toEqual([])
      expect(result.keywords).toEqual([])
      expect(result.textQuery).toBe('@')
    })

    it('does not crash on a standalone @ followed by whitespace, and excludes it from keywords', () => {
      const result = parseSearchQuery('@ hello')
      expect(result.usernames).toEqual([])
      expect(result.keywords).toEqual(['hello'])
      expect(result.textQuery).toBe('@ hello')
    })
  })

  // ── #hashtag queries ─────────────────────────────────────────────────────

  describe('#hashtag queries', () => {
    it('treats #hashtag as a hashtag filter', () => {
      const result = parseSearchQuery('#schools')
      expect(result.hashtags).toEqual(['schools'])
      expect(result.keywords).toEqual([])
      expect(result.textQuery).toBe('')
    })

    it('normalizes hashtag casing to lowercase', () => {
      const result = parseSearchQuery('#Education')
      expect(result.hashtags).toEqual(['education'])
    })

    it('extracts multiple hashtags', () => {
      const result = parseSearchQuery('#nyc #reactconf')
      expect(result.hashtags).toEqual(['nyc', 'reactconf'])
      expect(result.keywords).toEqual([])
    })

    it('deduplicates repeated hashtags regardless of case', () => {
      const result = parseSearchQuery('#react #React #REACT')
      expect(result.hashtags).toEqual(['react'])
    })

    it('truncates hashtags with hyphens at the hyphen (word-char rule)', () => {
      const result = parseSearchQuery('#school-safety')
      expect(result.hashtags).toEqual(['school'])
    })

    it('supports underscores in hashtags', () => {
      const result = parseSearchQuery('#school_safety')
      expect(result.hashtags).toEqual(['school_safety'])
    })

    it('does not crash on a standalone # with nothing following, and excludes it from keywords', () => {
      const result = parseSearchQuery('#')
      expect(result.hashtags).toEqual([])
      expect(result.keywords).toEqual([])
      expect(result.textQuery).toBe('#')
    })

    it('does not crash on a standalone # followed by whitespace, and excludes it from keywords', () => {
      const result = parseSearchQuery('# hello')
      expect(result.hashtags).toEqual([])
      expect(result.keywords).toEqual(['hello'])
      expect(result.textQuery).toBe('# hello')
    })
  })

  // ── Mixed queries ────────────────────────────────────────────────────────

  describe('mixed queries', () => {
    it('scopes a keyword search to a username', () => {
      const result = parseSearchQuery('education @marta')
      expect(result.keywords).toEqual(['education'])
      expect(result.usernames).toEqual(['marta'])
      expect(result.hashtags).toEqual([])
    })

    it('scopes a keyword search to a hashtag', () => {
      const result = parseSearchQuery('education #schools')
      expect(result.keywords).toEqual(['education'])
      expect(result.hashtags).toEqual(['schools'])
      expect(result.usernames).toEqual([])
    })

    it('parses both a username and a hashtag filter together', () => {
      const result = parseSearchQuery('@marta #schools')
      expect(result.usernames).toEqual(['marta'])
      expect(result.hashtags).toEqual(['schools'])
      expect(result.keywords).toEqual([])
    })

    it('parses keywords, a username, and a hashtag all together', () => {
      const result = parseSearchQuery('school safety @marta #education')
      expect(result.keywords).toEqual(['school', 'safety'])
      expect(result.usernames).toEqual(['marta'])
      expect(result.hashtags).toEqual(['education'])
    })

    it('preserves all values regardless of token order', () => {
      const result = parseSearchQuery('#education @marta school safety')
      expect(result.keywords).toEqual(['school', 'safety'])
      expect(result.usernames).toEqual(['marta'])
      expect(result.hashtags).toEqual(['education'])
    })
  })

  // ── Empty / whitespace-only queries ──────────────────────────────────────

  describe('empty and whitespace-only queries', () => {
    it('returns empty arrays for an empty string', () => {
      const result = parseSearchQuery('')
      expect(result.keywords).toEqual([])
      expect(result.usernames).toEqual([])
      expect(result.hashtags).toEqual([])
      expect(result.textQuery).toBe('')
    })

    it('returns empty arrays for a whitespace-only string', () => {
      const result = parseSearchQuery('   ')
      expect(result.keywords).toEqual([])
      expect(result.usernames).toEqual([])
      expect(result.hashtags).toEqual([])
      expect(result.textQuery).toBe('')
    })
  })

  // ── Whitespace handling ──────────────────────────────────────────────────

  describe('whitespace handling', () => {
    it('ignores leading and trailing whitespace', () => {
      const result = parseSearchQuery('  education reform  ')
      expect(result.keywords).toEqual(['education', 'reform'])
      expect(result.textQuery).toBe('education reform')
    })

    it('collapses repeated internal whitespace without creating empty tokens', () => {
      const result = parseSearchQuery('education    reform')
      expect(result.keywords).toEqual(['education', 'reform'])
      expect(result.textQuery).toBe('education reform')
    })
  })

  // ── Punctuation-only tokens ──────────────────────────────────────────────

  describe('punctuation-only tokens', () => {
    it('excludes a lone @ from keywords but keeps it in textQuery', () => {
      const result = parseSearchQuery('@')
      expect(result.keywords).toEqual([])
      expect(result.textQuery).toBe('@')
    })

    it('excludes a lone # from keywords but keeps it in textQuery', () => {
      const result = parseSearchQuery('#')
      expect(result.keywords).toEqual([])
      expect(result.textQuery).toBe('#')
    })

    it('excludes multiple punctuation-only tokens from keywords', () => {
      const result = parseSearchQuery('@ # !!!')
      expect(result.keywords).toEqual([])
      expect(result.textQuery).toBe('@ # !!!')
    })

    it('keeps a word containing punctuation, such as an email address', () => {
      const result = parseSearchQuery('user@example.com')
      expect(result.keywords).toEqual(['user@example.com'])
      expect(result.usernames).toEqual([])
    })

    it('keeps punctuation-only tokens interspersed with real keywords, filtering only the former', () => {
      const result = parseSearchQuery('hello @ world # !!!')
      expect(result.keywords).toEqual(['hello', 'world'])
    })
  })
})