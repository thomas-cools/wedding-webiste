import { render, screen, fireEvent } from '../test-utils'
import { RoomPlanModal } from '../components/AccommodationSection'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'travel.viewFloorplan': 'Room Plan',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

// Mock image imports
jest.mock('../assets/venue_rooms.webp', () => 'venue_rooms.webp')

describe('RoomPlanModal', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('renders nothing when closed', () => {
    render(<RoomPlanModal isOpen={false} onClose={mockOnClose} />)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the modal when open', () => {
    render(<RoomPlanModal isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders the room plan image when open', () => {
    render(<RoomPlanModal isOpen={true} onClose={mockOnClose} />)
    
    const image = screen.getByAltText('Room Plan')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'venue_rooms.webp')
  })

  it('renders a close button', () => {
    render(<RoomPlanModal isOpen={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<RoomPlanModal isOpen={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('has proper accessibility attributes', () => {
    render(<RoomPlanModal isOpen={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toHaveAttribute('aria-label', 'Close modal')
  })
})
