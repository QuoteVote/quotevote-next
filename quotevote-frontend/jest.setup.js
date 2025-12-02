// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ priority, unoptimized, ...props }) => {
    // Filter out Next.js-specific props that shouldn't be passed to DOM
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})

// Suppress console errors from ErrorBoundary during tests
// These errors are expected when components hit error boundaries in test environment
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Only suppress errors related to ErrorBoundary and undefined component types
    // This prevents noise from expected error boundary catches while preserving real errors
    const errorString = args
      .map(arg => {
        if (typeof arg === 'string') return arg
        if (arg instanceof Error) return arg.message + ' ' + arg.stack
        if (arg?.message) return arg.message
        if (arg?.toString) return arg.toString()
        return String(arg)
      })
      .join(' ')
    
    // Check if this is an expected ErrorBoundary error
    const isExpectedError = 
      errorString.includes('Element type is invalid') ||
      errorString.includes('Check the render method of') ||
      (errorString.includes('ErrorBoundary') && errorString.includes('undefined'))
    
    if (isExpectedError) {
      // Suppress these expected errors - they're caught by ErrorBoundary
      return
    }
    
    // Log all other errors normally
    originalError(...args)
  })
})

afterAll(() => {
  console.error = originalError
})

// Set up environment variables for tests
process.env.NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'
process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql'
process.env.NODE_ENV = 'test'

