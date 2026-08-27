import { redirect } from 'next/navigation'
import DashboardCatchAll from '@/app/dashboard/[[...path]]/page'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('Dashboard catch-all redirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects /dashboard to /', async () => {
    await DashboardCatchAll({ params: Promise.resolve({ path: undefined }) })
    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('redirects /dashboard/explore to /', async () => {
    await DashboardCatchAll({ params: Promise.resolve({ path: ['explore'] }) })
    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('redirects /dashboard/explore/sub to /', async () => {
    await DashboardCatchAll({ params: Promise.resolve({ path: ['explore', 'sub'] }) })
    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('redirects /dashboard/settings to /settings', async () => {
    await DashboardCatchAll({ params: Promise.resolve({ path: ['settings'] }) })
    expect(redirect).toHaveBeenCalledWith('/settings')
  })

  it('redirects /dashboard/profile/alice to /profile/alice', async () => {
    await DashboardCatchAll({ params: Promise.resolve({ path: ['profile', 'alice'] }) })
    expect(redirect).toHaveBeenCalledWith('/profile/alice')
  })

  it('preserves query parameters', async () => {
    await DashboardCatchAll({
      params: Promise.resolve({ path: ['post', 'general', 'title', 'abc'] }),
      searchParams: Promise.resolve({ q: 'test', tab: 'latest' }),
    })
    expect(redirect).toHaveBeenCalledWith('/post/general/title/abc?q=test&tab=latest')
  })
})
