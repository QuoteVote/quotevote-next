/**
 * Middleware Tests
 *
 * Tests Next.js edge middleware logic for route protection and auth redirects.
 * Uses full mocking of next/server since jsdom lacks Web API Request/Response.
 */

// Fully mock next/server before any imports
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url: { toString: () => string }) => ({
      type: 'redirect',
      url: url.toString(),
    })),
    next: jest.fn(() => ({ type: 'next' })),
  },
}))

import { middleware } from '../../../middleware'
import { NextResponse } from 'next/server'

function createMockRequest(pathname: string, tokenValue?: string) {
  const parsedUrl = new URL(pathname, 'http://localhost:3000')
  return {
    nextUrl: {
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      searchParams: parsedUrl.searchParams,
    },
    url: parsedUrl.toString(),
    cookies: {
      get: (name: string) =>
        name === 'qv-token' && tokenValue ? { value: tokenValue } : undefined,
    },
  } as unknown as import('next/server').NextRequest
}

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Dashboard protection', () => {
    it('redirects /dashboard/explore to /', () => {
      middleware(createMockRequest('/dashboard/explore'))
      expect(NextResponse.redirect).toHaveBeenCalled()
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
      expect(redirectUrl.pathname).toBe('/')
      expect(redirectUrl.search).toBe('')
    })

    it('redirects /dashboard/explore with query parameters preserved', () => {
      middleware(createMockRequest('/dashboard/explore?q=democracy&tab=latest'))
      expect(NextResponse.redirect).toHaveBeenCalled()
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
      expect(redirectUrl.pathname).toBe('/')
      expect(redirectUrl.search).toBe('?q=democracy&tab=latest')
    })

    it('allows unauthenticated users to view public post pages', () => {
      middleware(createMockRequest('/dashboard/post/general/sample-title/abc123'))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('allows unauthenticated users to view public profiles', () => {
      middleware(createMockRequest('/dashboard/profile/testuser'))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('redirects unauthenticated users from /dashboard/settings to /auths/login', () => {
      middleware(createMockRequest('/dashboard/settings'))
      expect(NextResponse.redirect).toHaveBeenCalled()
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
      expect(redirectUrl.pathname).toBe('/auths/login')
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/dashboard/settings')
    })

    it('redirects unauthenticated users from /dashboard/profile to /auths/login', () => {
      middleware(createMockRequest('/dashboard/profile'))
      expect(NextResponse.redirect).toHaveBeenCalled()
    })

    it('allows authenticated users to pass through /dashboard', () => {
      middleware(createMockRequest('/dashboard/settings', 'valid-token'))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('Auth page redirect for authenticated users', () => {
    it('redirects authenticated users from /auths/login to /', () => {
      middleware(createMockRequest('/auths/login', 'valid-token'))
      expect(NextResponse.redirect).toHaveBeenCalled()
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
      expect(redirectUrl.pathname).toBe('/')
    })

    it('redirects authenticated users from /auths/signup', () => {
      middleware(createMockRequest('/auths/signup', 'valid-token'))
      expect(NextResponse.redirect).toHaveBeenCalled()
    })

    it('redirects authenticated users from /auths/forgot-password', () => {
      middleware(createMockRequest('/auths/forgot-password', 'valid-token'))
      expect(NextResponse.redirect).toHaveBeenCalled()
    })

    it('does NOT redirect authenticated users from /auths/password-reset', () => {
      middleware(createMockRequest('/auths/password-reset', 'valid-token'))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('does NOT redirect authenticated users from /auths/investor-thanks', () => {
      middleware(createMockRequest('/auths/investor-thanks', 'valid-token'))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('Public auth routes (unauthenticated)', () => {
    it('allows unauthenticated access to /auths/login', () => {
      middleware(createMockRequest('/auths/login'))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('allows unauthenticated access to /auths/forgot-password', () => {
      middleware(createMockRequest('/auths/forgot-password'))
      expect(NextResponse.next).toHaveBeenCalled()
    })

    it('allows unauthenticated access to /auths/request-access', () => {
      middleware(createMockRequest('/auths/request-access'))
      expect(NextResponse.next).toHaveBeenCalled()
    })

    it('allows unauthenticated access to /auths/password-reset', () => {
      middleware(createMockRequest('/auths/password-reset'))
      expect(NextResponse.next).toHaveBeenCalled()
    })
  })
})
