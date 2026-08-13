import getCardBackgroundColor, { ACTIVITY_COLOR_MAP } from '@/lib/utils/getCardBackgroundColor'

describe('getCardBackgroundColor', () => {
    it('returns expected colors for standard activity types', () => {
        expect(getCardBackgroundColor('POSTED')).toBe(ACTIVITY_COLOR_MAP.POSTED)
        expect(getCardBackgroundColor('COMMENTED')).toBe(ACTIVITY_COLOR_MAP.COMMENTED)
        expect(getCardBackgroundColor('UPVOTED')).toBe(ACTIVITY_COLOR_MAP.UPVOTED)
        expect(getCardBackgroundColor('DOWNVOTED')).toBe(ACTIVITY_COLOR_MAP.DOWNVOTED)
        expect(getCardBackgroundColor('QUOTED')).toBe(ACTIVITY_COLOR_MAP.QUOTED)
        expect(getCardBackgroundColor('LIKED')).toBe(ACTIVITY_COLOR_MAP.LIKED)
    })

    it('handles aliases and case-insensitivity', () => {
        expect(getCardBackgroundColor('post')).toBe('#FFFFFF')
        expect(getCardBackgroundColor('comment')).toBe('#FDD835')
        expect(getCardBackgroundColor('up')).toBe('#52b274')
        expect(getCardBackgroundColor('down')).toBe('#FF6060')
        expect(getCardBackgroundColor('voted')).toBe('#52b274')
        expect(getCardBackgroundColor('quote')).toBe('#E36DFA')
        expect(getCardBackgroundColor('hearted')).toBe('#F16C99')
    })

    it('returns default white for unknown or empty activity types', () => {
        expect(getCardBackgroundColor('')).toBe('#FFFFFF')
        expect(getCardBackgroundColor('UNKNOWN_EVENT')).toBe('#FFFFFF')
    })
})

