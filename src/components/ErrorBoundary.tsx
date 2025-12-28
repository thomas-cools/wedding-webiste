import React, { Component, ReactNode } from 'react'
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react'

interface Props {
  children: ReactNode
  /** Optional fallback UI to render on error */
  fallback?: ReactNode
  /** Section name for error message context */
  sectionName?: string
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** If true, silently hides the section on error instead of showing error UI */
  silent?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component that catches JavaScript errors in child components,
 * logs them, and displays a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console (could be sent to error reporting service)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      // Silent mode: just hide the section
      if (this.props.silent) {
        return null
      }

      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Box py={12} px={4}>
          <VStack spacing={4} textAlign="center" maxW="400px" mx="auto">
            <Heading
              as="h3"
              fontSize="lg"
              fontWeight="500"
              color="neutral.dark"
            >
              {this.props.sectionName
                ? `Unable to load ${this.props.sectionName}`
                : 'Something went wrong'}
            </Heading>
            <Text fontSize="sm" color="neutral.muted">
              This section couldn't be loaded. Please try again.
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              mt={2}
            >
              Try Again
            </Button>
          </VStack>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
