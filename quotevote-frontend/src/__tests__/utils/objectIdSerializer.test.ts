import { serializeObjectIds } from '@/lib/utils/objectIdSerializer'

describe('objectIdSerializer', () => {
    it('serializes Mongo ObjectID-like objects to string', () => {
        const input = { _id: { _bsontype: 'ObjectID', id: Buffer.from('abcd', 'utf8'), toString: () => 'abc123' } }
        const out = serializeObjectIds(input) as Record<string, unknown>
        expect((out as { _id: string })._id).toBe('abc123')
    })
})
