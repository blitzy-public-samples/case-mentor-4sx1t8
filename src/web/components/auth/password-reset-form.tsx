// react version: ^18.0.0

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '../../hooks/use-form';
import { Input } from '../common/input';
import { Button } from '../common/button';
import { validatePassword, ValidationResult } from '../../lib/validation';

/**
 * Human Tasks:
 * 1. Configure password reset rate limiting in the API
 * 2. Set up monitoring for failed reset attempts
 * 3. Review and update password requirements periodically
 */

// @requirement Authentication System - Interface for password reset form props
export interface PasswordResetFormProps {
  token: string;
  email: string;
  onSuccess: () => void;
}

// @requirement Authentication System - Interface for form values
interface PasswordResetFormValues {
  password: string;
  confirmPassword: string;
}

// @requirement Input Validation - Form validation schema
const FORM_VALIDATION_SCHEMA = {
  password: (value: string): ValidationResult => validatePassword(value),
  confirmPassword: (value: string, values: PasswordResetFormValues): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      fieldErrors: {}
    };

    if (value !== values.password) {
      result.isValid = false;
      result.errors.push('Passwords do not match');
      result.fieldErrors.confirmPassword = 'Passwords do not match';
    }

    return result;
  }
};

/**
 * @requirement Authentication System - Component for handling password reset requests
 * @requirement Input Validation - Comprehensive validation for password reset form inputs
 * @requirement Accessibility Requirements - WCAG 2.1 AA compliant form
 */
export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  token,
  email,
  onSuccess
}) => {
  const router = useRouter();

  // Initialize form with validation schema
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useForm({
    initialValues: {
      password: '',
      confirmPassword: ''
    },
    validators: FORM_VALIDATION_SCHEMA,
    onSubmit: handlePasswordReset
  });

  // @requirement Authentication System - Handle password reset submission
  async function handlePasswordReset(formValues: PasswordResetFormValues): Promise<void> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          email,
          password: formValues.password
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }

      onSuccess();
      router.push('/login?reset=success');
    } catch (error) {
      throw new Error('Failed to reset password. Please try again.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6"
      noValidate
      // @requirement Accessibility Requirements - Proper ARIA attributes
      aria-label="Password reset form"
    >
      <div className="space-y-4">
        <Input
          id="password"
          name="password"
          type="password"
          label="New Password"
          value={values.password}
          error={errors.password}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          // @requirement Accessibility Requirements - Descriptive ARIA labels
          aria-describedby="password-requirements"
        />
        <div
          id="password-requirements"
          className="text-sm text-gray-600"
          // @requirement Accessibility Requirements - Live region for screen readers
          aria-live="polite"
        >
          Password must contain at least 8 characters, including uppercase, lowercase,
          numbers, and special characters.
        </div>

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          value={values.confirmPassword}
          error={errors.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          // @requirement Accessibility Requirements - Proper ARIA labels
          aria-describedby="confirm-password-error"
        />
      </div>

      {errors.submit && (
        <div
          className="text-red-600 text-sm"
          role="alert"
          aria-live="polite"
        >
          {errors.submit}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
        fullWidth
        // @requirement Accessibility Requirements - Clear button state
        aria-disabled={isSubmitting}
      >
        Reset Password
      </Button>
    </form>
  );
};