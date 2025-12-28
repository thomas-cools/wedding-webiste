import { useState, useEffect, useCallback } from 'react'

export interface UseGalleryNavigationOptions {
  /** Total number of items in the gallery */
  totalItems: number
  /** Whether navigation is active (e.g., lightbox is open) */
  isActive: boolean
  /** Callback when navigation closes */
  onClose?: () => void
  /** Minimum swipe distance in pixels (default: 50) */
  minSwipeDistance?: number
}

export interface UseGalleryNavigationReturn {
  /** Currently selected index */
  selectedIndex: number
  /** Set the selected index directly */
  setSelectedIndex: (index: number) => void
  /** Navigate to previous item */
  goToPrevious: () => void
  /** Navigate to next item */
  goToNext: () => void
  /** Touch event handlers for swipe support */
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
}

/**
 * Custom hook for gallery navigation with keyboard and touch/swipe support.
 * Handles arrow key navigation and swipe gestures for mobile.
 */
export function useGalleryNavigation({
  totalItems,
  isActive,
  onClose,
  minSwipeDistance = 50,
}: UseGalleryNavigationOptions): UseGalleryNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? totalItems - 1 : prev - 1))
  }, [totalItems])

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === totalItems - 1 ? 0 : prev + 1))
  }, [totalItems])

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
        case 'Escape':
          onClose?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, goToPrevious, goToNext, onClose])

  // Touch/swipe handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    const touch = e.targetTouches[0]
    if (touch) setTouchStart(touch.clientX)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.targetTouches[0]
    if (touch) setTouchEnd(touch.clientX)
  }, [])

  const onTouchEnd = useCallback(() => {
    if (touchStart === null || touchEnd === null) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe) goToNext()
    if (isRightSwipe) goToPrevious()
  }, [touchStart, touchEnd, minSwipeDistance, goToNext, goToPrevious])

  return {
    selectedIndex,
    setSelectedIndex,
    goToPrevious,
    goToNext,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  }
}
