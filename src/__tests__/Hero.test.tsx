import { render, screen } from '../test-utils'
import Hero from '../components/Hero'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'hero.together': 'Together with their families',
        'hero.bride': 'Carolina',
        'hero.groom': 'Thomas',
        'hero.and': '&',
        'hero.date': 'August Twenty-Sixth',
        'hero.year': 'Two Thousand Twenty-Six',
        'hero.venue': 'Vallesvilles · Haute-Garonne, France',
        'hero.respond': 'Kindly Respond',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

describe('Hero Component', () => {
  it('renders couple names', () => {
    render(<Hero />)
    
    expect(screen.getByText('Carolina')).toBeInTheDocument()
    expect(screen.getByText('Thomas')).toBeInTheDocument()
  })

  it('renders the ampersand between names', () => {
    render(<Hero />)
    
    expect(screen.getByText('&')).toBeInTheDocument()
  })

  it('renders the wedding date', () => {
    render(<Hero />)
    
    expect(screen.getByText('August Twenty-Sixth')).toBeInTheDocument()
    expect(screen.getByText('Two Thousand Twenty-Six')).toBeInTheDocument()
  })

  it('renders the venue information', () => {
    render(<Hero />)
    
    expect(screen.getByText('Vallesvilles · Haute-Garonne, France')).toBeInTheDocument()
  })

  it('renders the "together with families" text', () => {
    render(<Hero />)
    
    expect(screen.getByText('Together with their families')).toBeInTheDocument()
  })

  it('renders the respond link styled as button', () => {
    render(<Hero />)
    
    // It's a link styled as a button, not a button element
    expect(screen.getByRole('link', { name: /kindly respond/i })).toBeInTheDocument()
  })

  it('respond link points to RSVP section', () => {
    render(<Hero />)
    
    const link = screen.getByRole('link', { name: /kindly respond/i })
    expect(link).toHaveAttribute('href', '#rsvp')
  })

  it('renders with default styling when no background image', () => {
    const { container } = render(<Hero />)
    
    // Hero section should exist
    const heroSection = container.querySelector('section#hero')
    expect(heroSection).toBeInTheDocument()
  })

  it('renders with background image when provided', () => {
    const testImageUrl = 'https://example.com/wedding-photo.jpg'
    const { container } = render(<Hero backgroundImage={testImageUrl} />)
    
    // Hero section should still exist
    const heroSection = container.querySelector('section#hero')
    expect(heroSection).toBeInTheDocument()
  })

  it('has h1 headings for couple names', () => {
    render(<Hero />)
    
    // Should have two h1 elements for the couple names
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(2)
    expect(headings[0]).toHaveTextContent('Carolina')
    expect(headings[1]).toHaveTextContent('Thomas')
  })

  it('renders scroll indicator link to story section', () => {
    render(<Hero />)
    
    // The scroll indicator is a link to #story
    const scrollLink = screen.getByRole('link', { name: '' })
    expect(scrollLink).toHaveAttribute('href', '#story')
  })

  it('hides scroll indicator when disabled', () => {
    render(<Hero showScrollIndicator={false} />)

    expect(screen.queryByRole('link', { name: '' })).not.toBeInTheDocument()
  })
})
