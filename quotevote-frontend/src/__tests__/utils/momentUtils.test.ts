import { parseCommentDate } from '@/lib/utils/momentUtils'

test('parseCommentDate returns a string', () => {
    const s = parseCommentDate(new Date())
    expect(typeof s).toBe('string')
})
