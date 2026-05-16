import { renderHook, act } from '@testing-library/react'
import { useProfileBackground } from '@/hooks/useProfileBackground'
import {
  DEFAULT_PROFILE_BG_COLOR,
  DEFAULT_PROFILE_BG_PATTERN,
} from '@/lib/utils/profileBackground'
import { installMemoryStorage, restoreStorage } from '../utils/memoryStorage'

describe('useProfileBackground', () => {
  beforeEach(() => {
    installMemoryStorage()
  })

  afterEach(() => {
    restoreStorage()
  })

  it('returns defaults when nothing is persisted', () => {
    const { result } = renderHook(() => useProfileBackground())
    expect(result.current.color).toBe(DEFAULT_PROFILE_BG_COLOR)
    expect(result.current.pattern).toBe(DEFAULT_PROFILE_BG_PATTERN)
  })

  it('persists color and pattern to localStorage', () => {
    const { result } = renderHook(() => useProfileBackground())

    act(() => {
      result.current.setColor('#3b82f6')
      result.current.setPattern('zigzag')
    })

    expect(result.current.color).toBe('#3b82f6')
    expect(result.current.pattern).toBe('zigzag')
    expect(localStorage.getItem('profileBgColor')).toBe('#3b82f6')
    expect(localStorage.getItem('profileBgPattern')).toBe('zigzag')
  })

  it('hydrates from previously persisted values', () => {
    localStorage.setItem('profileBgColor', '#ef4444')
    localStorage.setItem('profileBgPattern', 'dots')

    const { result } = renderHook(() => useProfileBackground())
    expect(result.current.color).toBe('#ef4444')
    expect(result.current.pattern).toBe('dots')
  })

  it('sanitizes invalid input before persisting', () => {
    const { result } = renderHook(() => useProfileBackground())

    act(() => {
      result.current.setColor('not-a-color')
      result.current.setPattern('bogus' as 'none')
    })

    expect(result.current.color).toBe(DEFAULT_PROFILE_BG_COLOR)
    expect(result.current.pattern).toBe(DEFAULT_PROFILE_BG_PATTERN)
  })

  it('syncs across hook instances via the change event', () => {
    const a = renderHook(() => useProfileBackground())
    const b = renderHook(() => useProfileBackground())

    act(() => {
      a.result.current.setPattern('stripes')
    })

    expect(b.result.current.pattern).toBe('stripes')
  })
})
