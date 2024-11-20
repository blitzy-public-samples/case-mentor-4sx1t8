// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority';
// react v18.0.0
import React from 'react';
import { formatScore } from '../../lib/utils';
import { theme } from '../../config/theme';

// Human Tasks:
// 1. Verify WCAG 2.1 AA color contrast ratios using a color contrast checker tool
// 2. Test with screen readers to ensure ARIA attributes are correctly interpreted
// 3. Validate keyboard navigation functionality

interface ProgressProps {
  // Current progress value between 0 and 1
  value: number;
  // Maximum value for progress calculation (defaults to 1)
  max?: number;
  // Size variant: 'sm' | 'md' | 'lg'
  size?: string;
  // Color variant: 'primary' | 'secondary' | 'accent'
  variant?: string;
  // Whether to show percentage label
  showLabel?: boolean;
  // Optional additional class names
  className?: string;
  // Accessible label for screen readers
  ariaLabel?: string;
}

// Requirement: Design System Specifications - Implements consistent progress visualization
const progressVariants = cn({
  base: 'relative w-full overflow-hidden rounded-full bg-gray-100 transition-all',
  variants: {
    size: {
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6'
    },
    variant: {
      // Requirement: Accessibility Requirements - WCAG 2.1 AA compliant colors
      primary: {
        bar: `bg-[${theme.colors.primary.base}]`,
        text: 'text-gray-700'
      },
      secondary: {
        bar: `bg-[${theme.colors.secondary.base}]`,
        text: 'text-gray-700'
      },
      accent: {
        bar: `bg-[${theme.colors.accent.base}]`,
        text: 'text-gray-700'
      }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'primary'
  }
});

// Requirement: User Engagement - Visual progress tracking for >80% completion rate target
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 1,
      size = 'md',
      variant = 'primary',
      showLabel = false,
      className,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    // Normalize value between 0 and 1
    const normalizedValue = Math.min(Math.max(value / max, 0), 1);
    const percentage = formatScore(normalizedValue);
    
    // Generate variant classes
    const variantClasses = progressVariants({ size, variant });
    const barClasses = cn(
      'h-full transition-all duration-300 ease-in-out',
      variantClasses.variants?.variant?.[variant]?.bar
    );
    const labelClasses = cn(
      'absolute right-2 text-sm font-medium',
      variantClasses.variants?.variant?.[variant]?.text,
      size === 'sm' ? 'hidden' : ''
    );

    // Requirement: Accessibility Requirements - ARIA support
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={normalizedValue * 100}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || 'Progress indicator'}
        className={cn(variantClasses.base, className)}
        {...props}
      >
        <div
          className={barClasses}
          style={{ width: `${normalizedValue * 100}%` }}
        />
        {showLabel && size !== 'sm' && (
          <span className={labelClasses}>{percentage}</span>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';