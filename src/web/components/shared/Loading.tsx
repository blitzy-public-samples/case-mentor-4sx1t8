// @ts-check

/**
 * Human Tasks:
 * 1. Verify that the following dependencies are installed in package.json:
 *    - react@^18.0.0
 *    - class-variance-authority@^0.7.0
 */

import React from 'react'; // ^18.0.0
import { cn } from 'class-variance-authority'; // ^0.7.0
import { colors, spacing } from '../../config/theme';

// Requirement: Design System Specifications (7.1.1)
// Interface for Loading component props following design system specifications
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: keyof typeof colors;
  className?: string;
  label?: string;
}

// Requirement: System Performance (2. SYSTEM OVERVIEW/Success Criteria)
// Helper function to determine spinner dimensions based on size prop
const getSpinnerSize = (size: LoadingProps['size'] = 'md'): { width: number; height: number } => {
  switch (size) {
    case 'sm':
      return { width: spacing[4], height: spacing[4] }; // 16px
    case 'lg':
      return { width: spacing[8], height: spacing[8] }; // 64px
    case 'md':
    default:
      return { width: spacing[6], height: spacing[6] }; // 32px
  }
};

// Requirement: Accessibility Requirements (7.1.4)
// Loading component with WCAG 2.1 AA compliant animations and ARIA attributes
const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  color = 'secondary',
  className,
  label = 'Loading...'
}) => {
  const dimensions = getSpinnerSize(size);
  
  // Requirement: Design System Specifications (7.1.1)
  // Apply design system color tokens and spacing
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center',
        className
      )}
      style={{
        width: dimensions.width,
        height: dimensions.height
      }}
    >
      {/* WCAG 2.1 AA compliant animation using transform instead of opacity */}
      <svg
        className="animate-spin"
        style={{
          width: '100%',
          height: '100%'
        }}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke={colors[color].base}
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill={colors[color].base}
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {/* Screen reader only text for accessibility */}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Loading;