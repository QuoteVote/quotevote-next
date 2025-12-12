import { replaceGqlError } from '@/lib/utils/replaceGqlError'

test('replaceGqlError strips GraphQL prefix', () => {
    expect(replaceGqlError('GraphQL error: Something went wrong')).toBe(' Something went wrong')
})
