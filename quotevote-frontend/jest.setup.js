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

// Mock window.scrollTo (only in jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: jest.fn(),
  })
}

// Mock window.matchMedia (only in jsdom environment)
if (typeof window !== 'undefined') {
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
}

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
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
}

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  })
}

// Suppress console errors and warnings from ErrorBoundary and Radix UI during tests
// These are expected when components hit error boundaries or Radix UI validation in test environment
const originalError = console.error
const originalWarn = console.warn
beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Only suppress errors related to ErrorBoundary, undefined component types, and Radix UI accessibility warnings
    // This prevents noise from expected error boundary catches and test environment warnings while preserving real errors
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
    
    // Check if this is a Radix UI Dialog accessibility warning
    // These appear in test environment even when DialogTitle/DialogDescription are properly included
    const isRadixDialogWarning = 
      (errorString.includes('DialogContent') && errorString.includes('DialogTitle')) ||
      (errorString.includes('DialogContent') && errorString.includes('DialogDescription')) ||
      (errorString.includes('requires a `DialogTitle`')) ||
      (errorString.includes('requires a `DialogDescription`')) ||
      (errorString.includes('DialogContent') && errorString.includes('accessible for screen reader'))
    
    // Check if this is a jsdom navigation error (expected in test environment)
    const isJsdomNavigationError = 
      errorString.includes('Not implemented: navigation') ||
      errorString.includes('navigation (except hash changes)')
    
    // Check if this is a React 19 fill attribute warning (we handle fill properly in components)
    const isFillAttributeWarning = 
      errorString.includes('Received `true` for a non-boolean attribute `fill`') ||
      (errorString.includes('fill') && errorString.includes('non-boolean attribute'))
    
    if (isExpectedError || isRadixDialogWarning || isJsdomNavigationError || isFillAttributeWarning) {
      // Suppress these expected errors - they're caught by ErrorBoundary or are test environment warnings
      return
    }
    
    // Log all other errors normally
    originalError(...args)
  })

  console.warn = jest.fn((...args) => {
    // Suppress Radix UI DialogDescription warnings in test environment
    // These warnings appear even when DialogDescription is properly included
    // due to timing issues in test rendering
    const warnString = args
      .map(arg => {
        if (typeof arg === 'string') return arg
        if (arg?.toString) return arg.toString()
        return String(arg)
      })
      .join(' ')
    
    // Suppress DialogDescription warnings - we properly include DialogDescription in components
    if (warnString.includes('Missing `Description`') && warnString.includes('DialogContent')) {
      return
    }
    
    // Log all other warnings normally
    originalWarn(...args)
  })
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Set up environment variables for tests
process.env.NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'
process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql'
process.env.NODE_ENV = 'test'

