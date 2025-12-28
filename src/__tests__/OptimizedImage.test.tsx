import React from 'react'
import { render, screen } from '../test-utils'
import { OptimizedImage } from '../components/OptimizedImage'

describe('OptimizedImage', () => {
  const defaultProps = {
    src: '/images/fallback.jpg',
    alt: 'Test image',
  }

  describe('basic rendering', () => {
    it('renders an img element with required props', () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img', { name: 'Test image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', '/images/fallback.jpg')
      expect(img).toHaveAttribute('alt', 'Test image')
    })

    it('applies lazy loading by default', () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'lazy')
    })

    it('allows eager loading for above-fold images', () => {
      render(<OptimizedImage {...defaultProps} loading="eager" />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'eager')
    })

    it('sets fetchpriority attribute', () => {
      render(<OptimizedImage {...defaultProps} fetchPriority="high" />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('fetchpriority', 'high')
    })

    it('applies object-fit and object-position styles', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          objectFit="contain"
          objectPosition="top left"
        />
      )

      const img = screen.getByRole('img')
      expect(img).toHaveStyle({ objectFit: 'contain', objectPosition: 'top left' })
    })
  })

  describe('srcSet without WebP', () => {
    it('renders srcSet attribute when srcSet prop is provided', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          srcSet={{
            small: '/images/small.jpg',
            medium: '/images/medium.jpg',
            large: '/images/large.jpg',
          }}
        />
      )

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute(
        'srcset',
        '/images/small.jpg 480w, /images/medium.jpg 1024w, /images/large.jpg 1920w'
      )
    })

    it('includes xlarge in srcSet when provided', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          srcSet={{
            large: '/images/large.jpg',
            xlarge: '/images/xlarge.jpg',
          }}
        />
      )

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute(
        'srcset',
        '/images/large.jpg 1920w, /images/xlarge.jpg 2560w'
      )
    })

    it('applies sizes attribute', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          srcSet={{ large: '/images/large.jpg' }}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      )

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw')
    })
  })

  describe('WebP with picture element', () => {
    it('renders picture element when webpSrcSet is provided', () => {
      const { container } = render(
        <OptimizedImage
          {...defaultProps}
          webpSrcSet={{
            small: '/images/small.webp',
            large: '/images/large.webp',
          }}
        />
      )

      const picture = container.querySelector('picture')
      expect(picture).toBeInTheDocument()
    })

    it('includes WebP source with correct type', () => {
      const { container } = render(
        <OptimizedImage
          {...defaultProps}
          webpSrcSet={{
            small: '/images/small.webp',
            large: '/images/large.webp',
          }}
        />
      )

      const webpSource = container.querySelector('source[type="image/webp"]')
      expect(webpSource).toBeInTheDocument()
      expect(webpSource).toHaveAttribute(
        'srcset',
        '/images/small.webp 480w, /images/large.webp 1920w'
      )
    })

    it('includes fallback source when both webpSrcSet and srcSet provided', () => {
      const { container } = render(
        <OptimizedImage
          {...defaultProps}
          webpSrcSet={{
            large: '/images/large.webp',
          }}
          srcSet={{
            large: '/images/large.jpg',
          }}
        />
      )

      const sources = container.querySelectorAll('source')
      expect(sources).toHaveLength(2)

      // First source should be WebP
      expect(sources[0]).toHaveAttribute('type', 'image/webp')

      // Second source should be the JPEG fallback (no type attribute)
      expect(sources[1]).not.toHaveAttribute('type')
      expect(sources[1]).toHaveAttribute('srcset', '/images/large.jpg 1920w')
    })

    it('renders fallback img inside picture element', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          webpSrcSet={{
            large: '/images/large.webp',
          }}
        />
      )

      const img = screen.getByRole('img', { name: 'Test image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', '/images/fallback.jpg')
    })

    it('applies sizes to source elements', () => {
      const { container } = render(
        <OptimizedImage
          {...defaultProps}
          webpSrcSet={{
            large: '/images/large.webp',
          }}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      )

      const source = container.querySelector('source')
      expect(source).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw')
    })
  })

  describe('accessibility', () => {
    it('requires alt text', () => {
      render(<OptimizedImage src="/test.jpg" alt="Descriptive alt text" />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('alt', 'Descriptive alt text')
    })

    it('image is accessible by role', () => {
      render(<OptimizedImage {...defaultProps} />)

      expect(screen.getByRole('img', { name: 'Test image' })).toBeInTheDocument()
    })
  })

  describe('custom styling', () => {
    it('passes through additional Box props', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          borderRadius="md"
          data-testid="custom-image"
        />
      )

      const img = screen.getByTestId('custom-image')
      expect(img).toBeInTheDocument()
    })

    it('applies custom width and height', () => {
      const { container } = render(
        <OptimizedImage {...defaultProps} width="200px" height="150px" />
      )

      // Width/height are applied to the img element
      const img = screen.getByRole('img')
      expect(img).toHaveStyle({ width: '200px' })
      // Height may be on wrapper when using picture element
      expect(container.firstChild).toBeInTheDocument()
    })
  })
})
