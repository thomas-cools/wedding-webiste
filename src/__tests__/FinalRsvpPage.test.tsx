import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import theme from '../theme'
import FinalRsvpPage from '../pages/FinalRsvpPage'

// Mock scrollTo for Chakra Menu (LanguageSwitcher)
beforeAll(() => {
  Element.prototype.scrollTo = jest.fn()
})

// Local override: the global setupTests mock for @chakra-ui/icons doesn't
// include ArrowBackIcon (used for this page's "Back" button) or ChevronDownIcon
// (used by LanguageSwitcher), so re-declare the full set needed here.
jest.mock('@chakra-ui/icons', () => {
  const React = require('react')
  const icon = (testId: string) => (props: Record<string, unknown>) =>
    React.createElement('svg', { 'data-testid': testId, ...props })
  return {
    ArrowBackIcon: icon('arrow-back-icon'),
    ChevronDownIcon: icon('chevron-down-icon'),
    CheckIcon: icon('check-icon'),
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

// Bypass the password gate so the page content renders directly
jest.mock('../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ features: { requirePassword: false } }),
}))

// Stub out the heavy lazy-loaded form — only the page-level language effect is under test
jest.mock('../components/FinalRsvp/FinalRsvpForm', () => ({
  __esModule: true,
  default: () => <div>Final RSVP Form</div>,
}))

function renderAt(path: string) {
  return render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <FinalRsvpPage />
      </MemoryRouter>
    </ChakraProvider>
  )
}

describe('FinalRsvpPage — applies ?lang= on mount', () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear()
    mockI18n.language = 'en'
  })

  it('calls changeLanguage with a valid, different lang query param', async () => {
    renderAt('/final-rsvp?t=sometoken&lang=es')

    await screen.findByText('Final RSVP Form')
    expect(mockChangeLanguage).toHaveBeenCalledWith('es')
  })

  it('does not call changeLanguage when lang matches the current language', async () => {
    renderAt('/final-rsvp?t=sometoken&lang=en')

    await screen.findByText('Final RSVP Form')
    expect(mockChangeLanguage).not.toHaveBeenCalled()
  })

  it('does not call changeLanguage for an unsupported lang value', async () => {
    renderAt('/final-rsvp?t=sometoken&lang=fr')

    await screen.findByText('Final RSVP Form')
    expect(mockChangeLanguage).not.toHaveBeenCalled()
  })

  it('does not call changeLanguage when no lang param is present', async () => {
    renderAt('/final-rsvp?t=sometoken')

    await screen.findByText('Final RSVP Form')
    expect(mockChangeLanguage).not.toHaveBeenCalled()
  })
})
