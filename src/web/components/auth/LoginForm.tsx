// react v18.0.0
import React from 'react';
// react-hook-form v7.0.0
import { useForm } from 'react-hook-form';
// zod v3.0.0
import { z } from 'zod';
// @hookform/resolvers/zod v3.0.0
import { zodResolver } from '@hookform/resolvers/zod';

// Internal imports
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

/**
 * Human Tasks:
 * 1. Verify Supabase authentication configuration in project dashboard
 * 2. Test form behavior with screen readers in target browsers
 * 3. Verify error message color contrast meets WCAG 2.1 AA standards
 */

// Requirement: Authentication Flow - Form data interface
interface FormData {
  email: string;
  password: string;
}

// Requirement: Authentication Flow - Form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

// Requirement: Authentication Flow - Main login form component
export const LoginForm: React.FC = () => {
  // Initialize form with validation schema
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  // Initialize hooks for authentication and feedback
  const { login } = useAuth();
  const { show, ToastType } = useToast();

  // Requirement: Authentication Flow - Form submission handler
  const onSubmit = async (data: FormData) => {
    try {
      const response = await login({
        email: data.email,
        password: data.password,
      });

      if (response.success) {
        show({
          type: ToastType.SUCCESS,
          message: 'Successfully logged in',
          duration: 3000,
        });
        reset();
      } else {
        show({
          type: ToastType.ERROR,
          message: response.error?.message || 'Login failed',
          duration: 5000,
        });
      }
    } catch (error) {
      show({
        type: ToastType.ERROR,
        message: 'An unexpected error occurred',
        duration: 5000,
      });
    }
  };

  // Requirement: User Interface Design - WCAG 2.1 AA compliant form
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md space-y-6"
      noValidate
    >
      {/* Email input with accessibility support */}
      <div>
        <Input
          {...register('email')}
          type="email"
          label="Email"
          error={errors.email?.message}
          autoComplete="email"
          aria-required="true"
          data-testid="email-input"
        />
      </div>

      {/* Password input with accessibility support */}
      <div>
        <Input
          {...register('password')}
          type="password"
          label="Password"
          error={errors.password?.message}
          autoComplete="current-password"
          aria-required="true"
          data-testid="password-input"
        />
      </div>

      {/* Submit button with loading state */}
      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting}
        disabled={isSubmitting}
        aria-label={isSubmitting ? 'Logging in...' : 'Log in'}
        data-testid="login-button"
      >
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </Button>
    </form>
  );
};