import { parser } from '@/lib/utils/parser'

describe('parser', () => {
    it('returns indices and points for selected text', () => {
        const doc = 'hello world'
        const selected = 'world'
        const res = parser(doc, selected, null)
        expect(res).toEqual({
            startIndex: 6,
            endIndex: 11,
            text: 'world',
            points: 5,
        })
    })
})
