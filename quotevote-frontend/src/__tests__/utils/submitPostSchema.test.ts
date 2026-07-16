/**
 * Tests for submit post schema validation - Citation URL related fields
 */
import { submitPostSchema, isSubmitPostFormReady } from '@/lib/validation/submitPostSchema'

// Helper to create valid base post data (tag is required by the schema)
const validBasePost = {
  title: 'Test Post',
  text: 'This is post content without any links',
  tag: 'test-tag-id', // Tag is required by schema refine
}

describe('submitPostSchema - Citation URL validation', () => {
  describe('citationUrl field', () => {
    it('accepts valid http URLs', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        citationUrl: 'http://example.com'
      })
      expect(result.success).toBe(true)
    })

    it('accepts valid https URLs', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        citationUrl: 'https://example.com/article'
      })
      expect(result.success).toBe(true)
    })

    it('accepts empty citationUrl (optional field)', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        citationUrl: ''
      })
      expect(result.success).toBe(true)
    })

    it('accepts undefined citationUrl (optional field)', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost
        // citationUrl not provided
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid URL format', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        citationUrl: 'not a valid url'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const citationUrlError = result.error.issues.find(i => i.path.includes('citationUrl'))
        expect(citationUrlError?.message).toContain('Invalid URL format')
      }
    })

    it('rejects javascript: URLs', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        citationUrl: 'javascript:alert(1)'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('text field URL blocking', () => {
    it('rejects http URLs in post body', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        text: 'Check out http://example.com for more info'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const textError = result.error.issues.find(i => i.path.includes('text'))
        expect(textError?.message).toContain('Links are not allowed in the post body')
      }
    })

    it('rejects https URLs in post body', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        text: 'Visit https://example.com/page for details'
      })
      expect(result.success).toBe(false)
    })

    it('rejects www URLs in post body', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        text: 'Go to www.example.com for more'
      })
      expect(result.success).toBe(false)
    })

    it('allows email addresses in post body', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        text: 'Contact me at user@example.com for questions'
      })
      expect(result.success).toBe(true)
    })

    it('allows plain text without URLs', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        text: 'This is a normal post without any links or URLs'
      })
      expect(result.success).toBe(true)
    })
  })

  describe('combined citation and body validation', () => {
    it('accepts valid post with citation URL and clean body', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        text: 'This is my analysis of the article. No links here.',
        citationUrl: 'https://source.com/original-article'
      })
      expect(result.success).toBe(true)
    })

    it('rejects post with URL in body even when citation URL is provided', () => {
      const result = submitPostSchema.safeParse({
        ...validBasePost,
        text: 'See https://another.com for more details',
        citationUrl: 'https://source.com/original-article'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('isSubmitPostFormReady', () => {
    it('returns false when required fields are missing', () => {
      expect(isSubmitPostFormReady({ title: '', text: '', citationUrl: '' })).toBe(false)
      expect(
        isSubmitPostFormReady({
          title: 'Title',
          text: 'Body',
          citationUrl: '',
        })
      ).toBe(false)
    })

    it('returns true when required fields are valid', () => {
      expect(isSubmitPostFormReady(validBasePost)).toBe(true)
    })
  })
})
