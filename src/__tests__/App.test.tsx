import React from 'react'
import { render, screen } from '../test-utils'
import App from '../App'

// Mock config to disable password protection for tests
jest.mock('../config', () => ({
  features: {
    showGallery: false,
    showTimeline: false,
    showCountdown: false,
    requirePassword: false, // Disable password gate for tests
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
      name: 'Château de Varennes',
      location: 'Burgundy, France',
      address: '21320 Pouilly-en-Auxois, Burgundy, France',
    },
    rsvpDeadline: 'June 1, 2026',
  },
}))

// Note: Tests use translation keys since the i18n mock returns keys as-is
describe('App', () => {
  it('renders the header with couple initials', () => {
    render(<App />)
    // i18n mock returns keys, so we check for the translation key
    expect(screen.getAllByText('header.initials').length).toBeGreaterThan(0)
  })

  it('renders the hero section with couple names', () => {
    render(<App />)
    // Names now come from translation keys (hero.bride, hero.groom)
    expect(screen.getByText('hero.bride')).toBeInTheDocument()
    expect(screen.getByText('hero.groom')).toBeInTheDocument()
  })

  it('renders the wedding date', () => {
    render(<App />)
    // Translation keys for date
    expect(screen.getByText('hero.date')).toBeInTheDocument()
    expect(screen.getByText('hero.year')).toBeInTheDocument()
  })

  it('renders the venue location', () => {
    render(<App />)
    // Venue uses translation key
    expect(screen.getAllByText('hero.venue').length).toBeGreaterThan(0)
  })

  it('renders navigation elements', () => {
    render(<App />)
    // Navigation uses ghost buttons as links
    const header = document.querySelector('header')
    expect(header).toBeInTheDocument()
    // Check that the header exists and has navigation structure
    expect(header?.querySelector('a[href="#story"]') || header?.textContent?.includes('header.ourStory')).toBeTruthy()
  })

  it('renders the Our Story section', () => {
    render(<App />)
    expect(screen.getByText('story.title')).toBeInTheDocument()
    expect(screen.getByText('story.paragraph1')).toBeInTheDocument()
  })

  it('renders the wedding weekend event cards', () => {
    render(<App />)
    expect(screen.getByText('details.welcomeDinner')).toBeInTheDocument()
    expect(screen.getByText('details.theWedding')).toBeInTheDocument()
    expect(screen.getByText('details.farewellBrunch')).toBeInTheDocument()
  })

  it('renders the RSVP section', () => {
    render(<App />)
    // RsvpForm is not yet translated, check for hardcoded text
    expect(screen.getByRole('heading', { name: /rsvp/i })).toBeInTheDocument()
  })

  it('renders the footer', () => {
    render(<App />)
    expect(screen.getByText('footer.madeWith')).toBeInTheDocument()
  })

  it('renders the RSVP form within the page', () => {
    render(<App />)
    // Check the RSVP form is rendered - now uses translation keys
    expect(screen.getByText('rsvp.form.yourName')).toBeInTheDocument()
    expect(screen.getByText('rsvp.form.email')).toBeInTheDocument()
  })
})
