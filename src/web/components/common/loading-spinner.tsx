// @package react ^18.0.0
// @package class-variance-authority ^0.7.0

import React from 'react';
import { cn } from 'class-variance-authority';
import { colors } from '../../config/theme';

// Interface for component props
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

// Variants configuration for size and color using theme tokens
const spinnerVariants = {
  size: {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  },
  color: {
    primary: 'text-primary-DEFAULT',
    secondary: 'text-secondary-DEFAULT',
    accent: 'text-accent-DEFAULT'
  }
} as const;

/**
 * LoadingSpinner - A customizable loading spinner component with accessibility support
 * 
 * Requirement: User Interface Design - 7.1.1 Design System Specifications
 * Implements loading states using consistent design system tokens for colors and animations
 * 
 * Requirement: Accessibility Requirements - 7.1.4 Accessibility Requirements
 * Ensures loading states are accessible with proper ARIA labels and roles
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'secondary',
  className
}) => {
  // Compose class names using theme variants
  const spinnerClasses = cn(
    // Base styles
    'inline-block animate-spin',
    // Size variant
    spinnerVariants.size[size],
    // Color variant
    spinnerVariants.color[color],
    // Additional custom classes
    className
  );

  return (
    <svg
      className={spinnerClasses}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      // Accessibility attributes
      role="status"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export type { LoadingSpinnerProps };
export default LoadingSpinner;