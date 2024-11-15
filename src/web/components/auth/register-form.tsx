// react version: ^18.0.0
// class-variance-authority version: ^0.7.0

import React from 'react';
import { cn } from 'class-variance-authority';
import { RegisterCredentials } from '../../types/auth';
import { useAuth } from '../../hooks/use-auth';
import { useForm } from '../../hooks/use-form';
import { Input } from '../common/input';
import { useToast } from '../../hooks/use-toast';

/**
 * Human Tasks:
 * 1. Configure reCAPTCHA integration in the project
 * 2. Set up terms and conditions page/modal
 * 3. Configure password strength requirements in validation rules
 */

interface RegisterFormProps {
  className?: string;
  onSuccess?: () => void;
}

const INITIAL_VALUES: RegisterCredentials = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  captchaToken: '',
  acceptedTerms: false,
};

/**
 * @requirement User Management
 * Registration form component with comprehensive validation and error handling
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({ className, onSuccess }) => {
  const { handleRegister } = useAuth();
  const { showToast } = useToast();

  /**
   * @requirement Input Validation
   * Form validation rules for registration fields
   */
  const validators = {
    email: (value: string) => {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!value) {
        return { isValid: false, errors: ['Email is required'], fieldErrors: { email: 'Email is required' } };
      }
      if (!emailRegex.test(value)) {
        return { isValid: false, errors: ['Invalid email format'], fieldErrors: { email: 'Invalid email format' } };
      }
      return { isValid: true, errors: [], fieldErrors: {} };
    },
    password: (value: string) => {
      if (!value) {
        return { isValid: false, errors: ['Password is required'], fieldErrors: { password: 'Password is required' } };
      }
      if (value.length < 8) {
        return { isValid: false, errors: ['Password must be at least 8 characters'], fieldErrors: { password: 'Password must be at least 8 characters' } };
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return { isValid: false, errors: ['Password must contain uppercase, lowercase, and numbers'], fieldErrors: { password: 'Password must contain uppercase, lowercase, and numbers' } };
      }
      return { isValid: true, errors: [], fieldErrors: {} };
    },
    confirmPassword: (value: string) => {
      if (!value) {
        return { isValid: false, errors: ['Confirm password is required'], fieldErrors: { confirmPassword: 'Confirm password is required' } };
      }
      if (value !== values.password) {
        return { isValid: false, errors: ['Passwords do not match'], fieldErrors: { confirmPassword: 'Passwords do not match' } };
      }
      return { isValid: true, errors: [], fieldErrors: {} };
    },
    fullName: (value: string) => {
      if (!value) {
        return { isValid: false, errors: ['Full name is required'], fieldErrors: { fullName: 'Full name is required' } };
      }
      if (value.length < 2) {
        return { isValid: false, errors: ['Full name is too short'], fieldErrors: { fullName: 'Full name is too short' } };
      }
      return { isValid: true, errors: [], fieldErrors: {} };
    },
    acceptedTerms: (value: boolean) => {
      if (!value) {
        return { isValid: false, errors: ['You must accept the terms'], fieldErrors: { acceptedTerms: 'You must accept the terms' } };
      }
      return { isValid: true, errors: [], fieldErrors: {} };
    }
  };

  /**
   * @requirement Authentication System
   * Handle form submission with proper validation and error handling
   */
  const onSubmit = async (formValues: RegisterCredentials) => {
    try {
      await handleRegister(formValues);
      showToast('Registration successful! Please check your email to verify your account.', 'success');
      onSuccess?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Registration failed. Please try again.', 'error');
    }
  };

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: INITIAL_VALUES,
    validators,
    onSubmit,
  });

  const formStyles = cn(
    'w-full max-w-md p-6 space-y-4 bg-white rounded-lg shadow-md',
    className
  );

  return (
    <form onSubmit={handleSubmit} className={formStyles} noValidate>
      <Input
        id="fullName"
        name="fullName"
        type="text"
        label="Full Name"
        value={values.fullName}
        error={errors.fullName}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        aria-required="true"
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Email Address"
        value={values.email}
        error={errors.email}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        aria-required="true"
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        value={values.password}
        error={errors.password}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        aria-required="true"
      />

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
        aria-required="true"
      />

      <div className="flex items-center space-x-2">
        <input
          id="acceptedTerms"
          name="acceptedTerms"
          type="checkbox"
          checked={values.acceptedTerms}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          aria-required="true"
        />
        <label htmlFor="acceptedTerms" className="text-sm text-gray-600">
          I accept the terms and conditions
        </label>
      </div>
      {errors.acceptedTerms && (
        <p className="text-sm text-error" role="alert">
          {errors.acceptedTerms}
        </p>
      )}

      <button
        type="submit"
        className="w-full px-4 py-2 text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={Object.keys(errors).length > 0}
      >
        Register
      </button>
    </form>
  );
};