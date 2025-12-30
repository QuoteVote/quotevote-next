import { composePost } from '@/lib/utils/display'
import type { Activity, ThemeShape } from '@/types/store'

describe('display composePost', () => {
    const theme: ThemeShape = { activityCards: { quoted: { color: '#111' }, commented: { color: '#222' } } }
    it('maps VOTED activity correctly', () => {
        const activity: Activity = {
            event: 'VOTED',
            data: {
                _id: '1',
                type: 'up',
                points: 3,
                content: { title: 'Hello' },
                created: new Date().toISOString(),
                creator: { username: 'u' },
            }
        }
        const res = composePost(activity, theme)!
        expect(res.AlertTitle).toBe('UPVOTED')
        expect(res.points).toBe('+3')
    })
})
