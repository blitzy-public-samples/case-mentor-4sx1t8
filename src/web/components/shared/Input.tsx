// react v18.0.0
import React, { forwardRef, type ForwardedRef, type InputHTMLAttributes } from 'react';
// Utility for combining Tailwind classes conditionally
import { cn } from '../../lib/utils';

/**
 * Human Tasks:
 * 1. Ensure proper color contrast ratios are maintained if customizing the default styles
 * 2. Verify screen reader compatibility in target browsers
 * 3. Test keyboard navigation flow in the context of form layouts
 */

// Props interface extending HTML input attributes with custom properties
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

// Requirement: User Interface Design - WCAG 2.1 AA compliant form inputs
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, id, ...props }, ref: ForwardedRef<HTMLInputElement>) => {
    // Generate unique IDs for accessibility relationships
    const inputId = id || React.useId();
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    
    // Requirement: Design System Specifications - Consistent typography, color palette, and spacing
    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Default input classes with consistent design system tokens
            defaultInputClasses,
            // Apply error styles when error prop is present
            error && errorInputClasses,
            // Allow custom classes to override defaults
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={cn(
            hintId,
            errorId
          )}
          {...props}
        />
        
        {/* Hint text with proper ARIA relationship */}
        {hint && (
          <p
            id={hintId}
            className="text-sm text-gray-500"
          >
            {hint}
          </p>
        )}
        
        {/* Error message with alert role for screen readers */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-sm text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

// Set display name for React DevTools
Input.displayName = 'Input';

export default Input;