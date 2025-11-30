import { getBaseServerUrl, getGraphqlServerUrl, getGraphqlWsServerUrl } from '@/lib/utils/getServerUrl'

describe('getServerUrl', () => {
    const OLD_ENV = process.env
    beforeEach(() => {
        jest.resetModules()
        process.env = { ...OLD_ENV }
    })
    afterAll(() => {
        process.env = OLD_ENV
    })

    it('respects NEXT_PUBLIC_SERVER env var', () => {
        process.env.NEXT_PUBLIC_SERVER = 'https://env.example.com'
        expect(getBaseServerUrl()).toBe('https://env.example.com')
    })

    it('builds graphql urls', () => {
        const base = getBaseServerUrl()
        expect(getGraphqlServerUrl()).toBe(`${base}/graphql`)
        const ws = getGraphqlWsServerUrl()
        expect(ws).toContain('/graphql')
    })
})
