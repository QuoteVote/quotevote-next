import { redirect } from 'next/navigation'
import ExplorePage from '@/app/dashboard/explore/page'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('ExplorePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to / when called without search params', async () => {
    await ExplorePage({})
    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('redirects to / with search params preserved', async () => {
    await ExplorePage({
      searchParams: Promise.resolve({ q: 'civic tech', tab: 'trending' }),
    })
    expect(redirect).toHaveBeenCalledWith('/?q=civic+tech&tab=trending')
  })
})
