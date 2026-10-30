/**
 * Availability status rules (#468): labels, defaults and what the public may see.
 */

import {
  DEFAULT_PRESENCE_STATUS,
  OWN_PRESENCE_LABEL,
  PRESENCE_LABEL,
  PRESENCE_STATUS_OPTIONS,
  PUBLIC_PRESENCE_STATUSES,
  STATUS_MESSAGE_MAX_LENGTH,
  toPresenceStatus,
} from '@/lib/constants/presence'
import { getPublicPresence, isDeclaredStatus, toDeclaredStatus } from '@/lib/utils/presence'

describe('presence constants', () => {
  it('calls the online status "Available" and keeps the stored value as "online"', () => {
    expect(PRESENCE_LABEL.online).toBe('Available')
    expect(OWN_PRESENCE_LABEL.online).toBe('Available')
    const option = PRESENCE_STATUS_OPTIONS.find((o) => o.label === 'Available')
    expect(option?.value).toBe('online')
  })

  it('never labels a status "Online"', () => {
    const labels = [
      ...Object.values(PRESENCE_LABEL),
      ...Object.values(OWN_PRESENCE_LABEL),
      ...PRESENCE_STATUS_OPTIONS.map((o) => o.label),
    ]
    labels.forEach((label) => expect(label).not.toMatch(/online/i))
  })

  it('offers the four statuses in order, each with its colored icon', () => {
    expect(PRESENCE_STATUS_OPTIONS.map((o) => `${o.icon} ${o.label}`)).toEqual([
      '🟢 Available',
      '🟡 Away',
      '🔴 Do Not Disturb',
      '⚫ Invisible',
    ])
  })

  it('makes Invisible the default status', () => {
    expect(DEFAULT_PRESENCE_STATUS).toBe('invisible')
  })

  it('shows an Invisible user as Offline to others, but as Invisible to themselves', () => {
    expect(PRESENCE_LABEL.invisible).toBe('Offline')
    expect(OWN_PRESENCE_LABEL.invisible).toBe('Invisible')
  })

  it('only makes Available, Away and Do Not Disturb public', () => {
    expect([...PUBLIC_PRESENCE_STATUSES]).toEqual(['online', 'away', 'dnd'])
  })

  it('keeps the 200 character limit', () => {
    expect(STATUS_MESSAGE_MAX_LENGTH).toBe(200)
  })

  it('maps unknown values to offline', () => {
    expect(toPresenceStatus('away')).toBe('away')
    expect(toPresenceStatus('nonsense')).toBe('offline')
    expect(toPresenceStatus(undefined)).toBe('offline')
  })
})

describe('isDeclaredStatus / toDeclaredStatus', () => {
  it.each(['online', 'away', 'dnd', 'invisible'])('treats "%s" as a status a user can choose', (status) => {
    expect(isDeclaredStatus(status)).toBe(true)
    expect(toDeclaredStatus(status)).toBe(status)
  })

  it.each(['offline', 'busy', '', null, undefined])('falls back to Invisible for %p', (status) => {
    expect(isDeclaredStatus(status)).toBe(false)
    expect(toDeclaredStatus(status)).toBe('invisible')
  })
})

describe('getPublicPresence', () => {
  it.each(['online', 'away', 'dnd'] as const)('shows %s with its message', (status) => {
    expect(getPublicPresence(status, 'Back at 5')).toEqual({ status, statusMessage: 'Back at 5' })
  })

  it('trims the message and treats a blank one as none', () => {
    expect(getPublicPresence('away', '  lunch  ')?.statusMessage).toBe('lunch')
    expect(getPublicPresence('away', '   ')?.statusMessage).toBe('')
    expect(getPublicPresence('away', null)?.statusMessage).toBe('')
    expect(getPublicPresence('away')?.statusMessage).toBe('')
  })

  it('shows nothing for Invisible, even when a message is still stored', () => {
    expect(getPublicPresence('invisible', 'Secret plans')).toBeNull()
  })

  it.each(['offline', 'busy', '', null, undefined])('shows nothing for %p', (status) => {
    expect(getPublicPresence(status, 'hello')).toBeNull()
  })
})
