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
        'faq.parkingLinkLabel': 'See our parking page',
        'faq.timelineLinkLabel': 'See the detailed timeline',
        'parking.addressLabel': 'Address:',
        'parking.mapTitle': 'Venue map',
        'faq.items': [
          {
            question: 'When and where is the wedding?',
            answer: 'Our wedding ceremony will take place on August 26, 2026 at Vallesvilles, France.',
          },
          {
            question: 'What are the transportation options?',
            answer: 'The nearest major airport is Toulouse-Blagnac (TLS), approximately 35 minutes from the venue. We recommend renting a car or arranging a taxi.',
          },
          {
            question: 'What time should I arrive?',
            answer: 'We recommend arriving 15-30 minutes before each event begins to find your seat and settle in.',
          },
          {
            question: 'Is there parking at the venue?',
            answer: 'Yes, there is free parking available at the venue.',
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

  it('renders a link to the parking page for parking questions', async () => {
    const user = userEvent.setup()
    render(<FaqSection />)

    await user.click(screen.getByRole('button', { name: /is there parking at the venue/i }))

    const parkingLink = screen.getByRole('link', { name: /see our parking page/i })
    expect(parkingLink).toHaveAttribute('href', '/parking')
  })

  it('renders a link to the detailed timeline for arrival-time questions', async () => {
    const user = userEvent.setup()
    render(<FaqSection />)

    await user.click(screen.getByRole('button', { name: /what time should i arrive/i }))

    const timelineLink = screen.getByRole('link', { name: /see the detailed timeline/i })
    expect(timelineLink).toHaveAttribute('href', '/#timeline')
  })

  it('renders timeline link plus address and map embed for when-and-where question', async () => {
    const user = userEvent.setup()
    render(<FaqSection />)

    await user.click(screen.getByRole('button', { name: /when and where is the wedding/i }))

    const timelineLink = screen.getByRole('link', { name: /see the detailed timeline/i })
    expect(timelineLink).toHaveAttribute('href', '/#timeline')

    expect(screen.getByText('Address:')).toBeInTheDocument()
    expect(screen.getByTitle('Venue map')).toBeInTheDocument()
  })
})
