import { render, screen } from '../test-utils'
import { QuickLinks } from '../components/QuickLinks'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'quickLinks.title': 'Links',
        'header.faq': 'FAQ',
        'quickLinks.stay': 'STAY',
        'quickLinks.transport': 'TRANSPORT',
        'quickLinks.registry': 'REGISTRY',
      }
      return translations[key] || fallback || key
    },
    i18n: { language: 'en' },
  }),
}))

// Mock the SVG imports
jest.mock('../assets/Mexa.svg', () => 'luchador-icon.svg')
jest.mock('../assets/Pillow.svg', () => 'rest-icon.svg')
jest.mock('../assets/Taxi.svg', () => 'taxi-icon.svg')
jest.mock('../assets/JustMarried.svg', () => 'gift-icon.svg')

describe('QuickLinks Component', () => {
  it('renders the section title', () => {
    render(<QuickLinks />)
    
    expect(screen.getByRole('heading', { name: 'Links' })).toBeInTheDocument()
  })

  it('renders all quick link labels', () => {
    render(<QuickLinks />)
    
    expect(screen.getByText('FAQ')).toBeInTheDocument()
    expect(screen.getByText('STAY')).toBeInTheDocument()
    expect(screen.getByText('TRANSPORT')).toBeInTheDocument()
    expect(screen.getByText('REGISTRY')).toBeInTheDocument()
  })

  it('renders links to correct routes', () => {
    render(<QuickLinks />)
    
    const faqLink = screen.getByRole('link', { name: /faq/i })
    const stayLink = screen.getByRole('link', { name: /stay/i })
    const transportLink = screen.getByRole('link', { name: /transport/i })
    const registryLink = screen.getByRole('link', { name: /registry/i })
    
    expect(faqLink).toHaveAttribute('href', '/faq#page-top')
    expect(stayLink).toHaveAttribute('href', '/accommodations#page-top')
    expect(transportLink).toHaveAttribute('href', '/services#page-top')
    expect(registryLink).toHaveAttribute('href', '/registry#page-top')
  })

  it('renders icons for each quick link', () => {
    render(<QuickLinks />)
    
    const faqIcon = screen.getByAltText('FAQ')
    const stayIcon = screen.getByAltText('Stay')
    const transportIcon = screen.getByAltText('Transport')
    const registryIcon = screen.getByAltText('Registry')
    
    expect(faqIcon).toBeInTheDocument()
    expect(stayIcon).toBeInTheDocument()
    expect(transportIcon).toBeInTheDocument()
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
    
    const faqLabel = screen.getByText('FAQ')
    
    // Check that it has the elegant font family style applied
    expect(faqLabel).toHaveStyle({ textTransform: 'uppercase' })
  })
})
