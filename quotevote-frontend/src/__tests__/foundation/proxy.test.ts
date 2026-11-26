/**
 * Proxy (route gate) + JWT session tests for auth redirect / admin gate behavior.
 *
 * Uses the Node environment so Web Crypto / HMAC verification matches
 * production Edge crypto (jsdom's crypto.subtle is unreliable in CI).
 *
 * @jest-environment node
 */

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url: { toString: () => string }) => ({
      type: 'redirect',
      url: url.toString(),
      cookies: { set: jest.fn() },
    })),
    next: jest.fn(() => ({
      type: 'next',
      cookies: { set: jest.fn() },
    })),
  },
}))

import { createHmac } from 'crypto'
import { proxy } from '@/proxy'
import { NextResponse } from 'next/server'
import { resolveJwtSession } from '@/lib/auth/jwtSession'

function createMockRequest(pathname: string, tokenValue?: string, refreshValue?: string) {
  const parsedUrl = new URL(pathname, 'http://localhost:3000')
  const cookies: Record<string, string | undefined> = {
    'qv-token': tokenValue,
    'qv-refresh': refreshValue,
  }
  return {
    nextUrl: {
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      searchParams: parsedUrl.searchParams,
    },
    url: parsedUrl.toString(),
    cookies: {
      get: (name: string) => (cookies[name] ? { value: cookies[name] } : undefined),
    },
  } as unknown as import('next/server').NextRequest
}

function b64urlJson(obj: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function b64urlBytes(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

/** Unsigned JWT-shaped token (invalid signature). */
function unsignedToken(payload: Record<string, unknown>): string {
  return `${b64urlJson({ alg: 'none', typ: 'JWT' })}.${b64urlJson(payload)}.x`
}

/** HS256 JWT signed with Node crypto (avoids jose SignJWT jsdom issues). */
function signedToken(payload: Record<string, unknown>, secret: string): string {
  const header = b64urlJson({ alg: 'HS256', typ: 'JWT' })
  const body = b64urlJson(payload)
  const data = `${header}.${body}`
  const sig = createHmac('sha256', secret).update(data).digest()
  return `${data}.${b64urlBytes(sig)}`
}

describe('resolveJwtSession', () => {
  const originalSecret = process.env.JWT_SECRET

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = originalSecret
  })

  it('returns missing for empty token', async () => {
    expect(await resolveJwtSession(undefined)).toEqual({ status: 'missing' })
  })

  it('returns invalid for malformed token', async () => {
    delete process.env.JWT_SECRET
    expect(await resolveJwtSession('not-a-jwt')).toEqual({ status: 'invalid' })
  })

  it('returns expired when payload exp is in the past (no secret)', async () => {
    delete process.env.JWT_SECRET
    const token = unsignedToken({ exp: Math.floor(Date.now() / 1000) - 60, admin: true })
    expect(await resolveJwtSession(token)).toEqual({ status: 'expired' })
  })

  it('never trusts admin without signature verification', async () => {
    delete process.env.JWT_SECRET
    const token = unsignedToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      admin: true,
    })
    expect(await resolveJwtSession(token)).toEqual({
      status: 'valid',
      admin: false,
      verified: false,
    })
  })

  it('verifies signed tokens when JWT_SECRET is set', async () => {
    process.env.JWT_SECRET = 'test_secret'
    const token = signedToken(
      { admin: true, exp: Math.floor(Date.now() / 1000) + 3600 },
      'test_secret',
    )

    expect(await resolveJwtSession(token)).toEqual({
      status: 'valid',
      admin: true,
      verified: true,
    })
  })

  it('rejects tokens with invalid signature when JWT_SECRET is set', async () => {
    process.env.JWT_SECRET = 'test_secret'
    const token = signedToken(
      { admin: true, exp: Math.floor(Date.now() / 1000) + 3600 },
      'wrong_secret',
    )

    expect(await resolveJwtSession(token)).toEqual({ status: 'invalid' })
  })
})

describe('Middleware', () => {
  const originalSecret = process.env.JWT_SECRET

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.JWT_SECRET
  })

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = originalSecret
  })

  describe('Protected route gates', () => {
    it('redirects unauthenticated users from /settings to /auths/login', async () => {
      await proxy(createMockRequest('/settings'))
      expect(NextResponse.redirect).toHaveBeenCalled()
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
      expect(redirectUrl.pathname).toBe('/auths/login')
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/settings')
    })

    it('redirects unauthenticated users from /notifications to /auths/login', async () => {
      await proxy(createMockRequest('/notifications'))
      expect(NextResponse.redirect).toHaveBeenCalled()
    })

    it('allows unauthenticated users to view public post pages', async () => {
      await proxy(createMockRequest('/post/general/sample-title/abc123'))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('allows unauthenticated users to view public profiles', async () => {
      await proxy(createMockRequest('/profile/testuser'))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('allows users with a non-expired unsigned session through protected routes when secret unset', async () => {
      const token = unsignedToken({ exp: Math.floor(Date.now() / 1000) + 3600 })
      await proxy(createMockRequest('/settings', token))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('redirects expired cookie from /settings to login and clears cookie', async () => {
      const token = unsignedToken({ exp: Math.floor(Date.now() / 1000) - 10 })
      await proxy(createMockRequest('/settings', token))
      expect(NextResponse.redirect).toHaveBeenCalled()
      const res = (NextResponse.redirect as jest.Mock).mock.results[0].value as {
        cookies: { set: jest.Mock }
      }
      expect(res.cookies.set).toHaveBeenCalledWith(
        'qv-token',
        '',
        expect.objectContaining({ maxAge: 0 }),
      )
    })
  })

  describe('Renewing an expired sign-in (#804)', () => {
    const originalFetch = global.fetch
    const expired = () => unsignedToken({ exp: Math.floor(Date.now() / 1000) - 10 })
    const fresh = () => unsignedToken({ exp: Math.floor(Date.now() / 1000) + 900 })

    afterEach(() => {
      global.fetch = originalFetch
    })

    const mockRefresh = (ok: boolean, accessToken?: string) => {
      global.fetch = jest.fn().mockResolvedValue({
        ok,
        json: async () => (ok ? { accessToken, refreshToken: 'refresh-1' } : { message: 'no' }),
      }) as unknown as typeof fetch
    }

    it('renews with the refresh cookie instead of redirecting, and sets the new cookie', async () => {
      const renewed = fresh()
      mockRefresh(true, renewed)

      await proxy(createMockRequest('/settings', expired(), 'refresh-1'))

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/auth\/refresh$/),
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ refreshToken: 'refresh-1' }) })
      )
      expect(NextResponse.redirect).not.toHaveBeenCalled()
      const res = (NextResponse.next as jest.Mock).mock.results[0].value as {
        cookies: { set: jest.Mock }
      }
      expect(res.cookies.set).toHaveBeenCalledWith(
        'qv-token',
        renewed,
        expect.objectContaining({ path: '/' }),
      )
    })

    it('renews when the token cookie is gone but the refresh cookie remains', async () => {
      mockRefresh(true, fresh())

      await proxy(createMockRequest('/notifications', undefined, 'refresh-1'))

      expect(NextResponse.redirect).not.toHaveBeenCalled()
      expect(NextResponse.next).toHaveBeenCalled()
    })

    it('redirects to sign-in and clears both cookies when renewal is refused', async () => {
      mockRefresh(false)

      await proxy(createMockRequest('/settings', expired(), 'refresh-1'))

      expect(NextResponse.redirect).toHaveBeenCalled()
      const res = (NextResponse.redirect as jest.Mock).mock.results[0].value as {
        cookies: { set: jest.Mock }
      }
      for (const name of ['qv-token', 'qv-refresh']) {
        expect(res.cookies.set).toHaveBeenCalledWith(name, '', expect.objectContaining({ maxAge: 0 }))
      }
    })

    it('does not call the backend for a valid session or without a refresh cookie', async () => {
      global.fetch = jest.fn() as unknown as typeof fetch

      await proxy(createMockRequest('/settings', fresh(), 'refresh-1'))
      await proxy(createMockRequest('/settings', expired()))

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('Auth page redirect', () => {
    it('allows login when cookie is expired (does not bounce to /)', async () => {
      const token = unsignedToken({ exp: Math.floor(Date.now() / 1000) - 10 })
      await proxy(createMockRequest('/auths/login', token))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('allows login when cookie is malformed', async () => {
      await proxy(createMockRequest('/auths/login', 'garbage'))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('allows login with no cookie', async () => {
      await proxy(createMockRequest('/auths/login'))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('redirects valid session away from login', async () => {
      const token = unsignedToken({ exp: Math.floor(Date.now() / 1000) + 3600 })
      await proxy(createMockRequest('/auths/login', token))
      expect(NextResponse.redirect).toHaveBeenCalled()
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
      expect(redirectUrl.pathname).toBe('/')
    })

    it('does NOT redirect from /auths/password-reset with a valid session', async () => {
      const token = unsignedToken({ exp: Math.floor(Date.now() / 1000) + 3600 })
      await proxy(createMockRequest('/auths/password-reset', token))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('Admin control panel', () => {
    it('does not grant admin from forged unsigned admin claim', async () => {
      process.env.JWT_SECRET = 'test_secret'
      const forged = unsignedToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
        admin: true,
      })
      await proxy(createMockRequest('/control-panel', forged))
      // Invalid signature → treated as invalid → login redirect
      expect(NextResponse.redirect).toHaveBeenCalled()
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
      expect(redirectUrl.pathname).toBe('/auths/login')
    })

    it('allows verified admin tokens through control-panel', async () => {
      process.env.JWT_SECRET = 'test_secret'
      const token = signedToken(
        { admin: true, exp: Math.floor(Date.now() / 1000) + 3600 },
        'test_secret',
      )

      await proxy(createMockRequest('/control-panel', token))
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('redirects verified non-admin away from control-panel', async () => {
      process.env.JWT_SECRET = 'test_secret'
      const token = signedToken(
        { admin: false, exp: Math.floor(Date.now() / 1000) + 3600 },
        'test_secret',
      )

      await proxy(createMockRequest('/control-panel', token))
      expect(NextResponse.redirect).toHaveBeenCalled()
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as URL
      expect(redirectUrl.pathname).toBe('/')
    })
  })
})
