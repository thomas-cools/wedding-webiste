import { render, screen } from '../test-utils'
import Timeline from '../components/Timeline'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'timeline.title': 'Wedding Timeline',
        'timeline.events.welcome.date': 'August 25th, 2026',
        'timeline.events.welcome.title': 'Welcome Dinner',
        'timeline.events.welcome.dressCode': 'Dress Code | Cocktail Attire',
        'timeline.events.wedding.date': 'August 26th, 2026',
        'timeline.events.wedding.title': 'The Wedding',
        'timeline.events.wedding.dressCode': 'Dress Code | Formal',
        'timeline.events.brunch.date': 'August 27th, 2026',
        'timeline.events.brunch.title': 'Pool Brunch',
        'timeline.events.brunch.dressCode': 'Dress Code | Casual',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

// Mock the SVG imports
jest.mock('../assets/Cheers_icon.svg', () => 'cheers-icon.svg')
jest.mock('../assets/WedCake_icon.svg', () => 'wedcake-icon.svg')
jest.mock('../assets/Poolday_icon.svg', () => 'poolday-icon.svg')

describe('Timeline Component', () => {
  it('renders the section title', () => {
    render(<Timeline />)
    
    expect(screen.getByRole('heading', { name: 'Wedding Timeline' })).toBeInTheDocument()
  })

  it('renders all three wedding weekend events', () => {
    render(<Timeline />)
    
    expect(screen.getByText('Welcome Dinner')).toBeInTheDocument()
    expect(screen.getByText('The Wedding')).toBeInTheDocument()
    expect(screen.getByText('Pool Brunch')).toBeInTheDocument()
  })

  it('renders event dates', () => {
    render(<Timeline />)
    
    expect(screen.getByText('August 25th, 2026')).toBeInTheDocument()
    expect(screen.getByText('August 26th, 2026')).toBeInTheDocument()
    expect(screen.getByText('August 27th, 2026')).toBeInTheDocument()
  })

  it('renders dress codes for each event', () => {
    render(<Timeline />)
    
    expect(screen.getByText('Dress Code | Cocktail Attire')).toBeInTheDocument()
    expect(screen.getByText('Dress Code | Formal')).toBeInTheDocument()
    expect(screen.getByText('Dress Code | Casual')).toBeInTheDocument()
  })

  it('has proper heading hierarchy', () => {
    render(<Timeline />)
    
    // Main section title should be h2
    const mainHeading = screen.getByRole('heading', { level: 2 })
    expect(mainHeading).toHaveTextContent('Wedding Timeline')
  })

  it('renders the timeline section with correct id', () => {
    const { container } = render(<Timeline />)
    
    const section = container.querySelector('section#timeline')
    expect(section).toBeInTheDocument()
  })

  it('renders event icons', () => {
    const { container } = render(<Timeline />)
    
    // Check that images are rendered (the icons) - they have empty alt for decorative purposes
    const images = container.querySelectorAll('img')
    expect(images).toHaveLength(3)
  })

  it('renders 3 timeline events', () => {
    render(<Timeline />)
    
    // Count by checking for dates (unique per event)
    expect(screen.getByText('August 25th, 2026')).toBeInTheDocument()
    expect(screen.getByText('August 26th, 2026')).toBeInTheDocument()
    expect(screen.getByText('August 27th, 2026')).toBeInTheDocument()
  })
})
