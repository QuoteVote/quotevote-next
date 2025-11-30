import getActivityContent from '@/lib/utils/getActivityContent'
import type { GetActivityContentArgs } from '@/types/store'

describe('getActivityContent', () => {
    const post = { text: 'hello world this is a test' }
    it('returns post text for POSTED', () => {
        const args: GetActivityContentArgs = {
            type: 'POSTED',
            post,
            quote: { startWordIndex: 0, endWordIndex: 0 },
            vote: { startWordIndex: 0, endWordIndex: 0 },
            comment: { startWordIndex: 0, endWordIndex: 0 },
        }
        expect(getActivityContent(args)).toBe(post.text)
    })

    it('returns substring for UPVOTED', () => {
        const args: GetActivityContentArgs = {
            type: 'UPVOTED',
            post,
            quote: { startWordIndex: 0, endWordIndex: 0 },
            vote: { startWordIndex: 0, endWordIndex: 5 },
            comment: { startWordIndex: 0, endWordIndex: 0 },
        }
        expect(getActivityContent(args)).toContain('hello')
    })
})
