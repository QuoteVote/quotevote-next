/**
 * useSEOHead Hook Tests
 * 
 * Tests that verify:
 * - Hook updates document title
 * - Hook updates meta tags
 * - Hook updates link tags
 * - Hook cleans up on unmount
 */

import { renderHook } from '@testing-library/react'
import { useSEOHead } from '@/hooks/useSEOHead'

describe('useSEOHead Hook', () => {
  let originalTitle: string

  beforeEach(() => {
    originalTitle = document.title
    // Clear existing meta and link tags
    document.head.innerHTML = ''
    document.title = ''
  })

  afterEach(() => {
    document.title = originalTitle
    document.head.innerHTML = ''
  })

  describe('Document Title', () => {
    it('updates document title', () => {
      renderHook(() => useSEOHead({ title: 'Test Page Title' }))

      expect(document.title).toBe('Test Page Title')
    })

    it('does not update title when not provided', () => {
      document.title = 'Original Title'
      renderHook(() => useSEOHead({}))

      expect(document.title).toBe('Original Title')
    })
  })

  describe('Meta Tags', () => {
    it('creates description meta tag', () => {
      renderHook(() =>
        useSEOHead({ description: 'Test page description' })
      )

      const meta = document.querySelector('meta[name="description"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute('content', 'Test page description')
    })

    it('updates existing description meta tag', () => {
      const existingMeta = document.createElement('meta')
      existingMeta.setAttribute('name', 'description')
      existingMeta.setAttribute('content', 'Old description')
      document.head.appendChild(existingMeta)

      renderHook(() =>
        useSEOHead({ description: 'New description' })
      )

      const meta = document.querySelector('meta[name="description"]')
      expect(meta).toHaveAttribute('content', 'New description')
    })

    it('creates keywords meta tag', () => {
      renderHook(() => useSEOHead({ keywords: 'test, keywords, seo' }))

      const meta = document.querySelector('meta[name="keywords"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute('content', 'test, keywords, seo')
    })

    it('creates robots meta tag when noIndex is true', () => {
      renderHook(() => useSEOHead({ noIndex: true }))

      const meta = document.querySelector('meta[name="robots"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute('content', 'noindex, nofollow')
    })
  })

  describe('Open Graph Tags', () => {
    it('creates og:title meta tag', () => {
      renderHook(() => useSEOHead({ title: 'OG Title' }))

      const meta = document.querySelector('meta[property="og:title"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute('content', 'OG Title')
    })

    it('creates og:description meta tag', () => {
      renderHook(() =>
        useSEOHead({ description: 'OG Description' })
      )

      const meta = document.querySelector('meta[property="og:description"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute('content', 'OG Description')
    })

    it('creates og:url meta tag', () => {
      renderHook(() =>
        useSEOHead({ canonicalUrl: 'https://example.com/page' })
      )

      const meta = document.querySelector('meta[property="og:url"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute('content', 'https://example.com/page')
    })

    it('creates og:image meta tag', () => {
      renderHook(() =>
        useSEOHead({ ogImage: 'https://example.com/image.jpg' })
      )

      const meta = document.querySelector('meta[property="og:image"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute('content', 'https://example.com/image.jpg')
    })

    it('creates og:type meta tag with default value', () => {
      renderHook(() => useSEOHead({}))

      const meta = document.querySelector('meta[property="og:type"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute('content', 'website')
    })

    it('creates og:type meta tag with custom value', () => {
      renderHook(() => useSEOHead({ ogType: 'article' }))

      const meta = document.querySelector('meta[property="og:type"]')
      expect(meta).toHaveAttribute('content', 'article')
    })
  })

  describe('Twitter Card Tags', () => {
    it('creates twitter:title meta tag', () => {
      renderHook(() => useSEOHead({ title: 'Twitter Title' }))

      const meta = document.querySelector('meta[name="twitter:title"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute('content', 'Twitter Title')
    })

    it('creates twitter:description meta tag', () => {
      renderHook(() =>
        useSEOHead({ description: 'Twitter Description' })
      )

      const meta = document.querySelector('meta[name="twitter:description"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute('content', 'Twitter Description')
    })

    it('creates twitter:image meta tag', () => {
      renderHook(() =>
        useSEOHead({ ogImage: 'https://example.com/twitter-image.jpg' })
      )

      const meta = document.querySelector('meta[name="twitter:image"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute(
        'content',
        'https://example.com/twitter-image.jpg'
      )
    })

    it('creates twitter:card meta tag', () => {
      renderHook(() => useSEOHead({}))

      const meta = document.querySelector('meta[name="twitter:card"]')
      expect(meta).toBeInTheDocument()
      expect(meta).toHaveAttribute('content', 'summary_large_image')
    })
  })

  describe('Link Tags', () => {
    it('creates canonical link tag', () => {
      renderHook(() =>
        useSEOHead({ canonicalUrl: 'https://example.com/canonical' })
      )

      const link = document.querySelector('link[rel="canonical"]')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com/canonical')
    })

    it('updates existing canonical link tag', () => {
      const existingLink = document.createElement('link')
      existingLink.setAttribute('rel', 'canonical')
      existingLink.setAttribute('href', 'https://old.com')
      document.head.appendChild(existingLink)

      renderHook(() =>
        useSEOHead({ canonicalUrl: 'https://new.com' })
      )

      const link = document.querySelector('link[rel="canonical"]')
      expect(link).toHaveAttribute('href', 'https://new.com')
    })

    it('creates prev link tag', () => {
      renderHook(() =>
        useSEOHead({ prevUrl: 'https://example.com/prev' })
      )

      const link = document.querySelector('link[rel="prev"]')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com/prev')
    })

    it('creates next link tag', () => {
      renderHook(() =>
        useSEOHead({ nextUrl: 'https://example.com/next' })
      )

      const link = document.querySelector('link[rel="next"]')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com/next')
    })
  })

  describe('Cleanup', () => {
    it('removes prev link on unmount', () => {
      const { unmount } = renderHook(() =>
        useSEOHead({ prevUrl: 'https://example.com/prev' })
      )

      expect(document.querySelector('link[rel="prev"]')).toBeInTheDocument()

      unmount()

      expect(document.querySelector('link[rel="prev"]')).not.toBeInTheDocument()
    })

    it('removes next link on unmount', () => {
      const { unmount } = renderHook(() =>
        useSEOHead({ nextUrl: 'https://example.com/next' })
      )

      expect(document.querySelector('link[rel="next"]')).toBeInTheDocument()

      unmount()

      expect(document.querySelector('link[rel="next"]')).not.toBeInTheDocument()
    })

    it('does not remove meta tags on unmount', () => {
      const { unmount } = renderHook(() =>
        useSEOHead({ description: 'Test description' })
      )

      expect(document.querySelector('meta[name="description"]')).toBeInTheDocument()

      unmount()

      expect(document.querySelector('meta[name="description"]')).toBeInTheDocument()
    })
  })

  describe('Multiple Updates', () => {
    it('handles multiple prop updates', () => {
      const { rerender } = renderHook(
        ({ props }) => useSEOHead(props),
        {
          initialProps: {
            props: { title: 'Title 1', description: 'Description 1' },
          },
        }
      )

      expect(document.title).toBe('Title 1')
      expect(
        document.querySelector('meta[name="description"]')
      ).toHaveAttribute('content', 'Description 1')

      rerender({
        props: { title: 'Title 2', description: 'Description 2' },
      })

      expect(document.title).toBe('Title 2')
      expect(
        document.querySelector('meta[name="description"]')
      ).toHaveAttribute('content', 'Description 2')
    })
  })
})

