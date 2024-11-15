'use client';

// react ^18.0.0
import * as React from 'react';
import { useEffect } from 'react';

// Internal imports
import { Alert } from '../components/shared/Alert';
import { Button } from '../components/shared/Button';
import { handleAPIError } from '../lib/utils';

/**
 * Human Tasks:
 * 1. Configure error monitoring service (e.g., Sentry) for production error tracking
 * 2. Set up error logging infrastructure to capture 95% of error requests
 * 3. Test error boundary with screen readers to verify accessibility compliance
 */

// Requirement: Error Handling (7. SYSTEM DESIGN/7.3.5 Error Handling)
interface ErrorProps {
  error: Error;
  reset: () => void;
}

// Requirement: Error Handling (7. SYSTEM DESIGN/7.3.5 Error Handling)
// Requirement: Accessibility Requirements (7. SYSTEM DESIGN/7.1.4 Accessibility Requirements)
const Error: React.FC<ErrorProps> = ({ error, reset }) => {
  // Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  // Set focus on error message for accessibility
  useEffect(() => {
    const alertElement = document.querySelector('[role="alert"]');
    if (alertElement instanceof HTMLElement) {
      alertElement.focus();
    }
  }, []);

  // Format error message based on error type
  const errorMessage = error.name === 'APIError' 
    ? handleAPIError(error as any) 
    : error.message || 'An unexpected error occurred';

  // Requirement: Accessibility Requirements (7. SYSTEM DESIGN/7.1.4 Accessibility Requirements)
  return (
    <div
      className="p-4 min-h-[200px] flex items-center justify-center"
      role="alert"
      aria-live="assertive"
    >
      <Alert
        variant="error"
        title="Something went wrong"
        action={{
          label: "Try again",
          onClick: reset
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-red-800">
            {errorMessage}
          </p>
          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              onClick={reset}
              aria-label="Retry the failed action"
            >
              Retry
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default Error;