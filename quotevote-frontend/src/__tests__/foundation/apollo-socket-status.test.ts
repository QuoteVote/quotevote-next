/**
 * The Apollo client reports the subscription socket status and pauses polls
 * in background tabs (#625).
 */
import { createApolloClient } from '@/lib/apollo/apollo-client'
import { isSocketConnected, setSocketConnected } from '@/lib/apollo/socketStatus'

type SocketEvents = { connected?: () => void; closed?: (event?: unknown) => void }

const mockCreateClient = jest.fn()
jest.mock('graphql-ws', () => ({
  createClient: (options: { on?: SocketEvents }) => {
    mockCreateClient(options)
    return { subscribe: jest.fn(), dispose: jest.fn(), on: jest.fn(), terminate: jest.fn() }
  },
}))

describe('Apollo client socket status', () => {
  afterEach(() => {
    setSocketConnected(false)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
  })

  it('connects the socket to the configured API', () => {
    createApolloClient()
    expect(mockCreateClient.mock.calls.at(-1)?.[0]?.url).toBe('ws://localhost:4000/graphql')
  })

  it('marks the socket connected and closed from graphql-ws events', () => {
    createApolloClient()
    const events = mockCreateClient.mock.calls.at(-1)?.[0]?.on as SocketEvents

    events.connected?.()
    expect(isSocketConnected()).toBe(true)

    events.closed?.({ code: 1006, wasClean: false })
    expect(isSocketConnected()).toBe(false)
  })

  it('skips poll attempts while the tab is hidden', () => {
    const client = createApolloClient()
    const skipPollAttempt = client.defaultOptions.watchQuery?.skipPollAttempt

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    expect(skipPollAttempt?.()).toBe(true)

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    expect(skipPollAttempt?.()).toBe(false)
  })
})
