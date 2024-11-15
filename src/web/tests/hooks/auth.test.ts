// @jest/globals version: ^29.0.0
// @testing-library/react-hooks version: ^8.0.0
// @supabase/supabase-js version: ^2.0.0

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-hooks';
import type { Session, User } from '@supabase/supabase-js';

import { useAuth } from '../../hooks/use-auth';
import { AuthRole, AuthState, LoginCredentials, RegisterCredentials } from '../../types/auth';

/**
 * @requirement Authentication System
 * Mock data for testing authentication flows
 */
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated'
};

const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: 1234567890,
  user: mockUser,
  token_type: 'bearer'
};

const mockLoginCredentials: LoginCredentials = {
  email: 'test@example.com',
  password: 'password123',
  rememberMe: true,
  captchaToken: 'mock-captcha-token'
};

const mockRegisterCredentials: RegisterCredentials = {
  email: 'test@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  fullName: 'Test User',
  captchaToken: 'mock-captcha-token',
  acceptedTerms: true
};

describe('useAuth', () => {
  /**
   * @requirement Authentication System
   * Set up test environment before each test
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @requirement Authentication System
   * Clean up test environment after each test
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @requirement Authentication System
   * Test initial authentication state
   */
  it('should initialize with loading state', async () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.authState.loading).toBe(true);
    expect(result.current.authState.user).toBeNull();
    expect(result.current.authState.session).toBeNull();
    expect(result.current.authState.role).toBe(AuthRole.ANONYMOUS);
    expect(result.current.authState.permissions).toEqual([]);
  });

  /**
   * @requirement Authentication System
   * Test successful login flow
   */
  it('should handle successful login', async () => {
    const { result } = renderHook(() => useAuth());

    const mockAuthState: AuthState = {
      user: mockUser,
      session: mockSession,
      role: AuthRole.FREE_USER,
      loading: false,
      lastActivity: new Date(),
      permissions: ['read:profile', 'write:profile']
    };

    await act(async () => {
      try {
        await result.current.handleLogin(mockLoginCredentials);
      } catch (error) {
        // Handle any potential errors
      }
    });

    expect(result.current.authState.loading).toBe(false);
    expect(result.current.authState.user).toEqual(mockAuthState.user);
    expect(result.current.authState.session).toEqual(mockAuthState.session);
    expect(result.current.authState.role).toBe(AuthRole.FREE_USER);
  });

  /**
   * @requirement Authentication System
   * Test login error handling
   */
  it('should handle login errors', async () => {
    const { result } = renderHook(() => useAuth());

    const mockError = new Error('Invalid credentials');

    await act(async () => {
      try {
        await result.current.handleLogin({
          ...mockLoginCredentials,
          password: 'wrong-password'
        });
        fail('Login should have thrown an error');
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });

    expect(result.current.authState.loading).toBe(false);
    expect(result.current.authState.user).toBeNull();
    expect(result.current.authState.role).toBe(AuthRole.ANONYMOUS);
  });

  /**
   * @requirement User Management
   * Test successful registration flow
   */
  it('should handle successful registration', async () => {
    const { result } = renderHook(() => useAuth());

    const mockAuthState: AuthState = {
      user: mockUser,
      session: mockSession,
      role: AuthRole.FREE_USER,
      loading: false,
      lastActivity: new Date(),
      permissions: ['read:profile', 'write:profile']
    };

    await act(async () => {
      try {
        await result.current.handleRegister(mockRegisterCredentials);
      } catch (error) {
        // Handle any potential errors
      }
    });

    expect(result.current.authState.loading).toBe(false);
    expect(result.current.authState.user).toEqual(mockAuthState.user);
    expect(result.current.authState.session).toEqual(mockAuthState.session);
    expect(result.current.authState.role).toBe(AuthRole.FREE_USER);
  });

  /**
   * @requirement Authentication System
   * Test logout functionality
   */
  it('should handle logout', async () => {
    const { result } = renderHook(() => useAuth());

    // First set an authenticated state
    result.current.authState = {
      user: mockUser,
      session: mockSession,
      role: AuthRole.FREE_USER,
      loading: false,
      lastActivity: new Date(),
      permissions: ['read:profile', 'write:profile']
    };

    await act(async () => {
      try {
        await result.current.handleLogout();
      } catch (error) {
        // Handle any potential errors
      }
    });

    expect(result.current.authState.loading).toBe(false);
    expect(result.current.authState.user).toBeNull();
    expect(result.current.authState.session).toBeNull();
    expect(result.current.authState.role).toBe(AuthRole.ANONYMOUS);
    expect(result.current.authState.permissions).toEqual([]);
    expect(result.current.authState.lastActivity).toBeNull();
  });

  /**
   * @requirement Authentication System
   * Test session persistence
   */
  it('should maintain session state between renders', async () => {
    const { result, rerender } = renderHook(() => useAuth());

    // Set authenticated state
    result.current.authState = {
      user: mockUser,
      session: mockSession,
      role: AuthRole.FREE_USER,
      loading: false,
      lastActivity: new Date(),
      permissions: ['read:profile', 'write:profile']
    };

    // Rerender the hook
    rerender();

    expect(result.current.authState.user).toEqual(mockUser);
    expect(result.current.authState.session).toEqual(mockSession);
    expect(result.current.authState.role).toBe(AuthRole.FREE_USER);
  });
});