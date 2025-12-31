import React from 'react'
import { render, screen } from '../test-utils'
import { BookingTab } from '../components/AccommodationSection/BookingTab'

// Mock @chakra-ui/icons
jest.mock('@chakra-ui/icons', () => ({
  ExternalLinkIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'external-link-icon', ...props }),
}))

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'travel.bookingTitle': 'Search Hotels & More',
        'travel.bookingDescription': 'Find hotels, apartments, and vacation homes near the venue on Booking.com.',
        'travel.searchBookingButton': 'Search on Booking.com',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

// Mock image imports
jest.mock('../assets/booking-tile.svg', () => 'booking-tile.svg')

describe('BookingTab', () => {
  it('renders the title', () => {
    render(<BookingTab />)
    expect(screen.getByRole('heading', { name: 'Search Hotels & More' })).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<BookingTab />)
    expect(screen.getByText(/Find hotels, apartments/)).toBeInTheDocument()
  })

  it('renders the Booking.com logo', () => {
    render(<BookingTab />)
    
    const logo = screen.getByAltText('Booking.com')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', 'booking-tile.svg')
  })

  it('renders the search button as an external link', () => {
    render(<BookingTab />)
    
    const button = screen.getByRole('link', { name: /Search on Booking.com/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', expect.stringContaining('booking.com'))
    expect(button).toHaveAttribute('target', '_blank')
    expect(button).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('includes correct search parameters in Booking.com URL', () => {
    render(<BookingTab />)
    
    const button = screen.getByRole('link', { name: /Search on Booking.com/i })
    const href = button.getAttribute('href')
    
    expect(href).toContain('Vallesvilles')
    expect(href).toContain('checkin=2026-08-24')
    expect(href).toContain('checkout=2026-08-28')
  })
})
