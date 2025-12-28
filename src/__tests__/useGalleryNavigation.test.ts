import { renderHook, act } from '@testing-library/react'
import { useGalleryNavigation } from '../components/PhotoGallery/useGalleryNavigation'

describe('useGalleryNavigation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initializes with selectedIndex at 0', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: false })
    )

    expect(result.current.selectedIndex).toBe(0)
  })

  it('navigates to next item', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: true })
    )

    act(() => {
      result.current.goToNext()
    })

    expect(result.current.selectedIndex).toBe(1)
  })

  it('navigates to previous item', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: true })
    )

    // First go to index 2
    act(() => {
      result.current.setSelectedIndex(2)
    })

    act(() => {
      result.current.goToPrevious()
    })

    expect(result.current.selectedIndex).toBe(1)
  })

  it('wraps to last item when navigating previous from first', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: true })
    )

    act(() => {
      result.current.goToPrevious()
    })

    expect(result.current.selectedIndex).toBe(4)
  })

  it('wraps to first item when navigating next from last', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: true })
    )

    act(() => {
      result.current.setSelectedIndex(4)
    })

    act(() => {
      result.current.goToNext()
    })

    expect(result.current.selectedIndex).toBe(0)
  })

  it('allows setting selectedIndex directly', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: false })
    )

    act(() => {
      result.current.setSelectedIndex(3)
    })

    expect(result.current.selectedIndex).toBe(3)
  })

  it('responds to keyboard navigation when active', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: true })
    )

    // Simulate ArrowRight
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      window.dispatchEvent(event)
    })

    expect(result.current.selectedIndex).toBe(1)
  })

  it('responds to ArrowLeft keyboard navigation when active', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: true })
    )

    // Set to index 2 first
    act(() => {
      result.current.setSelectedIndex(2)
    })

    // Simulate ArrowLeft
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      window.dispatchEvent(event)
    })

    expect(result.current.selectedIndex).toBe(1)
  })

  it('does not respond to keyboard when not active', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: false })
    )

    // Simulate ArrowRight
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      window.dispatchEvent(event)
    })

    // Should stay at 0
    expect(result.current.selectedIndex).toBe(0)
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = jest.fn()
    renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: true, onClose })
    )

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('provides touch handlers', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: true })
    )

    expect(result.current.touchHandlers).toBeDefined()
    expect(typeof result.current.touchHandlers.onTouchStart).toBe('function')
    expect(typeof result.current.touchHandlers.onTouchMove).toBe('function')
    expect(typeof result.current.touchHandlers.onTouchEnd).toBe('function')
  })

  it('handles swipe left to go next', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: true, minSwipeDistance: 50 })
    )

    // Simulate swipe left (start at 200, end at 100 = 100px left swipe)
    act(() => {
      result.current.touchHandlers.onTouchStart({
        targetTouches: [{ clientX: 200 }],
      } as unknown as React.TouchEvent)
    })

    act(() => {
      result.current.touchHandlers.onTouchMove({
        targetTouches: [{ clientX: 100 }],
      } as unknown as React.TouchEvent)
    })

    act(() => {
      result.current.touchHandlers.onTouchEnd()
    })

    expect(result.current.selectedIndex).toBe(1)
  })

  it('handles swipe right to go previous', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: true, minSwipeDistance: 50 })
    )

    // Start at index 2
    act(() => {
      result.current.setSelectedIndex(2)
    })

    // Simulate swipe right (start at 100, end at 200 = 100px right swipe)
    act(() => {
      result.current.touchHandlers.onTouchStart({
        targetTouches: [{ clientX: 100 }],
      } as unknown as React.TouchEvent)
    })

    act(() => {
      result.current.touchHandlers.onTouchMove({
        targetTouches: [{ clientX: 200 }],
      } as unknown as React.TouchEvent)
    })

    act(() => {
      result.current.touchHandlers.onTouchEnd()
    })

    expect(result.current.selectedIndex).toBe(1)
  })

  it('ignores swipe if distance is less than minimum', () => {
    const { result } = renderHook(() =>
      useGalleryNavigation({ totalItems: 5, isActive: true, minSwipeDistance: 50 })
    )

    // Simulate small swipe (only 30px)
    act(() => {
      result.current.touchHandlers.onTouchStart({
        targetTouches: [{ clientX: 100 }],
      } as unknown as React.TouchEvent)
    })

    act(() => {
      result.current.touchHandlers.onTouchMove({
        targetTouches: [{ clientX: 130 }],
      } as unknown as React.TouchEvent)
    })

    act(() => {
      result.current.touchHandlers.onTouchEnd()
    })

    // Should stay at 0
    expect(result.current.selectedIndex).toBe(0)
  })
})
