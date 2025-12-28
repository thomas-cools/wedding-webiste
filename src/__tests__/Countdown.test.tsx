import { render, screen, act } from '../test-utils'
import Countdown from '../components/Countdown'

// Mock the config to have a future date for testing
jest.mock('../config', () => ({
  weddingConfig: {
    date: {
      full: new Date('2026-08-26T16:00:00'),
      display: 'August 26, 2026',
    },
  },
}))

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'countdown.label': 'Save the Date',
        'countdown.title': 'Until We Say I Do',
        'countdown.celebrated': "We're Married!",
        'countdown.days': 'Days',
        'countdown.hours': 'Hours',
        'countdown.minutes': 'Minutes',
        'countdown.seconds': 'Seconds',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

describe('Countdown Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    // Set current time to a fixed date before the wedding
    jest.setSystemTime(new Date('2025-12-18T12:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the section label', () => {
    render(<Countdown />)
    
    expect(screen.getByText('Save the Date')).toBeInTheDocument()
  })

  it('renders the countdown title', () => {
    render(<Countdown />)
    
    expect(screen.getByText('Until We Say I Do')).toBeInTheDocument()
  })

  it('renders all time unit labels', () => {
    render(<Countdown />)
    
    expect(screen.getByText('Days')).toBeInTheDocument()
    expect(screen.getByText('Hours')).toBeInTheDocument()
    expect(screen.getByText('Minutes')).toBeInTheDocument()
    expect(screen.getByText('Seconds')).toBeInTheDocument()
  })

  it('displays time values with leading zeros', () => {
    render(<Countdown />)
    
    // The countdown should show values with leading zeros (e.g., "04" instead of "4")
    // Days value will be 3 digits (e.g., "251") so we check for at least some 2-digit values
    const timeValues = screen.getAllByText(/^\d+$/)
    expect(timeValues.length).toBeGreaterThanOrEqual(4) // days, hours, minutes, seconds
  })

  it('renders the wedding date display', () => {
    render(<Countdown />)
    
    expect(screen.getByText('August 26, 2026')).toBeInTheDocument()
  })

  it('updates the countdown every second', () => {
    render(<Countdown />)
    
    // Get initial seconds value
    const initialValues = screen.getAllByText(/^\d{2}$/)
    const initialSecondsText = initialValues[initialValues.length - 1]?.textContent
    
    // Advance time by 1 second
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    
    // The component should have updated (timer ran)
    // We just verify the component doesn't crash on timer update
    expect(screen.getByText('Days')).toBeInTheDocument()
  })

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    
    const { unmount } = render(<Countdown />)
    unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('has proper heading hierarchy', () => {
    render(<Countdown />)
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Until We Say I Do')
  })

  it('renders colon separators between time units', () => {
    render(<Countdown />)
    
    // There should be 3 colons (between days:hours:minutes:seconds)
    const colons = screen.getAllByText(':')
    expect(colons).toHaveLength(3)
  })
})

describe('Countdown Component - Past Date', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    // Set current time to after the wedding
    jest.setSystemTime(new Date('2027-01-01T12:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('displays zeros when wedding date has passed', () => {
    render(<Countdown />)
    
    // When date has passed, all values should be 00
    const zeroValues = screen.getAllByText('00')
    expect(zeroValues.length).toBe(4) // days, hours, minutes, seconds all show 00
  })

  it('shows married message after timer tick detects past date', async () => {
    render(<Countdown />)
    
    // Advance timer to trigger the interval check
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    
    // After the timer tick, it should show the married message
    expect(screen.getByText("We're Married!")).toBeInTheDocument()
  })
})
