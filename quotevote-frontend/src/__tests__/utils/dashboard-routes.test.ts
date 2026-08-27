import {
  isAuthRequiredRoute,
  isGuestReadableRoute,
} from '@/lib/dashboard-routes'

describe('dashboard-routes', () => {
  describe('isGuestReadableRoute', () => {
    it('allows post routes', () => {
      expect(isGuestReadableRoute('/post/general/title/id')).toBe(true)
    })

    it('allows public profile pages', () => {
      expect(isGuestReadableRoute('/profile/alice')).toBe(true)
    })

    it('does not allow own profile shell without username', () => {
      expect(isGuestReadableRoute('/profile')).toBe(false)
    })

    it('does not allow account-only routes', () => {
      expect(isGuestReadableRoute('/settings')).toBe(false)
      expect(isGuestReadableRoute('/notifications')).toBe(false)
    })

    it('does not allow control panel or manage invites', () => {
      expect(isGuestReadableRoute('/control-panel')).toBe(false)
      expect(isGuestReadableRoute('/manage-invites')).toBe(false)
    })
  })

  describe('isAuthRequiredRoute', () => {
    it('marks account routes as auth required', () => {
      expect(isAuthRequiredRoute('/settings')).toBe(true)
      expect(isAuthRequiredRoute('/notifications')).toBe(true)
      expect(isAuthRequiredRoute('/profile')).toBe(true)
    })

    it('marks admin routes as auth required', () => {
      expect(isAuthRequiredRoute('/control-panel')).toBe(true)
      expect(isAuthRequiredRoute('/manage-invites')).toBe(true)
    })

    it('does not mark guest-readable routes as auth required', () => {
      expect(isAuthRequiredRoute('/post/general/title/id')).toBe(false)
      expect(isAuthRequiredRoute('/profile/alice')).toBe(false)
    })
  })
})
