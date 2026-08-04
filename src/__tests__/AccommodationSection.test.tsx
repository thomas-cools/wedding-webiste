import { render, screen } from '../test-utils'
import { AccommodationSection } from '../components/AccommodationSection/AccommodationSection'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, optionsOrFallback?: { returnObjects?: boolean } | string) => {
      const translations: Record<string, unknown> = {
        'travel.label': 'Vallesvilles & Toulouse',
        'travel.title': 'Stay',
        'travel.subtitle': 'We are delighted you are staying with us at the chateau.',
        'travel.layout.imageAlt': 'Chateau layout sketch',
        'travel.layout.mainHouse.title': 'Main House',
        'travel.layout.chambre.title': 'Chambre',
        'travel.amenities.title': 'Amenities:',
        'travel.amenities.imageAlt': 'Pool lounge illustration',
        'travel.houseNote': 'Please clean up after yourself to ensure a pleasant experience for all families and friends.',
        'travel.food.title': 'Food',
        'travel.food.note': 'If you need anything while at the venue, here is the closest place to visit.',
        'travel.food.iconAlt': 'Fries icon',
        'travel.food.allergyNote': 'If you have any allergies, please carry the appropriate medication or an EpiPen with you.',
        'travel.pharmacy.iconAlt': 'Pharmacy icon',
        'parking.addressLabel': 'Address:',
        'parking.mapTitle': 'Venue map',
      }

      const options =
        typeof optionsOrFallback === 'object' && optionsOrFallback !== null
          ? optionsOrFallback
          : undefined
      const fallback = typeof optionsOrFallback === 'string' ? optionsOrFallback : undefined

      if (key === 'travel.introParagraphs' && options?.returnObjects) {
        return [
          'Our goal is to make your experience as comfortable as possible.',
          'You can find your exact room name in your reservation email.',
        ]
      }

      if (key === 'travel.layout.mainHouse.guests' && options?.returnObjects) {
        return ['Newlyweds', 'Family Aldeco Cordoba', 'Friends [Verk, Garcia, Ainciburu & Delmas]']
      }

      if (key === 'travel.layout.chambre.guests' && options?.returnObjects) {
        return ["Family Rueb's", 'Family Trejo']
      }

      if (key === 'travel.amenities.items' && options?.returnObjects) {
        return ['1 Pool', '2 shared kitchens', 'Parking lot']
      }

      if (key === 'travel.food.schedule' && options?.returnObjects) {
        return ['On Tuesday, dinner will be served at 18:00.', 'On Thursday, brunch will be served from 10:30 to 14:00.']
      }

      if (key === 'travel.food.store' && options?.returnObjects) {
        return {
          name: 'Carrefour City (7 min in car):',
          address: "All. de l'Eglise, 31280 Dremil-Lafage, France",
          hours: 'Open Monday to Friday from 7:00 AM to 9:30 PM',
          url: 'https://www.carrefour.fr/',
        }
      }

      if (key === 'travel.pharmacy.places' && options?.returnObjects) {
        return [
          {
            name: 'Pharmacie de Lanta (8 min in car):',
            address: '51 Avenue Grand Faubourg, 31590 Verfeil, France',
            phone: 'Phone: +33 5 61 83 78 19',
            hours: 'Open Monday to Friday from 9:00 AM to 12:30 PM and 2:15 PM to 7:30 PM',
            url: 'https://example.com/pharmacie-lanta',
          },
          {
            name: 'Pharmacie du Grand Faubourg (10 min in car)',
            address: '20 Rte de Caraman, 31570 Lanta, France',
            phone: 'Phone: +33 5 61 53 61 47',
            hours: 'Open Monday to Friday from 8:30 AM to 12:30 PM and 2:00 PM to 7:30 PM',
          },
        ]
      }

      return (translations[key] as string) || fallback || key
    },
    i18n: { language: 'en' },
  }),
}))

describe('AccommodationSection', () => {
  describe('enabled prop', () => {
    it('renders nothing when enabled is false', () => {
      render(<AccommodationSection enabled={false} />)
      // Component returns null, but Chakra adds environment span
      expect(screen.queryByText('Stay')).not.toBeInTheDocument()
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })

    it('renders content when enabled is true', () => {
      render(<AccommodationSection enabled={true} />)
      expect(screen.getByText('Stay')).toBeInTheDocument()
    })
  })

  describe('section header', () => {
    it('renders the section title', () => {
      render(<AccommodationSection enabled={true} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Stay' })).toBeInTheDocument()
    })

    it('renders the intro paragraph content', () => {
      render(<AccommodationSection enabled={true} />)
      expect(screen.getByText(/Our goal is to make your experience as comfortable as possible/)).toBeInTheDocument()
    })
  })

  describe('layout', () => {
    it('renders no tab navigation', () => {
      render(<AccommodationSection enabled={true} />)

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })

    it('renders the three required mockup icons', () => {
      render(<AccommodationSection enabled={true} />)

      expect(screen.getByAltText('Chateau layout sketch')).toBeInTheDocument()
      expect(screen.getByAltText('Fries icon')).toBeInTheDocument()
      expect(screen.getByAltText('Pharmacy icon')).toBeInTheDocument()
    })

    it('renders external links when place urls are provided', () => {
      render(<AccommodationSection enabled={true} />)

      const storeLink = screen.getByRole('link', { name: /Carrefour City/i })
      const pharmacyLink = screen.getByRole('link', { name: /Pharmacie de Lanta/i })

      expect(storeLink).toHaveAttribute('href', 'https://www.carrefour.fr/')
      expect(pharmacyLink).toHaveAttribute('href', 'https://example.com/pharmacie-lanta')
    })

    it('renders venue address and embedded map', () => {
      render(<AccommodationSection enabled={true} />)

      expect(screen.getByText('Address:')).toBeInTheDocument()
      expect(screen.getByText(/962 Rte du Pujolet, 31570/)).toBeInTheDocument()
      expect(screen.getByTitle('Venue map')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<AccommodationSection enabled={true} />)
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toHaveTextContent('Stay')
    })

    it('has correct section id for navigation', () => {
      render(<AccommodationSection enabled={true} />)
      
      const section = document.getElementById('travel')
      expect(section).toBeInTheDocument()
    })
  })
})
