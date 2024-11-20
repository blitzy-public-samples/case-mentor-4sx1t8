// react version: ^18.0.0
// @testing-library/react version: ^14.0.0
// @testing-library/user-event version: ^14.0.0
// @jest/globals version: ^29.0.0

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { LoginForm } from '../../components/auth/login-form';
import { RegisterForm } from '../../components/auth/register-form';
import { PasswordResetForm } from '../../components/auth/password-reset-form';
import { useAuth } from '../../hooks/use-auth';

// Mock useAuth hook
jest.mock('../../hooks/use-auth');

// Test utilities
const renderWithAuth = (component: JSX.Element) => {
  return render(component);
};

const fillLoginForm = async (email: string, password: string) => {
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/password/i), password);
};

const fillRegistrationForm = async (
  email: string,
  password: string,
  confirmPassword: string,
  fullName: string
) => {
  await userEvent.type(screen.getByLabelText(/full name/i), fullName);
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/^password/i), password);
  await userEvent.type(screen.getByLabelText(/confirm password/i), confirmPassword);
};

// Setup and cleanup
beforeEach(() => {
  (useAuth as jest.Mock).mockReturnValue({
    handleLogin: jest.fn(),
    handleRegister: jest.fn(),
    loading: false,
    authState: {
      user: null,
      session: null,
      role: null,
      loading: false,
      lastActivity: null,
      permissions: [],
    },
  });
});

afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// @requirement Authentication System
// Test suite for LoginForm component
describe('LoginForm', () => {
  const mockOnSuccess = jest.fn();

  it('should render login form with email and password fields', () => {
    renderWithAuth(<LoginForm onSuccess={mockOnSuccess} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  // @requirement Input Validation
  it('should validate email format', async () => {
    renderWithAuth(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.blur(emailInput);

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
  });

  // @requirement Input Validation
  it('should validate password requirements', async () => {
    renderWithAuth(<LoginForm onSuccess={mockOnSuccess} />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    await userEvent.type(passwordInput, '123');
    fireEvent.blur(passwordInput);

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const mockHandleLogin = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      handleLogin: mockHandleLogin,
      loading: false,
    });

    renderWithAuth(<LoginForm onSuccess={mockOnSuccess} />);
    
    await fillLoginForm('test@example.com', 'Password123!');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockHandleLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: false,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display error messages on failed login', async () => {
    const mockHandleLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    (useAuth as jest.Mock).mockReturnValue({
      handleLogin: mockHandleLogin,
      loading: false,
    });

    renderWithAuth(<LoginForm onSuccess={mockOnSuccess} />);
    
    await fillLoginForm('test@example.com', 'Password123!');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  // @requirement Accessibility Requirements
  it('should maintain focus management for accessibility', async () => {
    renderWithAuth(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.tab();
    expect(emailInput).toHaveFocus();

    await userEvent.tab();
    expect(passwordInput).toHaveFocus();
  });
});

// @requirement Authentication System
// Test suite for RegisterForm component
describe('RegisterForm', () => {
  const mockOnSuccess = jest.fn();

  it('should render registration form with all required fields', () => {
    renderWithAuth(<RegisterForm onSuccess={mockOnSuccess} />);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/terms/i)).toBeInTheDocument();
  });

  // @requirement Input Validation
  it('should validate matching passwords', async () => {
    renderWithAuth(<RegisterForm onSuccess={mockOnSuccess} />);
    
    await fillRegistrationForm(
      'test@example.com',
      'Password123!',
      'DifferentPass123!',
      'Test User'
    );

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('should validate password strength requirements', async () => {
    renderWithAuth(<RegisterForm onSuccess={mockOnSuccess} />);
    
    await fillRegistrationForm(
      'test@example.com',
      'weak',
      'weak',
      'Test User'
    );

    expect(await screen.findByText(/must contain uppercase, lowercase, and numbers/i)).toBeInTheDocument();
  });

  it('should handle successful registration', async () => {
    const mockHandleRegister = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      handleRegister: mockHandleRegister,
      loading: false,
    });

    renderWithAuth(<RegisterForm onSuccess={mockOnSuccess} />);
    
    await fillRegistrationForm(
      'test@example.com',
      'Password123!',
      'Password123!',
      'Test User'
    );
    
    const termsCheckbox = screen.getByLabelText(/terms/i);
    await userEvent.click(termsCheckbox);
    
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockHandleRegister).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});

// @requirement Authentication System
// Test suite for PasswordResetForm component
describe('PasswordResetForm', () => {
  const mockOnSuccess = jest.fn();
  const defaultProps = {
    token: 'valid-token',
    email: 'test@example.com',
    onSuccess: mockOnSuccess,
  };

  it('should render password reset form', () => {
    render(<PasswordResetForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  // @requirement Input Validation
  it('should validate password strength', async () => {
    render(<PasswordResetForm {...defaultProps} />);
    
    const passwordInput = screen.getByLabelText(/new password/i);
    await userEvent.type(passwordInput, 'weak');
    fireEvent.blur(passwordInput);

    expect(await screen.findByText(/must contain.*characters/i)).toBeInTheDocument();
  });

  it('should handle successful password reset', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    global.fetch = mockFetch as any;

    render(<PasswordResetForm {...defaultProps} />);
    
    await userEvent.type(screen.getByLabelText(/new password/i), 'NewPassword123!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'NewPassword123!');
    
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/reset-password',
        expect.any(Object)
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display error messages on failed reset', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid reset token' }),
    });
    global.fetch = mockFetch as any;

    render(<PasswordResetForm {...defaultProps} />);
    
    await userEvent.type(screen.getByLabelText(/new password/i), 'NewPassword123!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'NewPassword123!');
    
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/failed to reset password/i)).toBeInTheDocument();
  });
});