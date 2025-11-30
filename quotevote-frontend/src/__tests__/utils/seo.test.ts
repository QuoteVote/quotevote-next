import { generateCanonicalUrl, generatePageTitle, generatePageDescription, extractUrlParams, generatePaginationUrls } from '@/lib/utils/seo'

describe('seo utils', () => {
    it('generates canonical url with defaults', () => {
        const url = generateCanonicalUrl('https://example.com', { page: 2, pageSize: 10, searchKey: 'hello' })
        expect(url).toContain('https://example.com')
        expect(url).toContain('page=2')
        expect(url).toContain('q=hello')
    })

    it('generates page title and description', () => {
        const title = generatePageTitle('Results', 2, 5, 'foo')
        expect(title).toContain('foo')
        const desc = generatePageDescription('Base', 2, 5, 'foo', 42, 10)
        expect(desc).toContain('Showing 11-20 of 42')
    })

    it('extracts url params', () => {
        const params = extractUrlParams({ search: '?page=3&page_size=15&q=bar' })
        expect(params.page).toBe(3)
        expect(params.pageSize).toBe(15)
        expect(params.searchKey).toBe('bar')
    })

    it('makes pagination urls', () => {
        const urls = generatePaginationUrls('https://x', { pageSize: 10 }, 2, 5)
        expect(urls.prevUrl).toContain('page=1')
        expect(urls.nextUrl).toContain('page=3')
    })
})
