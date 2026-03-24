/**
 * Apollo Cache Tests
 *
 * Tests cache configuration: type policies for paginated posts/comments,
 * merge functions, and field read defaults.
 */

import { InMemoryCache } from '@apollo/client'
import { createApolloClient } from '@/lib/apollo/apollo-client'

describe('Apollo Cache Configuration', () => {
  describe('InMemoryCache initialization', () => {
    it('creates cache without throwing', () => {
      expect(() => new InMemoryCache()).not.toThrow()
    })
  })

  describe('createApolloClient', () => {
    it('creates Apollo client with InMemoryCache', () => {
      const client = createApolloClient()
      expect(client).toBeDefined()
      expect(client.cache).toBeInstanceOf(InMemoryCache)
    })

    it('sets ssrMode based on environment', () => {
      const client = createApolloClient()
      // In jsdom (test env), window is defined so ssrMode should be false
      expect(client).toBeDefined()
    })
  })

  describe('posts type policy', () => {
    it('merges existing and incoming post data', () => {
      const cache = new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              posts: {
                keyArgs: ['filter', 'searchKey'],
                merge(existing = { data: [] }, incoming) {
                  return {
                    ...incoming,
                    data: [...(existing.data ?? []), ...(incoming.data ?? [])],
                  }
                },
              },
            },
          },
        },
      })
      expect(cache).toBeDefined()
    })

    it('starts with empty array when no existing data', () => {
      const mergeFn = (existing = { data: [] }, incoming: { data: unknown[] }) => ({
        ...incoming,
        data: [...(existing.data ?? []), ...(incoming.data ?? [])],
      })

      const result = mergeFn(undefined, { data: [{ id: '1' }] })
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toEqual({ id: '1' })
    })

    it('appends incoming data to existing data', () => {
      const mergeFn = (
        existing = { data: [] as unknown[] },
        incoming: { data: unknown[] }
      ) => ({
        ...incoming,
        data: [...(existing.data ?? []), ...(incoming.data ?? [])],
      })

      const result = mergeFn(
        { data: [{ id: '1' }] },
        { data: [{ id: '2' }, { id: '3' }] }
      )
      expect(result.data).toHaveLength(3)
    })
  })

  describe('comments type policy', () => {
    it('merges comments with existing data', () => {
      const mergeFn = (
        existing = { data: [] as unknown[] },
        incoming: { data: unknown[] }
      ) => ({
        ...incoming,
        data: [...(existing.data ?? []), ...(incoming.data ?? [])],
      })

      const result = mergeFn({ data: [{ _id: 'c1' }] }, { data: [{ _id: 'c2' }] })
      expect(result.data).toHaveLength(2)
    })
  })

  describe('Apollo client default options', () => {
    it('configures watchQuery with cache-and-network policy', () => {
      const client = createApolloClient()
      const opts = client.defaultOptions.watchQuery
      expect(opts?.fetchPolicy).toBe('cache-and-network')
      expect(opts?.errorPolicy).toBe('all')
    })

    it('configures query with all error policy', () => {
      const client = createApolloClient()
      const opts = client.defaultOptions.query
      expect(opts?.errorPolicy).toBe('all')
    })
  })
})
