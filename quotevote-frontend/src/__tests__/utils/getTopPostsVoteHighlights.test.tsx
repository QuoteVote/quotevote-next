import getTopPostsVoteHighlights from '@/lib/utils/getTopPostsVoteHighlights'
import type { Vote } from '@/types/store'

it('returns a React node for simple votes', () => {
    const votes: Vote[] = [{ startWordIndex: 0, endWordIndex: 4, type: 'up' }]
    const text = 'hello world'
    const node = getTopPostsVoteHighlights(votes, null, text)
    expect(node).toBeTruthy()
})
