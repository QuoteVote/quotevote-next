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
  const url = `http://localhost:3000${pathname}`
  return {
    nextUrl: {
      pathname,
      searchParams: new URLSearchParams(),
    },
    url,
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
    it('redirects unauthenticated users from /dashboard to /auths/login', () => {
      middleware(createMockRequest('/dashboard/explore'))
      expect(NextResponse.redirect).toHaveBeenCalled()
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
      expect(redirectUrl.pathname).toBe('/auths/login')
    })

    it('includes callbackUrl for dashboard redirect', () => {
      middleware(createMockRequest('/dashboard/explore'))
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/dashboard/explore')
    })

    it('allows authenticated users to pass through /dashboard', () => {
      middleware(createMockRequest('/dashboard/explore', 'valid-token'))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('Auth page redirect for authenticated users', () => {
    it('redirects authenticated users from /auths/login to /dashboard/explore', () => {
      middleware(createMockRequest('/auths/login', 'valid-token'))
      expect(NextResponse.redirect).toHaveBeenCalled()
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
      expect(redirectUrl.pathname).toBe('/dashboard/explore')
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
