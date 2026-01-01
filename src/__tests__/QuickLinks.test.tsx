import { render, screen } from '../test-utils'
import { QuickLinks } from '../components/QuickLinks'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'story.label': 'Our Story',
        'story.title': 'Two Worlds, One Heart',
        'header.rsvp': 'RSVP',
        'header.faq': 'FAQ',
        'quickLinks.stay': 'STAY',
      }
      return translations[key] || fallback || key
    },
    i18n: { language: 'en' },
  }),
}))

// Mock the SVG imports
jest.mock('../assets/love_birds.svg', () => 'love-birds-icon.svg')
jest.mock('../assets/Luchador_icon.svg', () => 'luchador-icon.svg')
jest.mock('../assets/rest_icon.svg', () => 'rest-icon.svg')

describe('QuickLinks Component', () => {
  it('renders the section header with label', () => {
    render(<QuickLinks />)
    
    expect(screen.getByText('Our Story')).toBeInTheDocument()
  })

  it('renders the section title', () => {
    render(<QuickLinks />)
    
    expect(screen.getByRole('heading', { name: 'Two Worlds, One Heart' })).toBeInTheDocument()
  })

  it('renders all three quick link labels', () => {
    render(<QuickLinks />)
    
    expect(screen.getByText('RSVP')).toBeInTheDocument()
    expect(screen.getByText('FAQ')).toBeInTheDocument()
    expect(screen.getByText('STAY')).toBeInTheDocument()
  })

  it('renders links to correct routes', () => {
    render(<QuickLinks />)
    
    const rsvpLink = screen.getByRole('link', { name: /rsvp/i })
    const faqLink = screen.getByRole('link', { name: /faq/i })
    const stayLink = screen.getByRole('link', { name: /stay/i })
    
    expect(rsvpLink).toHaveAttribute('href', '/rsvp')
    expect(faqLink).toHaveAttribute('href', '/faq')
    expect(stayLink).toHaveAttribute('href', '/accommodations')
  })

  it('renders icons for each quick link', () => {
    render(<QuickLinks />)
    
    const rsvpIcon = screen.getByAltText('RSVP')
    const faqIcon = screen.getByAltText('FAQ')
    const stayIcon = screen.getByAltText('Stay')
    
    expect(rsvpIcon).toBeInTheDocument()
    expect(faqIcon).toBeInTheDocument()
    expect(stayIcon).toBeInTheDocument()
  })

  it('has proper heading hierarchy', () => {
    render(<QuickLinks />)
    
    // Main section title should be h2
    const mainHeading = screen.getByRole('heading', { level: 2 })
    expect(mainHeading).toHaveTextContent('Two Worlds, One Heart')
  })

  it('renders the section with correct id', () => {
    const { container } = render(<QuickLinks />)
    
    const section = container.querySelector('section#quick-links')
    expect(section).toBeInTheDocument()
  })

  it('renders three icon images', () => {
    const { container } = render(<QuickLinks />)
    
    const images = container.querySelectorAll('img')
    expect(images).toHaveLength(3)
  })

  it('applies correct styling to labels', () => {
    render(<QuickLinks />)
    
    const rsvpLabel = screen.getByText('RSVP')
    
    // Check that it has the elegant font family style applied
    expect(rsvpLabel).toHaveStyle({ textTransform: 'uppercase' })
  })
})
