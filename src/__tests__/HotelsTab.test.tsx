import { render, screen } from '../test-utils'
import { HotelsTab } from '../components/AccommodationSection/HotelsTab'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'travel.hotelsTitle': 'Nearby Hotels',
        'travel.hotelsDescription': 'Traditional hotel accommodations in the area.',
        'travel.recommendedHotels': 'Recommended Hotels',
        'travel.hotels.0.name': 'Hôtel & Spa Le Pavillon',
        'travel.hotels.0.location': 'Toulouse (45 min drive)',
        'travel.hotels.0.description': 'Elegant 4-star hotel with spa facilities and fine dining.',
        'travel.hotels.0.priceRange': '€€€',
        'travel.hotels.1.name': 'Le Domaine des Music',
        'travel.hotels.1.location': 'Montauban (30 min drive)',
        'travel.hotels.1.description': 'Charming countryside hotel in a restored manor house.',
        'travel.hotels.1.priceRange': '€€',
        'travel.hotels.2.name': 'Hôtel & Chambre d\'Hôtes de Luxe',
        'travel.hotels.2.location': 'Vallesvilles (5 min drive)',
        'travel.hotels.2.description': 'Boutique bed & breakfast with personalized service.',
        'travel.hotels.2.priceRange': '€€',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

describe('HotelsTab', () => {
  it('renders the section title', () => {
    render(<HotelsTab />)
    expect(screen.getByRole('heading', { name: 'Nearby Hotels' })).toBeInTheDocument()
  })

  it('renders the section description', () => {
    render(<HotelsTab />)
    expect(screen.getByText(/Traditional hotel accommodations/)).toBeInTheDocument()
  })

  it('renders the recommended hotels label', () => {
    render(<HotelsTab />)
    expect(screen.getByText('Recommended Hotels')).toBeInTheDocument()
  })

  it('renders all three hotel cards', () => {
    render(<HotelsTab />)
    
    expect(screen.getByText('Hôtel & Spa Le Pavillon')).toBeInTheDocument()
    expect(screen.getByText('Le Domaine des Music')).toBeInTheDocument()
    expect(screen.getByText("Hôtel & Chambre d'Hôtes de Luxe")).toBeInTheDocument()
  })

  it('renders hotel locations', () => {
    render(<HotelsTab />)
    
    expect(screen.getByText('Toulouse (45 min drive)')).toBeInTheDocument()
    expect(screen.getByText('Montauban (30 min drive)')).toBeInTheDocument()
    expect(screen.getByText('Vallesvilles (5 min drive)')).toBeInTheDocument()
  })

  it('renders hotel descriptions', () => {
    render(<HotelsTab />)
    
    expect(screen.getByText(/Elegant 4-star hotel/)).toBeInTheDocument()
    expect(screen.getByText(/Charming countryside hotel/)).toBeInTheDocument()
    expect(screen.getByText(/Boutique bed & breakfast/)).toBeInTheDocument()
  })

  it('renders hotel price ranges', () => {
    render(<HotelsTab />)
    
    expect(screen.getByText('€€€')).toBeInTheDocument()
    // Two hotels have €€ price range
    const midPriceRanges = screen.getAllByText('€€')
    expect(midPriceRanges).toHaveLength(2)
  })
})
