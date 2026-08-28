import { redirect } from 'next/navigation'
import DashboardCatchAll from '@/app/dashboard/[[...path]]/page'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('Dashboard catch-all: search/explore queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects /dashboard/explore with search params to /', async () => {
    await DashboardCatchAll({
      params: Promise.resolve({ path: ['explore'] }),
      searchParams: Promise.resolve({ q: 'civic tech', tab: 'trending' }),
    })
    expect(redirect).toHaveBeenCalledWith('/?q=civic+tech&tab=trending')
  })
})
