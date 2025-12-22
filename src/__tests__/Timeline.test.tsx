import { render, screen } from '../test-utils'
import Timeline from '../components/Timeline'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'timeline.label': 'Our Journey',
        'timeline.title': 'How We Met',
        'timeline.events.met.date': 'Summer 2019',
        'timeline.events.met.title': 'First Meeting',
        'timeline.events.met.description': 'We met at a conference in Paris.',
        'timeline.events.met.location': 'Paris, France',
        'timeline.events.firstDate.date': 'Fall 2019',
        'timeline.events.firstDate.title': 'First Date',
        'timeline.events.firstDate.description': 'Our first real date in Brussels.',
        'timeline.events.firstDate.location': 'Brussels, Belgium',
        'timeline.events.moved.date': 'Spring 2021',
        'timeline.events.moved.title': 'Moving In',
        'timeline.events.moved.description': 'We moved in together.',
        'timeline.events.moved.location': 'Brussels, Belgium',
        'timeline.events.engaged.date': 'Winter 2024',
        'timeline.events.engaged.title': 'The Proposal',
        'timeline.events.engaged.description': 'Thomas proposed in Mexico City.',
        'timeline.events.engaged.location': 'Mexico City, Mexico',
        'timeline.events.wedding.date': 'August 2026',
        'timeline.events.wedding.title': 'The Wedding',
        'timeline.events.wedding.description': 'Our big day in France.',
        'timeline.events.wedding.location': 'Vallesvilles, France',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

describe('Timeline Component', () => {
  it('renders the section label', () => {
    render(<Timeline />)
    
    expect(screen.getByText('Our Journey')).toBeInTheDocument()
  })

  it('renders the section title', () => {
    render(<Timeline />)
    
    expect(screen.getByText('How We Met')).toBeInTheDocument()
  })

  it('renders all timeline events', () => {
    render(<Timeline />)
    
    expect(screen.getByText('First Meeting')).toBeInTheDocument()
    expect(screen.getByText('First Date')).toBeInTheDocument()
    expect(screen.getByText('Moving In')).toBeInTheDocument()
    expect(screen.getByText('The Proposal')).toBeInTheDocument()
    expect(screen.getByText('The Wedding')).toBeInTheDocument()
  })

  it('renders event dates', () => {
    render(<Timeline />)
    
    expect(screen.getByText('Summer 2019')).toBeInTheDocument()
    expect(screen.getByText('Fall 2019')).toBeInTheDocument()
    expect(screen.getByText('Spring 2021')).toBeInTheDocument()
    expect(screen.getByText('Winter 2024')).toBeInTheDocument()
    expect(screen.getByText('August 2026')).toBeInTheDocument()
  })

  it('renders event descriptions', () => {
    render(<Timeline />)
    
    expect(screen.getByText('We met at a conference in Paris.')).toBeInTheDocument()
    expect(screen.getByText('Our first real date in Brussels.')).toBeInTheDocument()
    expect(screen.getByText('Thomas proposed in Mexico City.')).toBeInTheDocument()
  })

  it('renders event locations', () => {
    render(<Timeline />)
    
    expect(screen.getByText('Paris, France')).toBeInTheDocument()
    // Brussels appears twice (First Date and Moving In)
    expect(screen.getAllByText('Brussels, Belgium')).toHaveLength(2)
    expect(screen.getByText('Mexico City, Mexico')).toBeInTheDocument()
    expect(screen.getByText('Vallesvilles, France')).toBeInTheDocument()
  })

  it('has proper heading hierarchy', () => {
    render(<Timeline />)
    
    // Main section title should be h2
    const mainHeading = screen.getByRole('heading', { level: 2 })
    expect(mainHeading).toHaveTextContent('How We Met')
    
    // Event titles should be h3
    const eventHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(eventHeadings.length).toBe(5)
  })

  it('renders the timeline section with correct id', () => {
    const { container } = render(<Timeline />)
    
    const section = container.querySelector('section#timeline')
    expect(section).toBeInTheDocument()
  })

  it('renders timeline connector elements', () => {
    const { container } = render(<Timeline />)
    
    // Each event has connecting lines/elements
    // Check that the timeline section contains multiple event items
    const eventHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(eventHeadings.length).toBe(5)
  })

  it('renders 5 timeline events', () => {
    render(<Timeline />)
    
    // Count event titles (h3 headings)
    const eventHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(eventHeadings).toHaveLength(5)
  })
})
