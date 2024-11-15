// react v18.0.0
import React, { useState, type FormEvent } from 'react';
// react-hook-form v7.0.0
import { useForm } from 'react-hook-form';
// next/navigation v13.0.0
import { useRouter } from 'next/navigation';

// Internal imports
import { useAuth } from '../../hooks/useAuth';
import type { AuthCredentials } from '../../types/auth';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';

/**
 * Human Tasks:
 * 1. Configure password policy in Supabase dashboard
 * 2. Set up proper CORS headers for production environment
 * 3. Configure error monitoring for registration failures
 * 4. Verify email templates in Supabase dashboard
 */

// Requirement: Authentication & Authorization - Secure password requirements
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Requirement: User Interface Design - Form validation messages
const ERROR_MESSAGES = {
  emailRequired: 'Email address is required',
  emailInvalid: 'Please enter a valid email address',
  passwordRequired: 'Password is required',
  passwordInvalid: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character',
  registrationFailed: 'Registration failed. Please try again.'
};

// Requirement: User Interface Design - WCAG 2.1 AA compliant form
export default function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Requirement: User Interface Design - Form state management with validation
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AuthCredentials>({
    mode: 'onBlur'
  });

  // Requirement: Authentication & Authorization - Secure registration process
  const onSubmit = async (data: AuthCredentials) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await registerUser(data);

      if (response.success) {
        // Requirement: User Interface Design - Success feedback
        router.push('/dashboard');
      } else {
        setApiError(response.error?.message || ERROR_MESSAGES.registrationFailed);
      }
    } catch (error) {
      setApiError(ERROR_MESSAGES.registrationFailed);
    } finally {
      setIsLoading(false);
    }
  };

  // Requirement: User Interface Design - WCAG 2.1 AA compliant form layout
  return (
    <form 
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 w-full max-w-md mx-auto"
      noValidate
      aria-label="Registration form"
    >
      {/* Requirement: User Interface Design - Accessible error messages */}
      {apiError && (
        <div
          role="alert"
          className="text-sm text-red-500 mt-1"
          aria-live="polite"
        >
          {apiError}
        </div>
      )}

      {/* Requirement: User Interface Design - Accessible email input */}
      <Input
        {...register('email', {
          required: ERROR_MESSAGES.emailRequired,
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: ERROR_MESSAGES.emailInvalid
          }
        })}
        type="email"
        label="Email address"
        error={errors.email?.message}
        aria-invalid={errors.email ? 'true' : 'false'}
        autoComplete="email"
      />

      {/* Requirement: User Interface Design - Accessible password input */}
      <Input
        {...register('password', {
          required: ERROR_MESSAGES.passwordRequired,
          pattern: {
            value: PASSWORD_REGEX,
            message: ERROR_MESSAGES.passwordInvalid
          }
        })}
        type="password"
        label="Password"
        error={errors.password?.message}
        aria-invalid={errors.password ? 'true' : 'false'}
        autoComplete="new-password"
        hint="Must contain at least 8 characters, including uppercase, lowercase, number and special character"
      />

      {/* Requirement: User Interface Design - Accessible submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full"
      >
        Create account
      </Button>
    </form>
  );
}