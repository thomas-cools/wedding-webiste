import React from 'react'
import { render, screen, fireEvent } from '../test-utils'
import ErrorBoundary from '../components/ErrorBoundary'

// A component that throws an error
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Child rendered successfully</div>
}

// Suppress console.error during error boundary tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})
afterAll(() => {
  console.error = originalConsoleError
})

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders default error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText("This section couldn't be loaded. Please try again.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('includes section name in error message when provided', () => {
    render(
      <ErrorBoundary sectionName="gallery">
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Unable to load gallery')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('renders nothing visible when silent mode is enabled', () => {
    render(
      <ErrorBoundary silent>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    // Should not show any error UI
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    expect(screen.queryByText(/unable to load/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    )
  })

  it('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(console.error).toHaveBeenCalled()
  })

  it('resets error state when Try Again is clicked', () => {
    // We need to use a stateful wrapper to test recovery
    let shouldThrow = true
    const ControlledComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>Child rendered successfully</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ControlledComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Change the flag so component won't throw on next render
    shouldThrow = false

    // Click Try Again - this resets the error state and triggers re-render
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    // After clicking Try Again, the boundary should attempt to render children again
    // Since shouldThrow is now false, it should succeed
    expect(screen.getByText('Child rendered successfully')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})
