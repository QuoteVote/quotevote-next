import {
  isAuthRequiredDashboardRoute,
  isGuestReadableDashboardRoute,
} from '@/lib/dashboard-routes'

describe('dashboard-routes', () => {
  describe('isGuestReadableDashboardRoute', () => {
    it('allows post routes', () => {
      expect(isGuestReadableDashboardRoute('/dashboard/post/general/title/id')).toBe(true)
    })

    it('allows public profile pages', () => {
      expect(isGuestReadableDashboardRoute('/dashboard/profile/alice')).toBe(true)
    })

    it('does not allow own profile shell without username', () => {
      expect(isGuestReadableDashboardRoute('/dashboard/profile')).toBe(false)
    })

    it('does not allow account-only routes', () => {
      expect(isGuestReadableDashboardRoute('/dashboard/settings')).toBe(false)
      expect(isGuestReadableDashboardRoute('/dashboard/notifications')).toBe(false)
    })
  })

  describe('isAuthRequiredDashboardRoute', () => {
    it('marks account routes as auth required', () => {
      expect(isAuthRequiredDashboardRoute('/dashboard/settings')).toBe(true)
      expect(isAuthRequiredDashboardRoute('/dashboard/notifications')).toBe(true)
      expect(isAuthRequiredDashboardRoute('/dashboard/profile')).toBe(true)
    })
  })
})
