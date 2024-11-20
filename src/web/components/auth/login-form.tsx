/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 AA compliance with automated testing tools
 * 2. Test screen reader compatibility across different browsers
 * 3. Validate color contrast ratios for error states
 * 4. Review keyboard navigation flow with accessibility experts
 */

// react version: ^18.0.0
import React from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useForm } from '../../hooks/use-form';
import type { LoginCredentials } from '../../types/auth';
import { Button } from '../common/button';

interface LoginFormProps {
  onSuccess: () => void;
  className?: string;
}

// Initial form state values
const INITIAL_VALUES: LoginCredentials = {
  email: '',
  password: '',
  rememberMe: false,
};

// Form validation configuration
const FORM_VALIDATORS = {
  email: (value: string) => ({
    isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    errors: [!value ? 'Email is required' : 'Please enter a valid email address'],
    fieldErrors: {},
  }),
  password: (value: string) => ({
    isValid: value.length >= 8,
    errors: [!value ? 'Password is required' : 'Password must be at least 8 characters'],
    fieldErrors: {},
  }),
};

/**
 * @requirement Authentication System
 * Login form component with email/password authentication using Supabase Auth
 */
export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, className }) => {
  const { handleLogin, loading } = useAuth();
  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: INITIAL_VALUES,
    validators: FORM_VALIDATORS,
    onSubmit: async (formValues) => {
      await handleLogin(formValues as LoginCredentials);
      onSuccess();
    },
  });

  /**
   * @requirement Accessibility
   * Implements WCAG 2.1 AA compliant form with proper ARIA labels and keyboard navigation
   */
  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      noValidate
      aria-label="Login form"
    >
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`block w-full rounded-md border ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p
              className="mt-2 text-sm text-red-600"
              id="email-error"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`block w-full rounded-md border ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <p
              className="mt-2 text-sm text-red-600"
              id="password-error"
              role="alert"
            >
              {errors.password}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={values.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label
            htmlFor="rememberMe"
            className="ml-2 block text-sm text-gray-900"
          >
            Remember me
          </label>
        </div>

        <div className="text-sm">
          <a
            href="/forgot-password"
            className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Forgot your password?
          </a>
        </div>
      </div>

      {errors.submit && (
        <div
          className="rounded-md bg-red-50 p-4"
          role="alert"
          aria-label="Login error"
        >
          <p className="text-sm text-red-700">{errors.submit}</p>
        </div>
      )}

      <div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full"
          aria-label={loading ? 'Signing in...' : 'Sign in'}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>
    </form>
  );
};