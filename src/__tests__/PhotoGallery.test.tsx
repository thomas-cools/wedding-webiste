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
    expect(screen.getByText('gallery.subtitle')).toBeInTheDocument()
  })

  it('renders all images in the grid', () => {
    render(<PhotoGallery images={mockImages} />)
    
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(3)
  })

  it('renders image alt text correctly', () => {
    render(<PhotoGallery images={mockImages} />)
    
    expect(screen.getByAltText('First photo')).toBeInTheDocument()
    expect(screen.getByAltText('Second photo')).toBeInTheDocument()
    expect(screen.getByAltText('Third photo with WebP')).toBeInTheDocument()
  })

  it('renders caption when provided', () => {
    render(<PhotoGallery images={mockImages} />)
    
    expect(screen.getByText('Our first date')).toBeInTheDocument()
  })

  it('opens lightbox when clicking an image', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    // Find image buttons by their aria-label pattern
    const imageButtons = screen.getAllByRole('button', { name: /gallery\.viewImage.*First photo/i })
    fireEvent.click(imageButtons[0])
    
    // Check that modal opens (close button appears)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /gallery\.close/i })).toBeInTheDocument()
    })
  })

  it('shows image counter in lightbox', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    const imageButtons = screen.getAllByRole('button', { name: /gallery\.viewImage.*First photo/i })
    fireEvent.click(imageButtons[0])
    
    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })
  })

  it('closes lightbox with close button', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    const imageButtons = screen.getAllByRole('button', { name: /gallery\.viewImage.*First photo/i })
    fireEvent.click(imageButtons[0])
    
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
    
    const imageButtons = screen.getAllByRole('button', { name: /gallery\.viewImage.*First photo/i })
    fireEvent.click(imageButtons[0])
    
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
    
    const imageButtons = screen.getAllByRole('button', { name: /gallery\.viewImage.*First photo/i })
    fireEvent.click(imageButtons[0])
    
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
    const imageButtons = screen.getAllByRole('button', { name: /gallery\.viewImage.*Third photo/i })
    fireEvent.click(imageButtons[0])
    
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
    const imageButtons = screen.getAllByRole('button', { name: /gallery\.viewImage.*First photo/i })
    fireEvent.click(imageButtons[0])
    
    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })
    
    // Navigate left (should wrap to last)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    await waitFor(() => {
      expect(screen.getByText('3 / 3')).toBeInTheDocument()
    })
  })

  it('opens lightbox with Enter key on image button', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    const imageButtons = screen.getAllByRole('button', { name: /gallery\.viewImage.*First photo/i })
    fireEvent.keyDown(imageButtons[0], { key: 'Enter' })
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /gallery\.close/i })).toBeInTheDocument()
    })
  })

  it('opens lightbox with Space key on image button', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    const imageButtons = screen.getAllByRole('button', { name: /gallery\.viewImage.*First photo/i })
    fireEvent.keyDown(imageButtons[0], { key: ' ' })
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /gallery\.close/i })).toBeInTheDocument()
    })
  })

  it('renders with default images when none provided', () => {
    render(<PhotoGallery />)
    
    // Should render default placeholder images
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

  it('image buttons are keyboard accessible', () => {
    render(<PhotoGallery images={mockImages} />)
    
    const imageButtons = screen.getAllByRole('button', { name: /gallery\.viewImage/i })
    imageButtons.forEach((button) => {
      expect(button).toHaveAttribute('tabIndex', '0')
    })
  })

  it('renders WebP source when available', () => {
    render(<PhotoGallery images={mockImages} />)
    
    // Check that WebP source elements are rendered
    const sources = document.querySelectorAll('source[type="image/webp"]')
    expect(sources.length).toBeGreaterThan(0)
  })

  it('shows different image when opening different thumbnails', async () => {
    render(<PhotoGallery images={mockImages} />)
    
    // Open second image
    const imageButtons = screen.getAllByRole('button', { name: /gallery\.viewImage.*Second photo/i })
    fireEvent.click(imageButtons[0])
    
    await waitFor(() => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })
  })
})
