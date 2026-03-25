import { getBaseServerUrl, getGraphqlServerUrl, getGraphqlWsServerUrl } from '@/lib/utils/getServerUrl'

describe('getServerUrl', () => {
    const OLD_ENV = process.env
    beforeEach(() => {
        jest.resetModules()
        process.env = { ...OLD_ENV }
        // Clear env vars so tests control them
        delete process.env.NEXT_PUBLIC_SERVER_URL
        delete process.env.NEXT_PUBLIC_SERVER
        delete process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT
    })
    afterAll(() => {
        process.env = OLD_ENV
    })

    it('respects NEXT_PUBLIC_SERVER_URL env var', () => {
        process.env.NEXT_PUBLIC_SERVER_URL = 'https://env.example.com'
        expect(getBaseServerUrl()).toBe('https://env.example.com')
    })

    it('falls back to NEXT_PUBLIC_SERVER env var', () => {
        process.env.NEXT_PUBLIC_SERVER = 'https://legacy.example.com'
        expect(getBaseServerUrl()).toBe('https://legacy.example.com')
    })

    it('derives base URL from NEXT_PUBLIC_GRAPHQL_ENDPOINT', () => {
        process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT = 'https://api.example.com/graphql'
        expect(getBaseServerUrl()).toBe('https://api.example.com')
    })

    it('builds graphql urls', () => {
        process.env.NEXT_PUBLIC_SERVER_URL = 'https://api.example.com'
        expect(getGraphqlServerUrl()).toBe('https://api.example.com/graphql')
    })

    it('builds websocket urls for production', () => {
        process.env.NEXT_PUBLIC_SERVER_URL = 'https://api.example.com'
        expect(getGraphqlWsServerUrl()).toBe('wss://api.example.com/graphql')
    })

    it('builds websocket urls for localhost', () => {
        process.env.NEXT_PUBLIC_SERVER_URL = 'http://localhost:4000'
        expect(getGraphqlWsServerUrl()).toBe('ws://localhost:4000/graphql')
    })
})
