import { isAuthenticated, hasActiveSession, requireAuth } from '@/lib/utils/auth'
import { useAppStore } from '@/store/useAppStore'

beforeEach(() => {
  localStorage.clear()
  useAppStore.getState().logout()
})

describe('auth utils', () => {
  it('isAuthenticated returns false when no token', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('hasActiveSession is true when store has a user even without a token', () => {
    useAppStore.getState().setUserData({ _id: 'user-1', username: 'alice' })
    expect(isAuthenticated()).toBe(false)
    expect(hasActiveSession()).toBe(true)
  })

  it('requireAuth prevents action execution when not authenticated', () => {
    const action = jest.fn((s: string) => s)
    const guarded = requireAuth(action)
    guarded('x')
    expect(action).not.toHaveBeenCalled()
  })

  it('requireAuth allows action when store session exists', () => {
    useAppStore.getState().setUserData({ _id: 'user-1', username: 'alice' })
    const action = jest.fn((s: string) => s)
    const guarded = requireAuth(action)
    guarded('x')
    expect(action).toHaveBeenCalledWith('x')
  })
})
