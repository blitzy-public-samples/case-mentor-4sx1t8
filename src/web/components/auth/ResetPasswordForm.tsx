// react v18.0.0
import React, { useState } from 'react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { resetPassword } from '../../lib/auth';
import { useToast, ToastType } from '../../hooks/useToast';

// Human Tasks:
// 1. Configure password reset email templates in Supabase dashboard
// 2. Verify email sending domain is properly configured in Supabase
// 3. Test password reset flow in all supported browsers
// 4. Ensure proper error messages are displayed for all edge cases

// Email validation regex from auth.ts
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * ResetPasswordForm component for handling password reset requests
 * Requirement: Authentication & Authorization - Secure password reset functionality with email verification
 * Requirement: User Interface Design - WCAG 2.1 AA compliant form with keyboard navigation and screen reader support
 */
const ResetPasswordForm: React.FC = () => {
  // Form state management
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Toast notifications
  const { show } = useToast();

  /**
   * Handles form submission for password reset request
   * Requirement: Authentication & Authorization - Secure password reset functionality
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate email format
      if (!EMAIL_REGEX.test(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Request password reset
      const response = await resetPassword({ email });

      if (response.success) {
        show({
          type: ToastType.SUCCESS,
          message: 'Password reset instructions have been sent to your email',
          duration: 5000
        });
        setEmail('');
      } else {
        setError(response.error?.message || 'Failed to send reset instructions');
        show({
          type: ToastType.ERROR,
          message: 'Failed to send reset instructions',
          duration: 5000
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      show({
        type: ToastType.ERROR,
        message: 'An unexpected error occurred',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6"
      noValidate
      // Requirement: User Interface Design - WCAG 2.1 AA accessibility
      aria-labelledby="reset-password-title"
      role="form"
    >
      <div className="text-center">
        <h1
          id="reset-password-title"
          className="text-2xl font-semibold text-gray-900"
        >
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <Input
        type="email"
        label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        placeholder="Enter your email"
        // Requirement: User Interface Design - WCAG 2.1 AA accessibility
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? 'email-error' : undefined}
        disabled={loading}
        autoComplete="email"
        // Ensure proper focus outline for accessibility
        className="focus:ring-2 focus:ring-primary-500"
      />

      <Button
        type="submit"
        variant="primary"
        isLoading={loading}
        disabled={loading || !email}
        className="w-full"
        // Requirement: User Interface Design - WCAG 2.1 AA accessibility
        aria-label={loading ? 'Sending reset instructions' : 'Send reset instructions'}
      >
        {loading ? 'Sending...' : 'Send Reset Instructions'}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;