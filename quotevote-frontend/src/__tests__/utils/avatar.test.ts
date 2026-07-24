import { coerceAvatarValue, parseAvatarToUrl, buildAvatarUrl } from '@/lib/avatar'

describe('coerceAvatarValue', () => {
  it('returns strings and plain objects', () => {
    expect(coerceAvatarValue('https://example.com/a.png')).toBe('https://example.com/a.png')
    expect(coerceAvatarValue({ topType: 'Hat' })).toEqual({ topType: 'Hat' })
  })

  it('returns null for nullish and unexpected shapes', () => {
    expect(coerceAvatarValue(null)).toBeNull()
    expect(coerceAvatarValue(undefined)).toBeNull()
    expect(coerceAvatarValue(42)).toBeNull()
    expect(coerceAvatarValue([{ topType: 'Hat' }])).toBeNull()
    expect(coerceAvatarValue(true)).toBeNull()
  })
})

describe('parseAvatarToUrl', () => {
  it('builds an avataaars URL from qualities', () => {
    const url = parseAvatarToUrl({ topType: 'Hat', hairColor: 'Brown' })
    expect(url).toBe(buildAvatarUrl({ topType: 'Hat', hairColor: 'Brown' }))
  })

  it('passes through plain URL strings', () => {
    expect(parseAvatarToUrl('https://cdn.example/a.png')).toBe('https://cdn.example/a.png')
  })
})
