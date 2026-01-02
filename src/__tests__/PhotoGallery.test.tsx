import React from 'react'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import { PhotoGallery, GalleryImage } from '../components/PhotoGallery'

// The PhotoGallery component uses hardcoded timelineData (2017-2025)
// The images prop is only used for the lightbox, not for rendering the timeline
// So tests need to work with the actual timeline alt texts

describe('PhotoGallery Component', () => {
  it('renders section header with translation keys', () => {
    render(<PhotoGallery />)
    
    expect(screen.getByText('gallery.preheading')).toBeInTheDocument()
    expect(screen.getByText('gallery.title')).toBeInTheDocument()
  })

  it('renders all images in the timeline layout', () => {
    render(<PhotoGallery />)
    
    const images = screen.getAllByRole('img')
    // Timeline has 9 photos (2017-2025) + decorative flower images
    expect(images.length).toBeGreaterThanOrEqual(9)
  })

  it('renders image alt text correctly', () => {
    render(<PhotoGallery />)
    
    // Timeline images use "Carolina and Thomas YEAR" alt text
    expect(screen.getAllByAltText('Carolina and Thomas 2017').length).toBeGreaterThan(0)
    expect(screen.getAllByAltText('Carolina and Thomas 2018').length).toBeGreaterThan(0)
    expect(screen.getAllByAltText('Carolina and Thomas 2025').length).toBeGreaterThan(0)
  })

  it('opens lightbox when clicking an image', async () => {
    render(<PhotoGallery />)
    
    // Find and click the first timeline photo
    const firstPhoto = screen.getAllByAltText('Carolina and Thomas 2017')[0]
    fireEvent.click(firstPhoto)
    
    // Check that modal opens (close button appears)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /gallery\.close/i })).toBeInTheDocument()
    })
  })

  it('shows image counter in lightbox', async () => {
    render(<PhotoGallery />)
    
    const firstPhoto = screen.getAllByAltText('Carolina and Thomas 2017')[0]
    fireEvent.click(firstPhoto)
    
    await waitFor(() => {
      expect(screen.getByText('1 / 9')).toBeInTheDocument()
    })
  })

  it('closes lightbox with close button', async () => {
    render(<PhotoGallery />)
    
    const firstPhoto = screen.getAllByAltText('Carolina and Thomas 2017')[0]
    fireEvent.click(firstPhoto)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /gallery\.close/i })).toBeInTheDocument()
    })
    
    const closeButton = screen.getByRole('button', { name: /gallery\.close/i })
    fireEvent.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByText('1 / 9')).not.toBeInTheDocument()
    })
  })

  it('handles keyboard navigation with arrow keys', async () => {
    render(<PhotoGallery />)
    
    const firstPhoto = screen.getAllByAltText('Carolina and Thomas 2017')[0]
    fireEvent.click(firstPhoto)
    
    await waitFor(() => {
      expect(screen.getByText('1 / 9')).toBeInTheDocument()
    })
    
    // Navigate right
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => {
      expect(screen.getByText('2 / 9')).toBeInTheDocument()
    })
    
    // Navigate left
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    await waitFor(() => {
      expect(screen.getByText('1 / 9')).toBeInTheDocument()
    })
  })

  it('closes lightbox with Escape key', async () => {
    render(<PhotoGallery />)
    
    const firstPhoto = screen.getAllByAltText('Carolina and Thomas 2017')[0]
    fireEvent.click(firstPhoto)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /gallery\.close/i })).toBeInTheDocument()
    })
    
    fireEvent.keyDown(window, { key: 'Escape' })
    
    await waitFor(() => {
      expect(screen.queryByText('1 / 9')).not.toBeInTheDocument()
    })
  })

  it('wraps around when navigating past last image with keyboard', async () => {
    render(<PhotoGallery />)
    
    // Open on last image (2025)
    const lastPhoto = screen.getAllByAltText('Carolina and Thomas 2025')[0]
    fireEvent.click(lastPhoto)
    
    await waitFor(() => {
      expect(screen.getByText('9 / 9')).toBeInTheDocument()
    })
    
    // Navigate right (should wrap to first)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => {
      expect(screen.getByText('1 / 9')).toBeInTheDocument()
    })
  })

  it('wraps around when navigating before first image with keyboard', async () => {
    render(<PhotoGallery />)
    
    // Open on first image
    const firstPhoto = screen.getAllByAltText('Carolina and Thomas 2017')[0]
    fireEvent.click(firstPhoto)
    
    await waitFor(() => {
      expect(screen.getByText('1 / 9')).toBeInTheDocument()
    })
    
    // Navigate left (should wrap to last)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    await waitFor(() => {
      expect(screen.getByText('9 / 9')).toBeInTheDocument()
    })
  })

  it('renders with default images when none provided', () => {
    render(<PhotoGallery />)
    
    // Should render default images (C&T photos from 2017-2025)
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
  })

  it('renders nothing when empty images array provided', () => {
    render(<PhotoGallery images={[]} />)
    
    // Should not render the gallery section
    expect(screen.queryByText('gallery.title')).not.toBeInTheDocument()
  })

  it('has correct section id for navigation', () => {
    render(<PhotoGallery />)
    
    const section = document.getElementById('gallery')
    expect(section).toBeInTheDocument()
  })

  it('shows different image when clicking different photos', async () => {
    render(<PhotoGallery />)
    
    // Open second image (2018)
    const secondPhoto = screen.getAllByAltText('Carolina and Thomas 2018')[0]
    fireEvent.click(secondPhoto)
    
    await waitFor(() => {
      expect(screen.getByText('2 / 9')).toBeInTheDocument()
    })
  })

  it('renders decorative flower images', () => {
    render(<PhotoGallery />)
    
    // The component renders Belgium flower decorations with empty alt (decorative)
    // So we check for img elements in the document directly
    const allImages = document.querySelectorAll('img')
    // We should have 9 timeline images + decorative flower images
    expect(allImages.length).toBeGreaterThan(9)
  })
})
