/**
 * Tests for URL validation and sanitization utilities
 */
import { sanitizeUrl, containsUrl, getDomain, EMOJI_REGEX, INVALID_URL_CHARS_REGEX } from '@/lib/utils/sanitizeUrl'

describe('sanitizeUrl', () => {
  describe('valid URLs', () => {
    it('accepts valid http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/')
      expect(sanitizeUrl('http://example.com/path')).toBe('http://example.com/path')
    })

    it('accepts valid https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/')
      expect(sanitizeUrl('https://example.com/path?q=test')).toBe('https://example.com/path?q=test')
    })

    it('accepts URLs with subdomains', () => {
      expect(sanitizeUrl('https://blog.example.com')).toBe('https://blog.example.com/')
      expect(sanitizeUrl('https://www.example.com')).toBe('https://www.example.com/')
    })

    it('accepts URLs with query parameters', () => {
      expect(sanitizeUrl('https://example.com?foo=bar')).toBe('https://example.com/?foo=bar')
      expect(sanitizeUrl('https://example.com/path?a=1&b=2')).toBe('https://example.com/path?a=1&b=2')
    })

    it('accepts URLs with fragments', () => {
      expect(sanitizeUrl('https://example.com#section')).toBe('https://example.com/#section')
      expect(sanitizeUrl('https://example.com/page#anchor')).toBe('https://example.com/page#anchor')
    })

    it('trims whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com/')
    })
  })

  describe('invalid URLs', () => {
    it('rejects empty input', () => {
      expect(sanitizeUrl('')).toBeNull()
      expect(sanitizeUrl(null as unknown as string)).toBeNull()
      expect(sanitizeUrl(undefined as unknown as string)).toBeNull()
    })

    it('rejects javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
    })

    it('rejects data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    })

    it('rejects file: protocol', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull()
    })

    it('allows ftp: protocol (matches backend)', () => {
      expect(sanitizeUrl('ftp://ftp.example.com')).toBe('ftp://ftp.example.com/')
    })

    it('rejects URLs with emojis', () => {
      expect(sanitizeUrl('https://example.com/😀')).toBeNull()
      expect(sanitizeUrl('https://🔥.com')).toBeNull()
    })

    it('rejects URLs with invalid characters', () => {
      expect(sanitizeUrl('https://example.com/path with spaces')).toBeNull()
      expect(sanitizeUrl('https://example.com/<script>')).toBeNull()
    })

    it('rejects URLs with too short hostname', () => {
      expect(sanitizeUrl('https://ab')).toBeNull()
    })

    it('rejects invalid URL formats', () => {
      expect(sanitizeUrl('not a url')).toBeNull()
      expect(sanitizeUrl('example.com')).toBeNull() // missing protocol
    })
  })
})

describe('containsUrl', () => {
  describe('detects URLs', () => {
    it('detects http URLs', () => {
      expect(containsUrl('Check out http://example.com')).toBe(true)
    })

    it('detects https URLs', () => {
      expect(containsUrl('Visit https://example.com/page for more')).toBe(true)
    })

    it('detects www URLs', () => {
      expect(containsUrl('Go to www.example.com')).toBe(true)
    })

    it('detects URLs mid-text', () => {
      expect(containsUrl('Here is a link https://test.com in the middle')).toBe(true)
    })
  })

  describe('does not detect non-URLs', () => {
    it('returns false for plain text', () => {
      expect(containsUrl('This is just regular text')).toBe(false)
    })

    it('returns false for email addresses', () => {
      expect(containsUrl('Contact me at user@example.com')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(containsUrl('')).toBe(false)
    })

    it('returns false for partial matches', () => {
      expect(containsUrl('file://local is not allowed')).toBe(false)
    })
  })

  describe('handles edge cases consistently (no global flag issues)', () => {
    it('returns consistent results for repeated calls', () => {
      const text = 'Check https://example.com here'
      // Multiple calls should return the same result (no global flag state issues)
      expect(containsUrl(text)).toBe(true)
      expect(containsUrl(text)).toBe(true)
      expect(containsUrl(text)).toBe(true)
    })
  })
})

describe('getDomain', () => {
  it('extracts domain from URLs', () => {
    expect(getDomain('https://example.com/path')).toBe('example.com')
    expect(getDomain('http://test.org/page?q=1')).toBe('test.org')
  })

  it('removes www prefix', () => {
    expect(getDomain('https://www.example.com')).toBe('example.com')
    expect(getDomain('http://www.test.org/path')).toBe('test.org')
  })

  it('preserves subdomains (except www)', () => {
    expect(getDomain('https://blog.example.com')).toBe('blog.example.com')
    expect(getDomain('https://api.v2.example.com')).toBe('api.v2.example.com')
  })

  it('returns original string for invalid URLs', () => {
    expect(getDomain('not a url')).toBe('not a url')
    expect(getDomain('')).toBe('')
  })
})

describe('Regex patterns', () => {
  describe('EMOJI_REGEX', () => {
    it('matches emojis', () => {
      expect(EMOJI_REGEX.test('🔥')).toBe(true)
      expect(EMOJI_REGEX.test('😀')).toBe(true)
      expect(EMOJI_REGEX.test('🚀')).toBe(true)
    })

    it('does not match regular text', () => {
      expect(EMOJI_REGEX.test('hello')).toBe(false)
      expect(EMOJI_REGEX.test('example.com')).toBe(false)
    })
  })

  describe('INVALID_URL_CHARS_REGEX', () => {
    it('matches spaces', () => {
      expect(INVALID_URL_CHARS_REGEX.test(' ')).toBe(true)
    })

    it('matches angle brackets', () => {
      expect(INVALID_URL_CHARS_REGEX.test('<')).toBe(true)
      expect(INVALID_URL_CHARS_REGEX.test('>')).toBe(true)
    })

    it('does not match valid URL characters', () => {
      expect(INVALID_URL_CHARS_REGEX.test('a')).toBe(false)
      expect(INVALID_URL_CHARS_REGEX.test('/')).toBe(false)
      expect(INVALID_URL_CHARS_REGEX.test('?')).toBe(false)
    })
  })
})
