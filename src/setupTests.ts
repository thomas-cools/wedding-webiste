import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { webcrypto } from 'crypto'

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder

// Polyfill Web Crypto API for jsdom (Node 18+)
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: true,
})

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
  Trans: ({ i18nKey, children }: { i18nKey: string; children?: React.ReactNode }) => i18nKey || children,
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}))

// Mock @chakra-ui/icons
jest.mock('@chakra-ui/icons', () => {
  const React = require('react')
  return {
    ExternalLinkIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'external-link-icon', ...props }),
    ChevronDownIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'chevron-down-icon', ...props }),
    CloseIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'close-icon', ...props }),
    HamburgerIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'hamburger-icon', ...props }),
    CheckIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'check-icon', ...props }),
    WarningIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'warning-icon', ...props }),
    InfoIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'info-icon', ...props }),
    ViewIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'view-icon', ...props }),
    ViewOffIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'view-off-icon', ...props }),
  }
})

// Mock window.matchMedia for Chakra UI
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })

  // Mock scrollTo
  window.scrollTo = jest.fn()
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver for Framer Motion scroll animations
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: jest.fn(() => []),
}))

// Mock fetch for Netlify Forms (returns a resolved promise)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock
