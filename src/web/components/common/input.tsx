// @package react ^18.0.0
// @package class-variance-authority ^0.7.0

import React from 'react';
import { cn } from 'class-variance-authority';
import { validateEmail } from '../../lib/validation';
import { typography, colors, spacing } from '../../config/theme';

// Human Tasks:
// 1. Verify color contrast ratios meet WCAG requirements using a color contrast checker
// 2. Test with screen readers to ensure proper ARIA label reading
// 3. Validate keyboard navigation flow in the context of form usage

interface InputProps {
  id: string;
  name: string;
  type: string;
  label?: string;
  placeholder?: string;
  value: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
}

// @requirement Input Validation - Implement comprehensive input validation for text, email, numbers and files
// @requirement Accessibility Requirements - Ensure all input elements are WCAG 2.1 AA compliant with proper ARIA labels
// @requirement Design System Implementation - Implement consistent design system tokens for typography, spacing, and colors
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      name,
      type = 'text',
      label,
      placeholder,
      value,
      error,
      disabled = false,
      required = false,
      onChange,
      onBlur,
      className
    },
    ref
  ) => {
    // Handle input validation on blur for email type
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === 'email' && value && !validateEmail(value)) {
        e.currentTarget.setCustomValidity('Please enter a valid email address');
      } else {
        e.currentTarget.setCustomValidity('');
      }
      onBlur?.(e);
    };

    // Generate input container class names using theme tokens
    const inputContainerClasses = cn(
      'relative flex flex-col w-full',
      {
        'opacity-60 cursor-not-allowed': disabled
      },
      className
    );

    // Generate input element class names using theme tokens
    const inputClasses = cn(
      // Base styles
      'w-full rounded-md transition-colors',
      // Typography
      `font-${typography.fontFamily.primary}`,
      `text-${typography.fontSize.base}`,
      `leading-${typography.lineHeight.normal}`,
      // Spacing
      `px-${spacing[4]}`,
      `py-${spacing[2]}`,
      // Colors and borders
      `bg-${colors.gray[50]}`,
      `border ${error ? `border-${colors.error.DEFAULT}` : `border-${colors.gray[300]}`}`,
      // Focus states
      'focus:outline-none',
      `focus:ring-2 focus:ring-${colors.secondary.DEFAULT} focus:ring-opacity-50`,
      // Hover states
      `hover:border-${colors.gray[400]}`,
      {
        // Disabled state
        'cursor-not-allowed bg-gray-100': disabled,
        // Error state
        [`focus:ring-${colors.error.DEFAULT}`]: error
      }
    );

    // Generate label class names using theme tokens
    const labelClasses = cn(
      `font-${typography.fontFamily.primary}`,
      `text-${typography.fontSize.sm}`,
      `font-${typography.fontWeight.medium}`,
      `text-${colors.gray[700]}`,
      `mb-${spacing[1]}`
    );

    // Generate error message class names using theme tokens
    const errorClasses = cn(
      `font-${typography.fontFamily.primary}`,
      `text-${typography.fontSize.sm}`,
      `text-${colors.error.DEFAULT}`,
      `mt-${spacing[1]}`
    );

    return (
      <div className={inputContainerClasses}>
        {label && (
          <label htmlFor={id} className={labelClasses}>
            {label}
            {required && (
              <span className={`text-${colors.error.DEFAULT} ml-${spacing[1]}`}>*</span>
            )}
          </label>
        )}
        
        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-required={required}
          className={inputClasses}
          // Additional accessibility attributes
          role="textbox"
          aria-label={label || name}
        />

        {error && (
          <span
            id={`${id}-error`}
            className={errorClasses}
            aria-live="polite"
            role="alert"
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;