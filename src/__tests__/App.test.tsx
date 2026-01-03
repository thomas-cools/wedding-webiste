import React from 'react'
import { render, screen, waitFor } from '../test-utils'
import App from '../App'

// Mock lazy-loaded components to avoid dynamic import issues in Jest
jest.mock('../components/StorySection', () => {
  return function MockStorySection() {
    return (
      <section id="story">
        <h2>story.title</h2>
        <p>story.paragraph1</p>
      </section>
    )
  }
})

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
    // Check that the header exists and has navigation structure (RSVP is always enabled)
    expect(header?.querySelector('a[href="/rsvp"]') || header?.textContent?.includes('header.rsvp')).toBeTruthy()
  })

  it('renders the Our Story section', async () => {
    await renderAppAndWait()
    expect(screen.getByText('story.title')).toBeInTheDocument()
    expect(screen.getByText('story.paragraph1')).toBeInTheDocument()
  })



  it('renders the footer', async () => {
    await renderAppAndWait()
    expect(screen.getByText('footer.contactUs')).toBeInTheDocument()
  })

  it('renders RSVP navigation link pointing to /rsvp page', async () => {
    await renderAppAndWait()
    // RSVP form is now on a separate page, check for the navigation link
    // The nav links use i18n keys, so check for links with 'header.rsvp' text
    const rsvpLinks = screen.getAllByText('header.rsvp')
    expect(rsvpLinks.length).toBeGreaterThan(0)
    // Also check the Hero respond button which links to /rsvp
    const heroRsvpLink = screen.getByRole('link', { name: 'hero.respond' })
    expect(heroRsvpLink).toHaveAttribute('href', '/rsvp')
  })
})
