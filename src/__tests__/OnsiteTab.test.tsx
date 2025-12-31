import { render, screen, fireEvent } from '../test-utils'
import { OnsiteTab } from '../components/AccommodationSection/OnsiteTab'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'travel.onsiteTitle': 'Stay at the Venue',
        'travel.onsiteDescription': 'We offer limited on-site accommodation at the château.',
        'travel.onsiteDetails': 'Priority will be given to immediate family.',
        'travel.viewFloorplan': 'Room Plan',
        'travel.clickToEnlarge': 'Click image to enlarge',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
  Trans: ({ i18nKey, components }: { i18nKey: string; components?: Record<string, React.ReactNode> }) => {
    return (
      <>
        Priority will be given to immediate family. Email{' '}
        <a href="mailto:rsvp@carolinaandthomas.com">rsvp@carolinaandthomas.com</a>.
      </>
    )
  },
}))

// Mock image imports
jest.mock('../assets/venue_rooms.webp', () => 'venue_rooms.webp')

describe('OnsiteTab', () => {
  const mockOnOpenModal = jest.fn()

  beforeEach(() => {
    mockOnOpenModal.mockClear()
  })

  it('renders the title', () => {
    render(<OnsiteTab onOpenModal={mockOnOpenModal} />)
    expect(screen.getByRole('heading', { name: 'Stay at the Venue' })).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<OnsiteTab onOpenModal={mockOnOpenModal} />)
    expect(screen.getByText(/We offer limited on-site accommodation/)).toBeInTheDocument()
  })

  it('renders the email link with mailto href', () => {
    render(<OnsiteTab onOpenModal={mockOnOpenModal} />)
    
    const emailLink = screen.getByRole('link', { name: 'rsvp@carolinaandthomas.com' })
    expect(emailLink).toHaveAttribute('href', 'mailto:rsvp@carolinaandthomas.com')
  })

  it('renders the room plan image', () => {
    render(<OnsiteTab onOpenModal={mockOnOpenModal} />)
    
    const image = screen.getByAltText('Room Plan')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'venue_rooms.webp')
  })

  it('renders the click to enlarge hint', () => {
    render(<OnsiteTab onOpenModal={mockOnOpenModal} />)
    expect(screen.getByText('Click image to enlarge')).toBeInTheDocument()
  })

  it('calls onOpenModal when clicking the image container', () => {
    render(<OnsiteTab onOpenModal={mockOnOpenModal} />)
    
    const imageContainer = screen.getByRole('button', { name: 'Click image to enlarge' })
    fireEvent.click(imageContainer)
    
    expect(mockOnOpenModal).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenModal when pressing Enter on the image container', () => {
    render(<OnsiteTab onOpenModal={mockOnOpenModal} />)
    
    const imageContainer = screen.getByRole('button', { name: 'Click image to enlarge' })
    fireEvent.keyDown(imageContainer, { key: 'Enter' })
    
    expect(mockOnOpenModal).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenModal when pressing Space on the image container', () => {
    render(<OnsiteTab onOpenModal={mockOnOpenModal} />)
    
    const imageContainer = screen.getByRole('button', { name: 'Click image to enlarge' })
    fireEvent.keyDown(imageContainer, { key: ' ' })
    
    expect(mockOnOpenModal).toHaveBeenCalledTimes(1)
  })
})
