import React from 'react'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import { PhotoGallery, GalleryImage } from '../components/PhotoGallery'

const mockImages: GalleryImage[] = [
  {
    src: '/images/photo1.jpg',
    alt: 'First photo',
    caption: 'Our first date',
    aspectRatio: 4 / 3,
  },
  {
    src: '/images/photo2.jpg',
    alt: 'Second photo',
    aspectRatio: 3 / 4,
  },
  {
    src: '/images/photo3.jpg',
    srcWebp: '/images/photo3.webp',
    alt: 'Third photo with WebP',
    aspectRatio: 1,
  },
]

describe('PhotoGallery Component', () => {
  it('renders section header with translation keys', () => {
    render(<PhotoGallery images={mockImages} />)
    
    expect(screen.getByText('gallery.preheading')).toBeInTheDocument()
    expect(screen.getByText('gallery.title')).toBeInTheDocument()
  })

  it('renders all images in the scattered layout', () => {
    render(<PhotoGallery images={mockImages} />)
    
    const images = screen.getAllByRole('img')
    // Note: includes decorative flower images, so we check for at least our 3 photos
    expect(images.length).toBeGreaterThanOrEqual(3)
  })

  it('renders image alt text correctly', () => {
    render(<PhotoGallery images={mockImages} />)
    
    expect(screen.getByAltText('First photo')).toBeInTheDocument()
    expect(screen.getByAltText('Second photo')).toBeInTheDocument()
    expect(screen.getByAltText('Third photo with WebP')).toBeInTheDocument()
  })

  it('opens lightbox when clicking an image', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    // Find and click the first photo
    const firstPhoto = screen.getByAltText('First photo')
    fireEvent.click(firstPhoto)
    
    // Check that modal opens (close button appears)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /gallery\.close/i })).toBeInTheDocument()
    })
  })

  it('shows image counter in lightbox', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    const firstPhoto = screen.getByAltText('First photo')
    fireEvent.click(firstPhoto)
    
    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })
  })

  it('closes lightbox with close button', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    const firstPhoto = screen.getByAltText('First photo')
    fireEvent.click(firstPhoto)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /gallery\.close/i })).toBeInTheDocument()
    })
    
    const closeButton = screen.getByRole('button', { name: /gallery\.close/i })
    fireEvent.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByText('1 / 3')).not.toBeInTheDocument()
    })
  })

  it('handles keyboard navigation with arrow keys', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    const firstPhoto = screen.getByAltText('First photo')
    fireEvent.click(firstPhoto)
    
    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })
    
    // Navigate right
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })
    
    // Navigate left
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })
  })

  it('closes lightbox with Escape key', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    const firstPhoto = screen.getByAltText('First photo')
    fireEvent.click(firstPhoto)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /gallery\.close/i })).toBeInTheDocument()
    })
    
    fireEvent.keyDown(window, { key: 'Escape' })
    
    await waitFor(() => {
      expect(screen.queryByText('1 / 3')).not.toBeInTheDocument()
    })
  })

  it('wraps around when navigating past last image with keyboard', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    // Open on third image
    const thirdPhoto = screen.getByAltText('Third photo with WebP')
    fireEvent.click(thirdPhoto)
    
    await waitFor(() => {
      expect(screen.getByText('3 / 3')).toBeInTheDocument()
    })
    
    // Navigate right (should wrap to first)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })
  })

  it('wraps around when navigating before first image with keyboard', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    // Open on first image
    const firstPhoto = screen.getByAltText('First photo')
    fireEvent.click(firstPhoto)
    
    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })
    
    // Navigate left (should wrap to last)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    await waitFor(() => {
      expect(screen.getByText('3 / 3')).toBeInTheDocument()
    })
  })

  it('renders with default images when none provided', () => {
    render(<PhotoGallery />)
    
    // Should render default images (C&T photos)
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
  })

  it('renders nothing when empty images array provided', () => {
    render(<PhotoGallery images={[]} />)
    
    // Should not render the gallery section
    expect(screen.queryByText('gallery.title')).not.toBeInTheDocument()
  })

  it('has correct section id for navigation', () => {
    render(<PhotoGallery images={mockImages} />)
    
    const section = document.getElementById('gallery')
    expect(section).toBeInTheDocument()
  })

  it('shows different image when clicking different photos', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    // Open second image
    const secondPhoto = screen.getByAltText('Second photo')
    fireEvent.click(secondPhoto)
    
    await waitFor(() => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })
  })

  it('renders decorative flower images', () => {
    render(<PhotoGallery images={mockImages} />)
    
    // The component renders Belgium flower decorations with empty alt (decorative)
    // So we check for img elements in the document directly
    const allImages = document.querySelectorAll('img')
    // We should have our 3 mock images + decorative flower images + background
    expect(allImages.length).toBeGreaterThan(3)
  })
})
