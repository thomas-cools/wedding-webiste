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
    
    expect(screen.getByText('Main building')).toBeInTheDocument()
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
    
    expect(screen.getAllByText('€150 / night').length).toBeGreaterThan(0)
    expect(screen.getAllByText('€260 / night').length).toBeGreaterThan(0)
    expect(screen.getAllByText('€140 / night').length).toBeGreaterThan(0)
    expect(screen.getAllByText('€70 / night').length).toBeGreaterThan(0)
    expect(screen.getAllByText('€275 / night').length).toBeGreaterThan(0)
  })
})
