/**
 * The global jest.setup.js mocks `localStorage` with a no-op stub that always
 * returns null. Tests that exercise real persistence (e.g. the profile
 * background preference) install a working in-memory Storage for their scope
 * and restore the original stub afterwards.
 */

let original: Storage | undefined

function createMemoryStorage(): Storage {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
  } as Storage
}

export function installMemoryStorage(): void {
  if (original === undefined) {
    original = window.localStorage
  }
  const mem = createMemoryStorage()
  Object.defineProperty(window, 'localStorage', {
    value: mem,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(global, 'localStorage', {
    value: mem,
    writable: true,
    configurable: true,
  })
}

export function restoreStorage(): void {
  if (original === undefined) return
  Object.defineProperty(window, 'localStorage', {
    value: original,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(global, 'localStorage', {
    value: original,
    writable: true,
    configurable: true,
  })
}
