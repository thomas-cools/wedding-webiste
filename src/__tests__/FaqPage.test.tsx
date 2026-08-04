import React from 'react'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import theme from '../theme'
import FaqPage from '../pages/FaqPage'

beforeAll(() => {
  Element.prototype.scrollTo = jest.fn()
})

jest.mock('@chakra-ui/icons', () => {
  const React = require('react')
  const icon = (testId: string) => (props: Record<string, unknown>) =>
    React.createElement('svg', { 'data-testid': testId, ...props })
  return {
    HamburgerIcon: icon('hamburger-icon'),
    ChevronDownIcon: icon('chevron-down-icon'),
    CheckIcon: icon('check-icon'),
  }
})

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string | Array<{ question: string; answer: string }>> = {
        'header.details': 'header.details',
        'header.faq': 'header.faq',
        'header.travel': 'header.travel',
        'header.transport': 'header.transport',
        'header.registry': 'header.registry',
        'header.initials': 'header.initials',
        'accessibility.mainNavigation': 'accessibility.mainNavigation',
        'accessibility.goHome': 'accessibility.goHome',
        'accessibility.openMenu': 'accessibility.openMenu',
        'faq.label': 'faq.label',
        'faq.title': 'faq.title',
        'faq.description': 'faq.description',
        'faq.contactNote': 'faq.contactNote',
        'faq.transportationLinkLabel': 'faq.transportationLinkLabel',
        'faq.items': [
          {
            question: 'What are the transportation options?',
            answer: 'Take a taxi or shuttle.',
          },
        ],
      }

      const value = translations[key]
      if (Array.isArray(value)) return value as any
      return value ?? fallback ?? key
    },
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ features: { requirePassword: false, showAccommodation: true } }),
}))

jest.mock('../components/FaqSection', () => ({
  __esModule: true,
  FaqSection: () => <div>FAQ Section</div>,
}))

jest.mock('../components/Footer', () => ({
  __esModule: true,
  default: () => <footer>Footer</footer>,
}))

jest.mock('../components/LanguageSwitcher', () => ({
  __esModule: true,
  default: () => <button type="button">Language</button>,
}))

function renderFaqPage() {
  return render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={['/faq']}>
        <FaqPage />
      </MemoryRouter>
    </ChakraProvider>
  )
}

describe('FaqPage', () => {
  it('keeps the Details navigation link visible in the shared header', async () => {
    renderFaqPage()

    await screen.findByText('FAQ Section')
    const detailsLink = await screen.findByText('header.details')
    expect(detailsLink.closest('a')).toHaveAttribute('href', '/#timeline')
  })
})
