import React from 'react'
import { render, screen, waitFor } from '../test-utils'
import App from '../App'

// Mock lazy-loaded components to avoid dynamic import issues in Jest
jest.mock('../components/QuickLinks', () => {
  return function MockQuickLinks() {
    return <section id="quick-links">quick-links</section>
  }
})

jest.mock('../components/Countdown', () => {
  return function MockCountdown() {
    return <section id="countdown">countdown</section>
  }
})

jest.mock('../components/Timeline', () => {
  return function MockTimeline() {
    return <section id="timeline">timeline</section>
  }
})

// Mock config to keep weddingConfig
jest.mock('../config', () => ({
  features: {
    showGallery: false,
    showTimeline: false,
    showCountdown: false,
    showStory: true,
    showAccommodation: true,
    requirePassword: false,
    sendRsvpConfirmationEmail: false,
  },
  weddingConfig: {
    couple: {
      person1: 'Carolina',
      person2: 'Thomas',
      initials: 'C & T',
    },
    date: {
      full: new Date('2026-08-26T16:00:00'),
      display: 'August 26, 2026',
    },
    venue: {
      name: 'Vallesvilles',
      location: 'Haute-Garonne, France',
      address: 'Vallesvilles, France',
      website: 'https://maps.google.com/?q=Vallesvilles,+France',
      googleMapsUrl: 'https://maps.google.com/?q=Vallesvilles,+France',
    },
    rsvpDeadline: 'February 1, 2026',
  },
}))

// Mock feature flags context to disable password protection for tests
jest.mock('../contexts/FeatureFlagsContext', () => ({
  FeatureFlagsProvider: ({ children }: { children: React.ReactNode }) => children,
  useFeatureFlags: () => ({
    features: {
      showGallery: false,
      showTimeline: false,
      showCountdown: false,
      showStory: true,
      showAccommodation: true,
      requirePassword: false, // Disable password gate for tests
      sendRsvpConfirmationEmail: false,
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useFeature: (flag: string) => {
    const flags: Record<string, boolean> = {
      showGallery: false,
      showTimeline: false,
      showCountdown: false,
      showStory: true,
      showAccommodation: true,
      requirePassword: false,
      sendRsvpConfirmationEmail: false,
    };
    return flags[flag] ?? false;
  },
  getFeatureFlags: () => ({
    showGallery: false,
    showTimeline: false,
    showCountdown: false,
    showStory: true,
    showAccommodation: true,
    requirePassword: false,
    sendRsvpConfirmationEmail: false,
  }),
}))

// Note: Tests use translation keys since the i18n mock returns keys as-is
describe('App', () => {
  const renderAppAndWait = async () => {
    render(<App />)
    // Wait for Hero to render (always available immediately)
    await screen.findByText('hero.bride')
  }

  it('renders the header with couple initials', async () => {
    await renderAppAndWait()
    // i18n mock returns keys, so we check for the translation key in alt attribute
    expect(screen.getByAltText('header.initials')).toBeInTheDocument()
  })

  it('renders the hero section with couple names', async () => {
    await renderAppAndWait()
    // Names now come from translation keys (hero.bride, hero.groom)
    expect(screen.getByText('hero.bride')).toBeInTheDocument()
    expect(screen.getByText('hero.groom')).toBeInTheDocument()
  })

  it('renders the wedding date', async () => {
    await renderAppAndWait()
    // Translation keys for date
    expect(screen.getByText('hero.date')).toBeInTheDocument()
  })

  it('renders the venue location', async () => {
    await renderAppAndWait()
    // Venue uses translation key
    expect(screen.getAllByText('hero.venue').length).toBeGreaterThan(0)
  })

  it('renders navigation elements', async () => {
    await renderAppAndWait()
    // Navigation uses ghost buttons as links
    const header = document.querySelector('header')
    expect(header).toBeInTheDocument()
    // Check that the header exists and has navigation structure (Details link to timeline is always enabled)
    expect(header?.querySelector('a[href="#timeline"]') || header?.textContent?.includes('header.details')).toBeTruthy()
  })

  it('renders the footer', async () => {
    await renderAppAndWait()
    expect(screen.getByText('footer.contactUs')).toBeInTheDocument()
  })

  it('renders a Details navigation link that scrolls to the wedding timeline', async () => {
    await renderAppAndWait()
    // The nav Details link and the Hero CTA both use the same 'header.details' text/href
    const detailsLinks = screen.getAllByRole('link', { name: 'header.details' })
    expect(detailsLinks.length).toBeGreaterThan(0)
    detailsLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '#timeline')
    })
  })
})
