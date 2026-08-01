import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { FaqSection } from '../components/FaqSection'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string | Array<{ question: string; answer: string }>> = {
        'faq.label': 'FAQ',
        'faq.title': 'Frequently Asked Questions',
        'faq.description': 'Helpful details for the weekend',
        'faq.contactNote': 'Still have questions?',
        'faq.transportationLinkLabel': 'See our taxi page',
        'faq.items': [
          {
            question: 'What are the transportation options?',
            answer: 'The nearest major airport is Toulouse-Blagnac (TLS), approximately 35 minutes from the venue. We recommend renting a car or arranging a taxi.',
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

jest.mock('../components/animations', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  StaggerContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  StaggerItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('FaqSection', () => {
  it('renders a link to the taxi page for transportation questions', async () => {
    const user = userEvent.setup()
    render(<FaqSection />)

    await user.click(screen.getByRole('button', { name: /what are the transportation options/i }))

    const taxiLink = screen.getByRole('link', { name: /see our taxi page/i })
    expect(taxiLink).toHaveAttribute('href', '/taxi')
  })
})
