import { pageToOffset, offsetToPage, calculatePagination, generatePageNumbers, normalizePaginationParams, createGraphQLVariables, extractPaginationData } from '@/lib/utils/pagination'
import type { GraphQLVariables } from '@/types/store'

describe('pagination utils', () => {
    it('converts page to offset and back', () => {
        const { limit, offset } = pageToOffset(3, 20)
        expect(limit).toBe(20)
        expect(offset).toBe(40)
        const { page, pageSize } = offsetToPage(offset, limit)
        expect(page).toBe(3)
        expect(pageSize).toBe(20)
    })

    it('calculates pagination meta', () => {
        const meta = calculatePagination(55, 2, 10)
        expect(meta.currentPage).toBe(2)
        expect(meta.totalPages).toBe(6)
        expect(meta.hasNextPage).toBe(true)
    })

    it('generates page numbers', () => {
        expect(generatePageNumbers(5, 10, 5)).toEqual([3, 4, 5, 6, 7])
    })

    it('normalizes params and creates variables', () => {
        const normalized = normalizePaginationParams({ page: 0, pageSize: 1000, totalCount: -2 })
        expect(normalized).toEqual({ page: 1, pageSize: 100, totalCount: 0 })
        const vars = createGraphQLVariables({ page: 1, pageSize: 20 }) as GraphQLVariables
        expect(vars.limit).toBe(20)
        expect(vars.offset).toBe(0)
    })

    it('extracts pagination data', () => {
        const data = { posts: { entities: [1, 2], pagination: { total_count: 2, limit: 10, offset: 0 } } }
        const result = extractPaginationData<number>(data, 'posts')
        expect(result.data).toEqual([1, 2])
        expect(result.pagination?.total).toBe(2)
    })
})
