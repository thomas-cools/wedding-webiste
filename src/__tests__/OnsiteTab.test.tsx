import { render, screen } from '../test-utils'
import { OnsiteTab } from '../components/AccommodationSection/OnsiteTab'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'travel.onsiteTitle': 'Stay at the Venue',
        'travel.onsiteDescription': 'We offer limited on-site accommodation at the château.',
        'travel.onsiteDetails': 'Priority will be given to immediate family.',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
  Trans: ({ i18nKey, components }: { i18nKey: string; components?: Record<string, React.ReactNode> }) => {
    return (
      <>
        Priority will be given to immediate family. Email{' '}
        <a href="mailto:rsvp@carolinaandthomas.com">rsvp@carolinaandthomas.com</a>.
      </>
    )
  },
}))

describe('OnsiteTab', () => {
  it('renders the title', () => {
    render(<OnsiteTab />)
    expect(screen.getByRole('heading', { name: 'Stay at the Venue' })).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<OnsiteTab />)
    expect(screen.getByText(/We offer limited on-site accommodation/)).toBeInTheDocument()
  })

  it('renders the email link with mailto href', () => {
    render(<OnsiteTab />)
    
    const emailLink = screen.getByRole('link', { name: 'rsvp@carolinaandthomas.com' })
    expect(emailLink).toHaveAttribute('href', 'mailto:rsvp@carolinaandthomas.com')
  })

  it('renders the building icon', () => {
    render(<OnsiteTab />)
    
    // The SVG icon should be present with aria-hidden
    const svg = document.querySelector('svg[aria-hidden="true"]')
    expect(svg).toBeInTheDocument()
  })
})
