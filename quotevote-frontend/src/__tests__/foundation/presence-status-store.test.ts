/**
 * The signed-in user's own availability status in the store (#468):
 * Invisible by default, user-controlled, and never changed by anything else.
 */

import { useAppStore } from '@/store/useAppStore'
import { resetStore } from '@/__tests__/utils/test-utils'

const chat = () => useAppStore.getState().chat

describe('own availability status in the store', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts Invisible, with no message, and not yet loaded', () => {
    expect(chat().userStatus).toBe('invisible')
    expect(chat().userStatusMessage).toBe('')
    expect(chat().userStatusLoaded).toBe(false)
  })

  it('setUserStatus stores what the user chose and marks it loaded', () => {
    useAppStore.getState().setUserStatus('away', 'Out for lunch')

    expect(chat().userStatus).toBe('away')
    expect(chat().userStatusMessage).toBe('Out for lunch')
    expect(chat().userStatusLoaded).toBe(true)
  })

  it('setUserStatus without a message clears the message', () => {
    useAppStore.getState().setUserStatus('away', 'Out for lunch')
    useAppStore.getState().setUserStatus('online')

    expect(chat().userStatusMessage).toBe('')
  })

  it('hydrateUserStatus applies the saved status once, when nothing was chosen yet', () => {
    useAppStore.getState().hydrateUserStatus('dnd', 'Heads down')

    expect(chat().userStatus).toBe('dnd')
    expect(chat().userStatusMessage).toBe('Heads down')
    expect(chat().userStatusLoaded).toBe(true)
  })

  it('hydrateUserStatus never overrides a status the user already chose', () => {
    useAppStore.getState().setUserStatus('online', 'Hi')
    useAppStore.getState().hydrateUserStatus('away', 'Old server value')

    expect(chat().userStatus).toBe('online')
    expect(chat().userStatusMessage).toBe('Hi')
  })

  it('hydrateUserStatus does not apply a second time', () => {
    useAppStore.getState().hydrateUserStatus('away', 'First')
    useAppStore.getState().hydrateUserStatus('dnd', 'Second')

    expect(chat().userStatus).toBe('away')
    expect(chat().userStatusMessage).toBe('First')
  })

  it('logout puts the next account back on the default', () => {
    useAppStore.getState().setUserStatus('away', 'Out for lunch')
    useAppStore.getState().logout()

    expect(chat().userStatus).toBe('invisible')
    expect(chat().userStatusMessage).toBe('')
    expect(chat().userStatusLoaded).toBe(false)

    // ...and the next account's saved status can be loaded again
    useAppStore.getState().hydrateUserStatus('online', '')
    expect(chat().userStatus).toBe('online')
  })

  it('keeps the rest of the chat state when the status changes', () => {
    useAppStore.getState().setChatOpen(true)
    useAppStore.getState().setUserStatus('away', 'Out')

    expect(chat().open).toBe(true)
  })
})
