import {
  DEFAULT_PROFILE_BG_COLOR,
  DEFAULT_PROFILE_BG_PATTERN,
  PROFILE_BG_COLORS,
  PROFILE_BG_PATTERNS,
  getProfileBackgroundStyle,
  normalizeProfileBgColor,
  normalizeProfileBgPattern,
} from '@/lib/utils/profileBackground'

describe('profileBackground utils', () => {
  describe('normalizeProfileBgColor', () => {
    it('accepts valid 6-digit and 3-digit hex colors', () => {
      expect(normalizeProfileBgColor('#3b82f6')).toBe('#3b82f6')
      expect(normalizeProfileBgColor('#abc')).toBe('#abc')
    })

    it('falls back to the default for invalid or missing values', () => {
      expect(normalizeProfileBgColor('red')).toBe(DEFAULT_PROFILE_BG_COLOR)
      expect(normalizeProfileBgColor('#zzzzzz')).toBe(DEFAULT_PROFILE_BG_COLOR)
      expect(normalizeProfileBgColor('')).toBe(DEFAULT_PROFILE_BG_COLOR)
      expect(normalizeProfileBgColor(null)).toBe(DEFAULT_PROFILE_BG_COLOR)
      expect(normalizeProfileBgColor(undefined)).toBe(DEFAULT_PROFILE_BG_COLOR)
    })
  })

  describe('normalizeProfileBgPattern', () => {
    it('accepts every known pattern', () => {
      PROFILE_BG_PATTERNS.forEach((p) => {
        expect(normalizeProfileBgPattern(p.value)).toBe(p.value)
      })
    })

    it('falls back to the default for unknown patterns', () => {
      expect(normalizeProfileBgPattern('spiral')).toBe(DEFAULT_PROFILE_BG_PATTERN)
      expect(normalizeProfileBgPattern(null)).toBe(DEFAULT_PROFILE_BG_PATTERN)
      expect(normalizeProfileBgPattern(undefined)).toBe(DEFAULT_PROFILE_BG_PATTERN)
    })
  })

  describe('getProfileBackgroundStyle', () => {
    it('always sets the chosen background color', () => {
      const style = getProfileBackgroundStyle('#3b82f6', 'none')
      expect(style.backgroundColor).toBe('#3b82f6')
    })

    it('sanitizes an invalid color back to the default', () => {
      const style = getProfileBackgroundStyle('javascript:alert(1)', 'none')
      expect(style.backgroundColor).toBe(DEFAULT_PROFILE_BG_COLOR)
    })

    it('"none" produces a solid color with no pattern image', () => {
      const style = getProfileBackgroundStyle('#52b274', 'none')
      expect(style.backgroundImage).toBeUndefined()
    })

    it('"zigzag" produces a repeating linear-gradient pattern', () => {
      const style = getProfileBackgroundStyle('#52b274', 'zigzag')
      expect(style.backgroundImage).toContain('linear-gradient')
      expect(style.backgroundSize).toBe('28px 28px')
      expect(style.backgroundRepeat).toBe('repeat')
    })

    it('"dots", "stripes" and "grid" each set a backgroundImage', () => {
      expect(getProfileBackgroundStyle('#52b274', 'dots').backgroundImage).toContain(
        'radial-gradient'
      )
      expect(
        getProfileBackgroundStyle('#52b274', 'stripes').backgroundImage
      ).toContain('repeating-linear-gradient')
      expect(getProfileBackgroundStyle('#52b274', 'grid').backgroundImage).toContain(
        'linear-gradient'
      )
    })
  })

  it('exposes a non-empty curated color and pattern list', () => {
    expect(PROFILE_BG_COLORS.length).toBeGreaterThan(0)
    expect(PROFILE_BG_COLORS[0]).toBe(DEFAULT_PROFILE_BG_COLOR)
    expect(PROFILE_BG_PATTERNS.map((p) => p.value)).toContain('zigzag')
  })
})
