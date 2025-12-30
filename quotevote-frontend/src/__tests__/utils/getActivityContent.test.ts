import { getActivityContent } from '@/lib/utils/getActivityContent'

describe('getActivityContent', () => {
    const post = { text: 'hello world this is a test' }
    it('returns post text for POSTED', () => {
        expect(getActivityContent('POSTED', post)).toBe(post.text)
    })

    it('returns substring for UPVOTED', () => {
        const vote = { startWordIndex: 0, endWordIndex: 5 }
        expect(getActivityContent('UPVOTED', post, undefined, vote)).toContain('hello')
    })
})
