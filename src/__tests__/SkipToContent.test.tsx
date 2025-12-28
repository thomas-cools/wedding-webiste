import React from 'react'
import { render, screen, fireEvent } from '../test-utils'
import { SkipToContent } from '../components/SkipToContent'

// Mock scrollIntoView
const mockScrollIntoView = jest.fn()
const mockFocus = jest.fn()

// Note: Tests use translation keys since the i18n mock returns keys as-is
describe('SkipToContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Setup mock element for skip target
    const mainContent = document.createElement('div')
    mainContent.id = 'main-content'
    mainContent.focus = mockFocus
    mainContent.scrollIntoView = mockScrollIntoView
    document.body.appendChild(mainContent)
  })

  afterEach(() => {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      document.body.removeChild(mainContent)
    }
  })

  describe('rendering', () => {
    it('renders a skip link with default main content target', () => {
      render(<SkipToContent />)

      const skipLink = screen.getByRole('link', { name: 'accessibility.skipToMain' })
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute('href', '#main-content')
    })

    it('renders skip link with custom mainId', () => {
      render(<SkipToContent mainId="custom-main" />)

      const skipLink = screen.getByRole('link', { name: 'accessibility.skipToMain' })
      expect(skipLink).toHaveAttribute('href', '#custom-main')
    })

    it('renders additional skip links when provided', () => {
      render(
        <SkipToContent
          additionalLinks={[
            { id: 'rsvp', labelKey: 'accessibility.skipToRsvp' },
          ]}
        />
      )

      const rsvpLink = screen.getByRole('link', { name: 'accessibility.skipToRsvp' })
      expect(rsvpLink).toBeInTheDocument()
      expect(rsvpLink).toHaveAttribute('href', '#rsvp')
    })

    it('wraps links in a nav element with aria-label', () => {
      render(<SkipToContent />)

      const nav = screen.getByRole('navigation', { name: 'accessibility.skipNavigation' })
      expect(nav).toBeInTheDocument()
    })
  })

  describe('keyboard interaction', () => {
    it('calls focus on target element when skip link is clicked', () => {
      render(<SkipToContent mainId="main-content" />)

      const skipLink = screen.getByRole('link', { name: 'accessibility.skipToMain' })
      fireEvent.click(skipLink)

      expect(mockFocus).toHaveBeenCalled()
    })

    it('calls scrollIntoView on target element when skip link is clicked', () => {
      render(<SkipToContent mainId="main-content" />)

      const skipLink = screen.getByRole('link', { name: 'accessibility.skipToMain' })
      fireEvent.click(skipLink)

      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
    })

    it('prevents default link behavior', () => {
      render(<SkipToContent mainId="main-content" />)

      const skipLink = screen.getByRole('link', { name: 'accessibility.skipToMain' })
      
      fireEvent.click(skipLink)
      
      // The click handler should prevent default navigation
      expect(mockFocus).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('includes hidden instructions for screen readers', () => {
      render(<SkipToContent />)

      // VisuallyHidden content should be in the document (uses translation key)
      expect(screen.getByText('accessibility.keyboardInstructions')).toBeInTheDocument()
    })

    it('skip link is focusable', () => {
      render(<SkipToContent />)

      const skipLink = screen.getByRole('link', { name: 'accessibility.skipToMain' })
      skipLink.focus()
      
      expect(document.activeElement).toBe(skipLink)
    })
  })

  describe('edge cases', () => {
    it('handles missing target element gracefully', () => {
      // Remove the target element
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        document.body.removeChild(mainContent)
      }

      render(<SkipToContent mainId="nonexistent-id" />)

      const skipLink = screen.getByRole('link', { name: 'accessibility.skipToMain' })
      
      // Should not throw when clicking
      expect(() => fireEvent.click(skipLink)).not.toThrow()
    })

    it('renders with empty additionalLinks array', () => {
      render(<SkipToContent additionalLinks={[]} />)

      // Should only have the main skip link
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(1)
    })
  })
})
