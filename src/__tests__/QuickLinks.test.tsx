import { render, screen } from '../test-utils'
import { QuickLinks } from '../components/QuickLinks'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'quickLinks.title': 'Links',
        'header.rsvp': 'RSVP',
        'header.faq': 'FAQ',
        'quickLinks.stay': 'STAY',
        'quickLinks.registry': 'REGISTRY',
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
jest.mock('../assets/gift_icon.svg', () => 'gift-icon.svg')

describe('QuickLinks Component', () => {
  it('renders the section title', () => {
    render(<QuickLinks />)
    
    expect(screen.getByRole('heading', { name: 'Links' })).toBeInTheDocument()
  })

  it('renders all quick link labels', () => {
    render(<QuickLinks />)
    
    expect(screen.getByText('RSVP')).toBeInTheDocument()
    expect(screen.getByText('FAQ')).toBeInTheDocument()
    expect(screen.getByText('STAY')).toBeInTheDocument()
    expect(screen.getByText('REGISTRY')).toBeInTheDocument()
  })

  it('renders links to correct routes', () => {
    render(<QuickLinks />)
    
    const rsvpLink = screen.getByRole('link', { name: /rsvp/i })
    const faqLink = screen.getByRole('link', { name: /faq/i })
    const stayLink = screen.getByRole('link', { name: /stay/i })
    const registryLink = screen.getByRole('link', { name: /registry/i })
    
    expect(rsvpLink).toHaveAttribute('href', '/rsvp#page-top')
    expect(faqLink).toHaveAttribute('href', '/faq#page-top')
    expect(stayLink).toHaveAttribute('href', '/accommodations#page-top')
    expect(registryLink).toHaveAttribute('href', '/registry#page-top')
  })

  it('renders icons for each quick link', () => {
    render(<QuickLinks />)
    
    const rsvpIcon = screen.getByAltText('RSVP')
    const faqIcon = screen.getByAltText('FAQ')
    const stayIcon = screen.getByAltText('Stay')
    const registryIcon = screen.getByAltText('Registry')
    
    expect(rsvpIcon).toBeInTheDocument()
    expect(faqIcon).toBeInTheDocument()
    expect(stayIcon).toBeInTheDocument()
    expect(registryIcon).toBeInTheDocument()
  })

  it('has proper heading hierarchy', () => {
    render(<QuickLinks />)
    
    // Main section title should be h2
    const mainHeading = screen.getByRole('heading', { level: 2 })
    expect(mainHeading).toHaveTextContent('Links')
  })

  it('renders the section with correct id', () => {
    const { container } = render(<QuickLinks />)
    
    const section = container.querySelector('section#quick-links')
    expect(section).toBeInTheDocument()
  })

  it('renders four icon images', () => {
    const { container } = render(<QuickLinks />)
    
    const images = container.querySelectorAll('img')
    expect(images).toHaveLength(4)
  })

  it('applies correct styling to labels', () => {
    render(<QuickLinks />)
    
    const rsvpLabel = screen.getByText('RSVP')
    
    // Check that it has the elegant font family style applied
    expect(rsvpLabel).toHaveStyle({ textTransform: 'uppercase' })
  })
})
