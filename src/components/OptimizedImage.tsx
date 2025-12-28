import { Box, BoxProps } from '@chakra-ui/react'

/**
 * Responsive image source configuration.
 * Provide multiple sizes for optimal loading on different devices.
 */
export interface ImageSrcSet {
  /** Small/mobile image (up to 480px viewport) */
  small?: string
  /** Medium/tablet image (481-1024px viewport) */
  medium?: string
  /** Large/desktop image (1025px+ viewport) */
  large: string
  /** Extra large for retina displays (optional) */
  xlarge?: string
}

export interface OptimizedImageProps extends Omit<BoxProps, 'as'> {
  /** Primary image source (required fallback) */
  src: string
  /** Responsive srcSet for different viewport sizes */
  srcSet?: ImageSrcSet
  /** WebP versions for better compression (auto-served by modern browsers) */
  webpSrcSet?: ImageSrcSet
  /** Alt text for accessibility (required) */
  alt: string
  /** Loading strategy: 'lazy' (default) or 'eager' for above-fold images */
  loading?: 'lazy' | 'eager'
  /** Fetch priority hint for critical images */
  fetchPriority?: 'high' | 'low' | 'auto'
  /** Object-fit style */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  /** Object-position style */
  objectPosition?: string
  /** Width (can be responsive) */
  width?: BoxProps['width']
  /** Height (can be responsive) */
  height?: BoxProps['height']
  /** Sizes attribute for responsive images (e.g., "(max-width: 768px) 100vw, 50vw") */
  sizes?: string
}

/**
 * OptimizedImage component that provides:
 * - Responsive images with srcSet
 * - WebP format with fallback
 * - Lazy loading by default
 * - Proper accessibility with alt text
 * 
 * @example
 * // Simple usage
 * <OptimizedImage
 *   src={myImage}
 *   alt="Description"
 * />
 * 
 * @example
 * // With responsive WebP
 * <OptimizedImage
 *   src={fallbackJpg}
 *   webpSrcSet={{
 *     small: smallWebp,
 *     medium: mediumWebp,
 *     large: largeWebp,
 *   }}
 *   alt="Hero image"
 *   loading="eager"
 *   fetchPriority="high"
 * />
 */
export function OptimizedImage({
  src,
  srcSet,
  webpSrcSet,
  alt,
  loading = 'lazy',
  fetchPriority = 'auto',
  objectFit = 'cover',
  objectPosition = 'center',
  width = '100%',
  height = '100%',
  sizes,
  ...boxProps
}: OptimizedImageProps) {
  // Build srcSet strings
  const buildSrcSetString = (set: ImageSrcSet): string => {
    const parts: string[] = []
    if (set.small) parts.push(`${set.small} 480w`)
    if (set.medium) parts.push(`${set.medium} 1024w`)
    if (set.large) parts.push(`${set.large} 1920w`)
    if (set.xlarge) parts.push(`${set.xlarge} 2560w`)
    return parts.join(', ')
  }

  const hasWebp = webpSrcSet && Object.keys(webpSrcSet).length > 0
  const hasJpgSrcSet = srcSet && Object.keys(srcSet).length > 0

  // Use picture element for WebP with fallback
  if (hasWebp) {
    return (
      <Box
        as="picture"
        display="block"
        width={width}
        height={height}
        {...boxProps}
      >
        {/* WebP source (preferred) */}
        <source
          type="image/webp"
          srcSet={buildSrcSetString(webpSrcSet)}
          sizes={sizes}
        />
        
        {/* JPEG/PNG fallback source */}
        {hasJpgSrcSet && (
          <source
            srcSet={buildSrcSetString(srcSet)}
            sizes={sizes}
          />
        )}
        
        {/* Fallback img element */}
        <Box
          as="img"
          src={src}
          alt={alt}
          loading={loading}
          // @ts-expect-error - fetchpriority is valid but not in React types yet
          fetchpriority={fetchPriority}
          width="100%"
          height="100%"
          objectFit={objectFit}
          objectPosition={objectPosition}
          display="block"
        />
      </Box>
    )
  }

  // Simple img with optional srcSet
  return (
    <Box
      as="img"
      src={src}
      srcSet={hasJpgSrcSet ? buildSrcSetString(srcSet) : undefined}
      sizes={sizes}
      alt={alt}
      loading={loading}
      // @ts-expect-error - fetchpriority is valid but not in React types yet
      fetchpriority={fetchPriority}
      width={width}
      height={height}
      objectFit={objectFit}
      objectPosition={objectPosition}
      display="block"
      {...boxProps}
    />
  )
}

export default OptimizedImage
