import { render, screen, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import theme from '../theme'
import SpeechesPage from '../pages/SpeechesPage'

jest.mock('@chakra-ui/icons', () => {
  const React = require('react')
  const icon = (testId: string) => (props: Record<string, unknown>) =>
    React.createElement('svg', { 'data-testid': testId, ...props })
  return {
    HamburgerIcon: icon('hamburger-icon'),
    ChevronDownIcon: icon('chevron-down-icon'),
    CheckIcon: icon('check-icon'),
    ViewIcon: icon('view-icon'),
    ViewOffIcon: icon('view-off-icon'),
  }
})

const mockChangeLanguage = jest.fn()
const mockI18n = {
  language: 'en',
  resolvedLanguage: 'en',
  changeLanguage: mockChangeLanguage,
}

let mockAuthenticated = false

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}))

jest.mock('../i18n', () => ({
  languages: [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇲🇽' },
    { code: 'nl', name: 'Nederlands', flag: '🇧🇪' },
  ],
}))

jest.mock('../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ features: { requirePassword: true } }),
}))

jest.mock('../components/PasswordGate', () => {
  const React = require('react')
  const { isAuthenticated } = require('../utils/auth')

  return function MockPasswordGate({ children }: { children: React.ReactNode }) {
    return isAuthenticated() ? React.createElement(React.Fragment, null, children) : React.createElement('div', {
      'data-testid': 'password-input',
    })
  }
})

jest.mock('../utils/auth', () => ({
  authenticateWithToken: jest.fn(async () => {
    mockAuthenticated = true
    return { ok: true, token: 'session-token', expiresIn: 7200 }
  }),
  isAuthenticated: jest.fn(() => mockAuthenticated),
}))

describe('SpeechesPage', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockAuthenticated = false
    sessionStorage.clear()
    localStorage.clear()
  })

  function renderAt(path: string) {
    return render(
      <ChakraProvider theme={theme}>
        <MemoryRouter initialEntries={[path]}>
          <SpeechesPage />
        </MemoryRouter>
      </ChakraProvider>
    )
  }

  it('renders the translated speech for the authenticated page', async () => {
    mockAuthenticated = true
    const fetchMock = jest.spyOn(global, 'fetch' as never).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url === '/api/speeches-documents') {
        return new Response(
          JSON.stringify({
            ok: true,
            documents: [
              {
                id: '11111111-1111-1111-1111-111111111111',
                fileName: 'Guy & Karin',
                speakerKey: 'guy-karin',
                translatedText: 'Gracias a todos por estar aqui hoy.\n\nCelebramos el amor y la familia.',
                detectedLanguage: 'en',
                translatedLanguage: 'es',
                translationStatus: 'success',
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            ],
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        ) as never
      }

      throw new Error(`Unexpected fetch call: ${url}`)
    })

    renderAt('/speeches')

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/speeches-documents',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    expect(await screen.findByText('Speeches')).toBeInTheDocument()
  })

  it('falls back to the password gate when no token is present', async () => {
    renderAt('/speeches')

    expect(await screen.findByTestId('password-input')).toBeInTheDocument()
  })
})