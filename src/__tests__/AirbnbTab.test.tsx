import { render, screen } from '../test-utils'
import { AirbnbTab } from '../components/AccommodationSection'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'travel.airbnbTitle': 'Find Nearby Stays',
        'travel.airbnbDescription': 'Discover charming vacation rentals and unique accommodations near the venue on Airbnb.',
        'travel.searchAirbnb': 'Search on Airbnb',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

// Mock image imports
jest.mock('../assets/airbnb-tile.svg', () => 'airbnb-tile.svg')

describe('AirbnbTab', () => {
  it('renders the title', () => {
    render(<AirbnbTab />)
    expect(screen.getByRole('heading', { name: 'Find Nearby Stays' })).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<AirbnbTab />)
    expect(screen.getByText(/Discover charming vacation rentals/)).toBeInTheDocument()
  })

  it('renders the Airbnb logo', () => {
    render(<AirbnbTab />)
    
    const logo = screen.getByAltText('Airbnb')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', 'airbnb-tile.svg')
  })

  it('renders the search button as an external link', () => {
    render(<AirbnbTab />)
    
    const button = screen.getByRole('link', { name: /Search on Airbnb/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', expect.stringContaining('airbnb.com'))
    expect(button).toHaveAttribute('target', '_blank')
    expect(button).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('includes correct search parameters in Airbnb URL', () => {
    render(<AirbnbTab />)
    
    const button = screen.getByRole('link', { name: /Search on Airbnb/i })
    const href = button.getAttribute('href')
    
    expect(href).toContain('Vallesvilles')
    expect(href).toContain('checkin=2026-08-24')
    expect(href).toContain('checkout=2026-08-28')
  })
})
