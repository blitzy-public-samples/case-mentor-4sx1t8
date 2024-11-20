// @package react ^18.0.0

import React from 'react';
import LoadingSpinner, { LoadingSpinnerProps } from '../../components/common/loading-spinner';
import Card from '../../components/common/card';

/**
 * Human Tasks:
 * 1. Verify loading animation performance on low-end devices
 * 2. Test loading state with screen readers for proper announcement
 * 3. Validate color contrast ratios in different color modes
 */

/**
 * Loading - A loading component that displays a skeleton state while drill data is being fetched
 * 
 * Requirement: System Performance - 2. SYSTEM OVERVIEW/Success Criteria
 * Provides visual feedback for API response times under 200ms for 95% of requests
 * 
 * Requirement: User Interface Design - 7.1.1 Design System Specifications
 * Implements loading states using consistent design system tokens
 * 
 * Requirement: Accessibility Requirements - 7.1.4 Accessibility Requirements
 * Ensures loading states are accessible with proper ARIA labels
 */
const Loading = () => {
  // Array to generate multiple loading cards
  const loadingCards = Array.from({ length: 6 }, (_, index) => index);

  return (
    <div
      // Grid layout matching the drills page structure
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6"
      // Accessibility attributes
      role="status"
      aria-label="Loading drills"
      aria-busy="true"
    >
      {loadingCards.map((index) => (
        <Card
          key={`loading-card-${index}`}
          // Elevated variant for visual hierarchy
          variant="elevated"
          // Medium padding to match loaded state
          padding="medium"
          className="min-h-[200px] flex items-center justify-center"
        >
          <LoadingSpinner
            // Medium size for visibility
            size="md"
            // Secondary color for brand consistency
            color="secondary"
            // Additional classes for positioning
            className="mx-auto"
          />
        </Card>
      ))}
      {/* Hidden text for screen readers */}
      <span className="sr-only">
        Loading drill content. Please wait.
      </span>
    </div>
  );
};

export default Loading;