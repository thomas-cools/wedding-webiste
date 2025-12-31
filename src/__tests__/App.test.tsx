import React from 'react'
import { render, screen } from '../test-utils'
import App from '../App'

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
  const renderAppAndWaitForLazySections = async () => {
    render(<App />)
    // App now lazy-loads some below-the-fold sections; awaiting a few known
    // elements avoids Suspense resolution warnings.
    // RSVP form is now on a separate page, so we don't wait for it here
    await screen.findByText('story.title')
    await screen.findByText('travel.title')
  }

  it('renders the header with couple initials', async () => {
    await renderAppAndWaitForLazySections()
    // i18n mock returns keys, so we check for the translation key in alt attribute
    expect(screen.getByAltText('header.initials')).toBeInTheDocument()
  })

  it('renders the hero section with couple names', async () => {
    await renderAppAndWaitForLazySections()
    // Names now come from translation keys (hero.bride, hero.groom)
    expect(screen.getByText('hero.bride')).toBeInTheDocument()
    expect(screen.getByText('hero.groom')).toBeInTheDocument()
  })

  it('renders the wedding date', async () => {
    await renderAppAndWaitForLazySections()
    // Translation keys for date
    expect(screen.getByText('hero.date')).toBeInTheDocument()
    expect(screen.getByText('hero.year')).toBeInTheDocument()
  })

  it('renders the venue location', async () => {
    await renderAppAndWaitForLazySections()
    // Venue uses translation key
    expect(screen.getAllByText('hero.venue').length).toBeGreaterThan(0)
  })

  it('renders navigation elements', async () => {
    await renderAppAndWaitForLazySections()
    // Navigation uses ghost buttons as links
    const header = document.querySelector('header')
    expect(header).toBeInTheDocument()
    // Check that the header exists and has navigation structure
    expect(header?.querySelector('a[href="#story"]') || header?.textContent?.includes('header.ourStory')).toBeTruthy()
  })

  it('renders the Our Story section', async () => {
    await renderAppAndWaitForLazySections()
    expect(screen.getByText('story.title')).toBeInTheDocument()
    expect(screen.getByText('story.paragraph1')).toBeInTheDocument()
  })

  it('renders the wedding week event cards', async () => {
    await renderAppAndWaitForLazySections()
    expect(screen.getByText('details.welcomeDinner')).toBeInTheDocument()
    expect(screen.getByText('details.theWedding')).toBeInTheDocument()
    expect(screen.getByText('details.farewellBrunch')).toBeInTheDocument()
  })

  it('renders the footer', async () => {
    await renderAppAndWaitForLazySections()
    expect(screen.getByText('footer.contactUs')).toBeInTheDocument()
  })

  it('renders RSVP navigation link pointing to /rsvp page', async () => {
    await renderAppAndWaitForLazySections()
    // RSVP form is now on a separate page, check for the navigation link
    // The nav links use i18n keys, so check for links with 'header.rsvp' text
    const rsvpLinks = screen.getAllByText('header.rsvp')
    expect(rsvpLinks.length).toBeGreaterThan(0)
    // Also check the Hero respond button which links to /rsvp
    const heroRsvpLink = screen.getByRole('link', { name: 'hero.respond' })
    expect(heroRsvpLink).toHaveAttribute('href', '/rsvp')
  })
})
