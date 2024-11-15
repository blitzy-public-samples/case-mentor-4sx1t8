// Human Tasks:
// 1. Verify that react@^18.0.0 is installed in package.json
// 2. Ensure Next.js app router is properly configured for loading states

import React from 'react'; // ^18.0.0
import Loading from '../components/shared/Loading';

/**
 * Default loading UI component for Next.js route segments that displays during page transitions.
 * 
 * Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
 * - Provides immediate visual feedback for operations while API requests are processed
 * 
 * Requirement: Design System Specifications (7.1.1)
 * - Uses design system's secondary color and spacing through the Loading component
 * 
 * Requirement: Accessibility Requirements (7.1.4)
 * - Implements WCAG 2.1 AA compliant loading states with proper ARIA attributes
 */
export default function Loading(): JSX.Element {
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <Loading 
        size="lg"
        label="Loading page content..."
        color="secondary"
      />
    </div>
  );
}