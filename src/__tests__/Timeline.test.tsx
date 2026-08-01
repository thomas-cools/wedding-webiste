import { render, screen } from '../test-utils'
import Timeline from '../components/Timeline'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) => {
      const translations: Record<string, string> = {
        'timeline.label': 'wedding timeline',
        'timeline.title': 'Details',
        'timeline.intro': 'Intro text',
        'timeline.introClosing': 'Closing text',
        'timeline.schedule.day1.label': 'Welcome Dinner',
        'timeline.schedule.day1.date': 'August 25th, 2026',
        'timeline.schedule.day1.dressCode': 'Dress Code | Semi-Formal',
        'timeline.schedule.day2.label': 'The Wedding',
        'timeline.schedule.day2.date': 'August 26th, 2026',
        'timeline.schedule.day2.dressCode': 'Dress Code | Formal',
        'timeline.schedule.day3.label': 'Pool Brunch',
        'timeline.schedule.day3.date': 'August 27th, 2026',
        'timeline.schedule.day3.dressCode': 'Dress Code | Casual',
      }

      const itemsByKey: Record<string, { time: string; label: string }[]> = {
        'timeline.schedule.day1.items': [
          { time: '14:00', label: 'Check-in' },
          { time: '18:00 – 22:00', label: 'Welcome Dinner' },
        ],
        'timeline.schedule.day2.items': [
          { time: '16:00', label: 'Welcome Drinks' },
          { time: '16:30', label: 'Ceremony' },
          { time: '17:15 – 2:00', label: 'Celebration' },
        ],
        'timeline.schedule.day3.items': [
          { time: '10:30', label: 'Brunch and Pool' },
          { time: '17:00', label: 'Check-out' },
        ],
      }

      if (options?.returnObjects && itemsByKey[key]) {
        return itemsByKey[key]
      }

      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

describe('Timeline Component', () => {
  it('renders the section heading', () => {
    render(<Timeline />)

    expect(screen.getByRole('heading', { name: 'wedding timeline' })).toBeInTheDocument()
  })

  it('renders all three days with their dates', () => {
    render(<Timeline />)

    // "Welcome Dinner" appears both as the day heading and as a schedule item label
    expect(screen.getAllByText('Welcome Dinner').length).toBeGreaterThan(0)
    expect(screen.getByText('August 25th, 2026')).toBeInTheDocument()
    expect(screen.getByText('The Wedding')).toBeInTheDocument()
    expect(screen.getByText('August 26th, 2026')).toBeInTheDocument()
    expect(screen.getByText('Pool Brunch')).toBeInTheDocument()
    expect(screen.getByText('August 27th, 2026')).toBeInTheDocument()
  })

  it('renders each schedule item time and label', () => {
    render(<Timeline />)

    expect(screen.getByText('14:00')).toBeInTheDocument()
    expect(screen.getByText('Check-in')).toBeInTheDocument()
    expect(screen.getByText('18:00 – 22:00')).toBeInTheDocument()
    // "Welcome Dinner" appears both as the day heading and as this schedule item's label
    expect(screen.getAllByText('Welcome Dinner')).toHaveLength(2)

    expect(screen.getByText('16:00')).toBeInTheDocument()
    expect(screen.getByText('Welcome Drinks')).toBeInTheDocument()
    expect(screen.getByText('16:30')).toBeInTheDocument()
    expect(screen.getByText('Ceremony')).toBeInTheDocument()
    expect(screen.getByText('17:15 – 2:00')).toBeInTheDocument()
    expect(screen.getByText('Celebration')).toBeInTheDocument()

    expect(screen.getByText('10:30')).toBeInTheDocument()
    expect(screen.getByText('Brunch and Pool')).toBeInTheDocument()
    expect(screen.getByText('17:00')).toBeInTheDocument()
    expect(screen.getByText('Check-out')).toBeInTheDocument()
  })

  it('renders a dress code link per day pointing to the correct FAQ anchor', () => {
    render(<Timeline />)

    expect(screen.getByText('Dress Code | Semi-Formal').closest('a')).toHaveAttribute(
      'href',
      '/faq#dress-code-welcome'
    )
    expect(screen.getByText('Dress Code | Formal').closest('a')).toHaveAttribute(
      'href',
      '/faq#dress-code-wedding'
    )
    expect(screen.getByText('Dress Code | Casual').closest('a')).toHaveAttribute(
      'href',
      '/faq#dress-code-brunch'
    )
  })

  it('has proper heading hierarchy', () => {
    render(<Timeline />)

    // Main section title should be h2
    const mainHeading = screen.getByRole('heading', { level: 2 })
    expect(mainHeading).toBeInTheDocument()
  })

  it('renders the timeline section with correct id', () => {
    const { container } = render(<Timeline />)

    const section = container.querySelector('section#timeline')
    expect(section).toBeInTheDocument()
  })
})
