// @package react ^18.0.0

// Human Tasks:
// 1. Set up error monitoring/logging service integration
// 2. Test error boundary with different types of runtime errors
// 3. Verify error messages are user-friendly and actionable
// 4. Ensure error tracking respects user privacy settings

import React from 'react';
import { Button, type ButtonProps } from './button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error, resetError: () => void) => React.ReactNode);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Requirement: System Performance - Contributes to 99.9% uptime during peak usage
// by gracefully handling component errors and preventing cascading failures
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error details for monitoring
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack trace:', errorInfo.componentStack);

    // TODO: Integrate with error tracking service
    // Example:
    // errorTrackingService.captureError(error, {
    //   extra: {
    //     componentStack: errorInfo.componentStack
    //   }
    // });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  // Requirement: User Experience - Provides user-friendly error states 
  // and recovery options through fallback UI and retry functionality
  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // If fallback is a function, call it with error and reset function
      if (typeof fallback === 'function') {
        return fallback(error, this.resetError);
      }

      // If fallback is a ReactNode, render it
      if (fallback) {
        return fallback;
      }

      // Default error UI if no fallback is provided
      return (
        <div
          role="alert"
          className="p-4 rounded-lg bg-red-50 border border-red-100"
        >
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={this.resetError}
            ariaLabel="Retry"
          >
            Try again
          </Button>
        </div>
      );
    }

    return children;
  }
}

export type { ErrorBoundaryProps };