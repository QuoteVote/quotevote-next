import { renderHook } from '@testing-library/react'
import { useHasMounted, useMediaQuery } from '@/hooks/useMediaQuery'

const createMatchMedia = (matches: boolean) =>
  jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))

describe('useMediaQuery', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('returns the client matchMedia snapshot after mount', () => {
    window.matchMedia = createMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('returns false when the query does not match', () => {
    window.matchMedia = createMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('subscribes to media query changes', () => {
    const addEventListener = jest.fn()
    const removeEventListener = jest.fn()
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener,
      removeEventListener,
      dispatchEvent: jest.fn(),
    }))

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    unmount()
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})

describe('useHasMounted', () => {
  it('is true in the client test environment after render', () => {
    const { result } = renderHook(() => useHasMounted())
    expect(result.current).toBe(true)
  })
})
