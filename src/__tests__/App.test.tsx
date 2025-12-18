import React from 'react'
import { render, screen } from '../test-utils'
import App from '../App'

describe('App', () => {
  it('renders the header with couple initials', () => {
    render(<App />)
    // Multiple instances of S & L exist (header and footer)
    expect(screen.getAllByText('S & L').length).toBeGreaterThan(0)
  })

  it('renders the hero section with couple names', () => {
    render(<App />)
    expect(screen.getByText('Sofia')).toBeInTheDocument()
    expect(screen.getByText('Lucas')).toBeInTheDocument()
  })

  it('renders the wedding date', () => {
    render(<App />)
    expect(screen.getByText('October Eighteenth')).toBeInTheDocument()
    expect(screen.getByText('Two Thousand Twenty-Six')).toBeInTheDocument()
  })

  it('renders the venue location', () => {
    render(<App />)
    // Multiple venue references exist
    expect(screen.getAllByText(/Château de Varennes/i).length).toBeGreaterThan(0)
  })

  it('renders navigation elements', () => {
    render(<App />)
    // Navigation uses ghost buttons as links
    const header = document.querySelector('header')
    expect(header).toBeInTheDocument()
    // Check that the header exists and has navigation structure
    expect(header?.querySelector('a[href="#story"]') || header?.textContent?.includes('Our Story')).toBeTruthy()
  })

  it('renders the Our Story section', () => {
    render(<App />)
    expect(screen.getByText('Two Worlds, One Heart')).toBeInTheDocument()
    expect(screen.getByText(/vibrant streets of Mexico City/i)).toBeInTheDocument()
  })

  it('renders the wedding weekend event cards', () => {
    render(<App />)
    expect(screen.getByText('Welcome Dinner')).toBeInTheDocument()
    expect(screen.getByText('The Wedding')).toBeInTheDocument()
    expect(screen.getByText('Farewell Brunch')).toBeInTheDocument()
  })

  it('renders the RSVP section', () => {
    render(<App />)
    // "Kindly Respond" appears in both the RSVP button and section header
    expect(screen.getAllByText(/kindly respond/i).length).toBeGreaterThan(0)
  })

  it('renders the footer', () => {
    render(<App />)
    expect(screen.getByText(/Made with love/i)).toBeInTheDocument()
  })

  it('renders the RSVP form within the page', () => {
    render(<App />)
    // Check the RSVP form is rendered
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
  })
})
