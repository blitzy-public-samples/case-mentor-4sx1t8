// @package react ^18.0.0

import React from 'react';
import LoadingSpinner from '../../components/common/loading-spinner';

/**
 * SimulationLoading - Loading component for the simulation page with visual feedback
 * 
 * Requirement: User Interface Design - 7.1.1 Design System Specifications
 * Implements loading states using consistent design system tokens and components
 * through the LoadingSpinner component with secondary color scheme
 * 
 * Requirement: Accessibility Requirements - 7.1.4 Accessibility Requirements
 * Ensures loading states are accessible with proper ARIA labels and roles
 * using semantic HTML and ARIA attributes for loading status
 */
const SimulationLoading: React.FC = () => {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen p-4"
      role="status"
      aria-label="Loading simulation data"
    >
      <LoadingSpinner 
        size="lg"
        color="secondary"
        className="mb-4"
      />
      <p className="text-lg text-secondary-600 font-medium">
        Loading simulation data...
      </p>
    </div>
  );
};

export default SimulationLoading;