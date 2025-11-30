import { isAuthenticated, requireAuth } from '@/lib/utils/auth'

beforeEach(() => {
    localStorage.clear()
})

describe('auth utils', () => {
    it('isAuthenticated returns false when no token', () => {
        expect(isAuthenticated()).toBe(false)
    })

    it('requireAuth prevents action execution when not authenticated', () => {
        const action = jest.fn((s: string) => s)
        const guarded = requireAuth(action)
        guarded('x')
        expect(action).not.toHaveBeenCalled()
        // Redirect side-effect is environment-specific; ensure no action execution
    })
})
