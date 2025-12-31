import { render, screen, fireEvent, waitFor } from '../test-utils'
import { AccommodationSection } from '../components/AccommodationSection/AccommodationSection'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'travel.label': 'Travel & Stay',
        'travel.title': 'Accommodation',
        'travel.subtitle': 'Vallesvilles is a rural village...',
        'travel.transportNote': 'If you are not providing your own transportation...',
        'travel.tabs.onsite': 'On-Site',
        'travel.tabs.airbnb': 'Airbnb',
        'travel.tabs.booking': 'Booking.com',
        'travel.tabs.hotels': 'Hotels',
        'travel.onsiteTitle': 'Stay at the Venue',
        'travel.onsiteDescription': 'We offer limited on-site accommodation...',
        'travel.onsiteDetails': 'Priority will be given to immediate family. Email <emailLink>rsvp@carolinaandthomas.com</emailLink>.',
        'travel.viewFloorplan': 'Room Plan',
        'travel.clickToEnlarge': 'Click image to enlarge',
        'travel.airbnbTitle': 'Find Nearby Stays',
        'travel.airbnbDescription': 'Discover charming vacation rentals...',
        'travel.searchAirbnb': 'Search on Airbnb',
        'travel.bookingTitle': 'Search Hotels & More',
        'travel.bookingDescription': 'Find hotels, apartments...',
        'travel.searchBookingButton': 'Search on Booking.com',
        'travel.hotelsTitle': 'Nearby Hotels',
        'travel.hotelsDescription': 'Traditional hotel accommodations...',
        'travel.recommendedHotels': 'Recommended Hotels',
        'travel.hotels.0.name': 'Hôtel & Spa Le Pavillon',
        'travel.hotels.0.location': 'Toulouse (45 min drive)',
        'travel.hotels.0.description': 'Elegant 4-star hotel...',
        'travel.hotels.0.priceRange': '€€€',
        'travel.hotels.1.name': 'Le Domaine des Music',
        'travel.hotels.1.location': 'Montauban (30 min drive)',
        'travel.hotels.1.description': 'Charming countryside hotel...',
        'travel.hotels.1.priceRange': '€€',
        'travel.hotels.2.name': 'Hôtel & Chambre d\'Hôtes de Luxe',
        'travel.hotels.2.location': 'Vallesvilles (5 min drive)',
        'travel.hotels.2.description': 'Boutique bed & breakfast...',
        'travel.hotels.2.priceRange': '€€',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
  Trans: ({ i18nKey, components }: { i18nKey: string; components?: Record<string, React.ReactNode> }) => {
    const text = 'Priority will be given to immediate family. Email rsvp@carolinaandthomas.com.'
    if (components?.emailLink) {
      return (
        <>
          Priority will be given to immediate family. Email{' '}
          <a href="mailto:rsvp@carolinaandthomas.com">rsvp@carolinaandthomas.com</a>.
        </>
      )
    }
    return <>{text}</>
  },
}))

// Mock image imports
jest.mock('../assets/venue_rooms.webp', () => 'venue_rooms.webp')
jest.mock('../assets/airbnb-tile.svg', () => 'airbnb-tile.svg')
jest.mock('../assets/booking-tile.svg', () => 'booking-tile.svg')

describe('AccommodationSection', () => {
  describe('enabled prop', () => {
    it('renders nothing when enabled is false', () => {
      render(<AccommodationSection enabled={false} />)
      // Component returns null, but Chakra adds environment span
      expect(screen.queryByText('Accommodation')).not.toBeInTheDocument()
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })

    it('renders content when enabled is true', () => {
      render(<AccommodationSection enabled={true} />)
      expect(screen.getByText('Accommodation')).toBeInTheDocument()
    })
  })

  describe('section header', () => {
    it('renders the section label', () => {
      render(<AccommodationSection enabled={true} />)
      expect(screen.getByText('Travel & Stay')).toBeInTheDocument()
    })

    it('renders the section title', () => {
      render(<AccommodationSection enabled={true} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Accommodation' })).toBeInTheDocument()
    })

    it('renders the transport note', () => {
      render(<AccommodationSection enabled={true} />)
      expect(screen.getByText(/If you are not providing your own transportation/)).toBeInTheDocument()
    })
  })

  describe('tabs', () => {
    it('renders all four tabs', () => {
      render(<AccommodationSection enabled={true} />)
      
      expect(screen.getByRole('tab', { name: 'On-Site' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Airbnb' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Booking.com' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Hotels' })).toBeInTheDocument()
    })

    it('shows on-site tab content by default', () => {
      render(<AccommodationSection enabled={true} />)
      expect(screen.getByText('Stay at the Venue')).toBeInTheDocument()
    })

    it('switches to Airbnb tab when clicked', async () => {
      render(<AccommodationSection enabled={true} />)
      
      const airbnbTab = screen.getByRole('tab', { name: 'Airbnb' })
      fireEvent.click(airbnbTab)
      
      await waitFor(() => {
        expect(screen.getByText('Find Nearby Stays')).toBeInTheDocument()
      })
    })

    it('switches to Booking.com tab when clicked', async () => {
      render(<AccommodationSection enabled={true} />)
      
      const bookingTab = screen.getByRole('tab', { name: 'Booking.com' })
      fireEvent.click(bookingTab)
      
      await waitFor(() => {
        expect(screen.getByText('Search Hotels & More')).toBeInTheDocument()
      })
    })

    it('switches to Hotels tab when clicked', async () => {
      render(<AccommodationSection enabled={true} />)
      
      const hotelsTab = screen.getByRole('tab', { name: 'Hotels' })
      fireEvent.click(hotelsTab)
      
      await waitFor(() => {
        expect(screen.getByText('Nearby Hotels')).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<AccommodationSection enabled={true} />)
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toHaveTextContent('Accommodation')
    })

    it('has correct section id for navigation', () => {
      render(<AccommodationSection enabled={true} />)
      
      const section = document.getElementById('travel')
      expect(section).toBeInTheDocument()
    })
  })
})
