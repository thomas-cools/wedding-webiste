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

describe('SpeechesPage', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
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

  it('exchanges a valid token and renders the speeches page', async () => {
    const fetchMock = jest.spyOn(global, 'fetch' as never).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, token: 'session-token', expiresIn: 7200 }),
    } as never)

    renderAt('/speeches?t=link-token')

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/.netlify/functions/auth',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'link-token' }),
          credentials: 'include',
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