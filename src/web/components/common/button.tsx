// @package react ^18.0.0
// @package classnames ^2.3.0

// Human Tasks:
// 1. Verify button color contrast ratios in all states using a color contrast checker
// 2. Test keyboard navigation and screen reader compatibility
// 3. Validate loading state animation performance
// 4. Test touch targets meet minimum size requirements on mobile devices

import React from 'react';
import cn from 'classnames';
import { colors, spacing } from '../../config/theme';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  ariaLabel?: string;
}

// Requirement: Design System Specifications - Consistent button styling
const BASE_CLASSES = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

// Requirement: Design System Specifications - Color palette implementation
const VARIANT_CLASSES = {
  primary: `bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary`,
  secondary: `bg-secondary text-white hover:bg-secondary-dark focus-visible:ring-secondary`,
  outline: `border-2 border-primary text-primary hover:bg-primary hover:text-white focus-visible:ring-primary`,
  ghost: `hover:bg-gray-100 text-gray-700 focus-visible:ring-gray-400`
};

// Requirement: Design System Specifications - Consistent spacing scale
const SIZE_CLASSES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg'
};

// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant button component
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      type = 'button',
      onClick,
      className,
      ariaLabel,
    },
    ref
  ) => {
    const getButtonClasses = (props: ButtonProps) => {
      return cn(
        BASE_CLASSES,
        VARIANT_CLASSES[props.variant || 'primary'],
        SIZE_CLASSES[props.size || 'md'],
        {
          'w-full': props.fullWidth,
          'cursor-not-allowed': props.disabled,
          'relative overflow-hidden': props.loading,
        },
        className
      );
    };

    return (
      <button
        ref={ref}
        type={type}
        className={getButtonClasses({ variant, size, disabled, loading, fullWidth })}
        disabled={disabled || loading}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-disabled={disabled || loading}
        role="button"
      >
        {loading ? (
          <>
            <span className="opacity-0">{children}</span>
            <span className="absolute inset-0 flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
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
            </span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export type { ButtonProps };