/**
 * Human Tasks:
 * 1. Configure test environment variables for authentication testing
 * 2. Set up mock Supabase instance for integration tests
 * 3. Run accessibility compliance tests with axe-core
 * 4. Verify test coverage meets minimum threshold
 */

// react version: ^18.0.0
import React from 'react';
// @testing-library/react version: ^14.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// vitest version: ^0.34.0
import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { MockInstance } from 'vitest';

import LoginPage from '../../app/auth/login/page';
import { LoginForm } from '../../components/auth/login-form';
import { useAuth } from '../../hooks/use-auth';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock useAuth hook
vi.mock('../../hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

// Test constants
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'Password123!',
};

const VALIDATION_ERRORS = {
  email: 'Invalid email format',
  password: 'Password is required',
  auth: 'Invalid credentials',
};

describe('Login Page', () => {
  let mockHandleLogin: MockInstance;
  let mockRedirect: MockInstance;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock useAuth implementation
    mockHandleLogin = vi.fn();
    (useAuth as any).mockImplementation(() => ({
      handleLogin: mockHandleLogin,
      loading: false,
      authState: { user: null },
    }));

    // Mock redirect function
    mockRedirect = vi.fn();
    (require('next/navigation') as any).redirect = mockRedirect;
  });

  /**
   * @requirement User Interface Design
   * Test login form rendering and accessibility compliance
   */
  it('renders login form with proper accessibility attributes', async () => {
    render(<LoginPage />);

    // Verify form elements presence and accessibility
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    expect(emailInput).toHaveAttribute('required');

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('aria-invalid', 'false');
    expect(passwordInput).toHaveAttribute('required');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeEnabled();
    expect(submitButton).toHaveAttribute('type', 'submit');

    // Verify form landmarks and structure
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/sign in/i);
    expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Login form');
  });

  /**
   * @requirement Authentication System
   * Test successful login flow with valid credentials
   */
  it('handles successful login and redirects to dashboard', async () => {
    render(<LoginPage />);

    // Fill in login form
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: TEST_CREDENTIALS.email },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: TEST_CREDENTIALS.password },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify login attempt
    await waitFor(() => {
      expect(mockHandleLogin).toHaveBeenCalledWith({
        email: TEST_CREDENTIALS.email,
        password: TEST_CREDENTIALS.password,
        rememberMe: false,
      });
    });

    // Verify redirect after successful login
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  /**
   * @requirement Authentication System
   * Test form validation for required fields and format
   */
  it('displays validation errors for invalid input', async () => {
    render(<LoginPage />);

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    // Test invalid email format
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalid-email' },
    });

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  /**
   * @requirement Authentication System
   * Test loading states during authentication
   */
  it('shows loading state during authentication', async () => {
    // Mock loading state
    (useAuth as any).mockImplementation(() => ({
      handleLogin: mockHandleLogin,
      loading: true,
      authState: { user: null },
    }));

    render(<LoginPage />);

    // Verify loading indicators
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Signing in...');
  });

  /**
   * @requirement Authentication System
   * Test error handling for failed login attempts
   */
  it('handles login errors appropriately', async () => {
    // Mock login error
    const loginError = new Error(VALIDATION_ERRORS.auth);
    mockHandleLogin.mockRejectedValue(loginError);

    render(<LoginPage />);

    // Attempt login
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: TEST_CREDENTIALS.email },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: TEST_CREDENTIALS.password },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify error display
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(VALIDATION_ERRORS.auth);
    });

    // Verify form remains interactive
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
  });

  /**
   * @requirement User Interface Design
   * Test authenticated user redirection
   */
  it('redirects authenticated users to dashboard', () => {
    // Mock authenticated state
    (useAuth as any).mockImplementation(() => ({
      handleLogin: mockHandleLogin,
      loading: false,
      authState: { user: { id: '1', email: TEST_CREDENTIALS.email } },
    }));

    render(<LoginPage />);

    // Verify immediate redirect
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });
});