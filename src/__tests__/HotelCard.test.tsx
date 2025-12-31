import { render, screen } from '../test-utils'
import { HotelCard, Hotel } from '../components/AccommodationSection/HotelCard'

describe('HotelCard', () => {
  const mockHotel: Hotel = {
    name: 'Test Hotel',
    location: 'Test City (30 min drive)',
    description: 'A lovely test hotel with great amenities.',
    priceRange: '€€€',
  }

  it('renders the hotel name', () => {
    render(<HotelCard hotel={mockHotel} />)
    expect(screen.getByRole('heading', { name: 'Test Hotel' })).toBeInTheDocument()
  })

  it('renders the hotel location', () => {
    render(<HotelCard hotel={mockHotel} />)
    expect(screen.getByText('Test City (30 min drive)')).toBeInTheDocument()
  })

  it('renders the hotel description', () => {
    render(<HotelCard hotel={mockHotel} />)
    expect(screen.getByText('A lovely test hotel with great amenities.')).toBeInTheDocument()
  })

  it('renders the price range badge', () => {
    render(<HotelCard hotel={mockHotel} />)
    expect(screen.getByText('€€€')).toBeInTheDocument()
  })

  it('renders different price ranges correctly', () => {
    const cheapHotel: Hotel = {
      ...mockHotel,
      priceRange: '€',
    }
    
    render(<HotelCard hotel={cheapHotel} />)
    expect(screen.getByText('€')).toBeInTheDocument()
  })

  it('handles long hotel names gracefully', () => {
    const longNameHotel: Hotel = {
      ...mockHotel,
      name: 'Hôtel & Chambre d\'Hôtes de Luxe with Extra Long Name',
    }
    
    render(<HotelCard hotel={longNameHotel} />)
    expect(screen.getByRole('heading', { name: longNameHotel.name })).toBeInTheDocument()
  })
})
