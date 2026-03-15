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
        'travel.perNight': '/ night',
        'travel.perPersonPerNight': 'per person per night',
        'travel.mainBuilding.title': 'Main Building',
        'travel.mainBuilding.description': '1 kitchen, 6 bedrooms, 6 bathrooms (20 persons)',
        'travel.mainBuilding.rooms.india.name': 'Bedroom India',
        'travel.mainBuilding.rooms.india.subtitle': '(2 persons / 1st floor)',
        'travel.mainBuilding.rooms.india.amenities': '*Private bathroom, shower, sink, WC',
        'travel.mainBuilding.rooms.pyrenees.name': "Pyrenees' Bedroom",
        'travel.mainBuilding.rooms.pyrenees.subtitle': '(4 persons (2 in the room, 2 in the antechamber))',
        'travel.mainBuilding.rooms.pyrenees.amenities': '*Private bathroom, shower, sink, WC',
        'travel.mainBuilding.rooms.provence.name': 'Bedroom Provence',
        'travel.mainBuilding.rooms.provence.subtitle': '(2 persons / 1st floor)',
        'travel.mainBuilding.rooms.provence.amenities': '*Private bathroom, shower, sink, WC',
        'travel.mainBuilding.rooms.occitanie.name': 'Bedroom Occitanie',
        'travel.mainBuilding.rooms.occitanie.subtitle': '(2 persons / 1st floor)',
        'travel.mainBuilding.rooms.occitanie.amenities': 'Private bathroom, shower, sink, WC',
        'travel.mainBuilding.rooms.lauragais.name': "Lauragais' Dormitory",
        'travel.mainBuilding.rooms.lauragais.subtitle': '(8 persons / 1st floor)',
        'travel.mainBuilding.rooms.lauragais.amenities': '*2 Shared bathroom, shower, sink, WC (to confirm)',
        'travel.annex.title': 'Annex',
        'travel.annex.description': '1 kitchen, 4 bedrooms, 4 bathrooms (14 persons)',
        'travel.annex.rooms.room1.name': 'Ground Floor (Room 1)',
        'travel.annex.rooms.room2.name': 'Ground Floor (Room 2 - family)',
        'travel.annex.rooms.room3.name': '1st Floor (Room 3)',
        'travel.annex.rooms.room4.name': '1st Floor (Room 4)',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
  Trans: ({ i18nKey, components }: { i18nKey: string; components?: Record<string, React.ReactNode> }) => {
    return (
      <>
        Priority will be given to immediate family. Email{' '}
        <a href="mailto:carolinaandthomaswedding@gmail.com">carolinaandthomaswedding@gmail.com</a>.
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
    
    const emailLink = screen.getByRole('link', { name: 'carolinaandthomaswedding@gmail.com' })
    expect(emailLink).toHaveAttribute('href', 'mailto:carolinaandthomaswedding@gmail.com')
  })

  it('renders the building icon', () => {
    render(<OnsiteTab />)
    
    // The SVG icon should be present with aria-hidden
    const svg = document.querySelector('svg[aria-hidden="true"]')
    expect(svg).toBeInTheDocument()
  })

  it('renders Main building section with room details', () => {
    render(<OnsiteTab />)
    
    expect(screen.getByText('Main Building')).toBeInTheDocument()
    expect(screen.getByText(/1 kitchen, 6 bedrooms, 6 bathrooms \(20 persons\)/)).toBeInTheDocument()
    
    expect(screen.getByText(/Bedroom India/)).toBeInTheDocument()
    expect(screen.getByText(/Pyrenees' Bedroom/)).toBeInTheDocument()
    expect(screen.getByText(/Bedroom Provence/)).toBeInTheDocument()
    expect(screen.getByText(/Bedroom Occitanie/)).toBeInTheDocument()
    expect(screen.getByText(/Lauragais' Dormitory/)).toBeInTheDocument()
  })

  it('renders Annex section header', () => {
    render(<OnsiteTab />)
    
    expect(screen.getByText('Annex')).toBeInTheDocument()
    expect(screen.getByText(/1 kitchen, 4 bedrooms, 4 bathrooms \(14 persons\)/)).toBeInTheDocument()
  })

  it('displays room prices', () => {
    render(<OnsiteTab />)
    
    expect(screen.getAllByText('€230 / night').length).toBeGreaterThan(0)
    expect(screen.getAllByText('€350 / night').length).toBeGreaterThan(0)
    expect(screen.getAllByText('€185 / night').length).toBeGreaterThan(0)
    expect(screen.getAllByText('€80 per person per night').length).toBeGreaterThan(0)
    expect(screen.getAllByText('€365 / night').length).toBeGreaterThan(0)
  })
})
