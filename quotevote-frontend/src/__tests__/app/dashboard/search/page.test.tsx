import { redirect } from 'next/navigation'
import ExplorePage from '@/app/dashboard/explore/page'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('ExplorePage (formerly SearchPage)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to / when called', async () => {
    await ExplorePage({})
    expect(redirect).toHaveBeenCalledWith('/')
  })
})
