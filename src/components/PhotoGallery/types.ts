/**
 * Shared types for the PhotoGallery component family.
 */

export interface GalleryImage {
  /** Source URL for the image */
  src: string
  /** WebP version of the image (optional) */
  srcWebp?: string
  /** Thumbnail URL (optional, falls back to src) */
  thumbnail?: string
  /** Thumbnail WebP version (optional) */
  thumbnailWebp?: string
  /** Alt text for accessibility */
  alt: string
  /** Optional caption */
  caption?: string
  /** Aspect ratio (default: 4/3) */
  aspectRatio?: number
}

export interface PhotoGalleryProps {
  /** Array of images to display */
  images?: GalleryImage[]
  /** Number of columns on different breakpoints */
  columns?: { base: number; sm: number; md: number; lg: number }
  /** Gap between images */
  gap?: number
}
