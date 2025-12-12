import getCardBackgroundColor from '@/lib/utils/getCardBackgroundColor'

describe('getCardBackgroundColor', () => {
    it('returns expected colors', () => {
        expect(getCardBackgroundColor('POSTED')).toBe('#FFFFFF')
        expect(getCardBackgroundColor('UPVOTED')).toBe('#52b274')
    })
})
