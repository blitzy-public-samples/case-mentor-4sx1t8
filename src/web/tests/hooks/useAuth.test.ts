// @jest/globals ^29.0.0
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
// @testing-library/react-hooks ^8.0.0
import { renderHook, act } from '@testing-library/react-hooks';
// @supabase/supabase-js ^2.38.0
import { Session } from '@supabase/supabase-js';

// Internal imports
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';
import { 
  AuthState, 
  AuthCredentials, 
  AuthResponse, 
  AuthSession, 
  PasswordResetRequest 
} from '../../types/auth';

/**
 * Human Tasks:
 * 1. Configure Jest environment with proper timezone and DOM settings
 * 2. Set up test database with mock authentication data
 * 3. Configure test coverage thresholds for authentication flows
 * 4. Set up CI/CD pipeline test stages for auth testing
 */

// Mock Supabase client
jest.mock('../../lib/supabase', () => ({
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    session: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: {
        subscription: {
          unsubscribe: jest.fn()
        }
      }
    }))
  }
}));

describe('useAuth', () => {
  // Test data
  const mockSession: Session = {
    access_token: 'mock-jwt-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'authenticated',
      aud: 'authenticated'
    }
  };

  const mockCredentials: AuthCredentials = {
    email: 'test@example.com',
    password: 'Test123!@#'
  };

  const mockAuthSession: AuthSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date().toISOString()
    },
    session: mockSession,
    profile: {
      userId: 'test-user-id',
      displayName: 'Test User',
      avatarUrl: null
    },
    expiresAt: Date.now() + 3600000
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth state
    (supabase.auth.session as jest.Mock).mockReturnValue(null);
  });

  // Clean up after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Requirement: Authentication & Authorization - Verify initial auth state
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.state).toEqual({
      initialized: false,
      loading: true,
      authenticated: false,
      session: null,
      user: null
    });
  });

  // Requirement: Security Controls - Test JWT-based authentication
  it('should handle successful login', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login(mockCredentials);
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: mockCredentials.email,
      password: mockCredentials.password
    });

    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.authenticated).toBe(true);
  });

  // Requirement: Security Controls - Test authentication error handling
  it('should handle login errors', async () => {
    const mockError = {
      message: 'Invalid credentials'
    };

    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: mockError
    });

    const { result } = renderHook(() => useAuth());

    let response: AuthResponse;
    await act(async () => {
      response = await result.current.login(mockCredentials);
    });

    expect(response).toEqual({
      success: false,
      data: null,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: mockError.message
      }
    });
    expect(result.current.state.authenticated).toBe(false);
  });

  // Requirement: Authentication & Authorization - Test user registration
  it('should handle successful registration', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register(mockCredentials);
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: mockCredentials.email,
      password: mockCredentials.password
    });
  });

  // Requirement: Authentication & Authorization - Test logout functionality
  it('should handle logout', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: null
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.state).toEqual({
      initialized: true,
      loading: false,
      authenticated: false,
      session: null,
      user: null
    });
  });

  // Requirement: Security Controls - Test password reset
  it('should handle password reset request', async () => {
    const resetRequest: PasswordResetRequest = {
      email: 'test@example.com'
    };

    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      data: {},
      error: null
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.resetPassword(resetRequest);
    });

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      resetRequest.email,
      {
        redirectTo: `${window.location.origin}/auth/reset-password`
      }
    );
  });

  // Requirement: Authentication & Authorization - Test session management
  it('should handle auth state changes', async () => {
    let authChangeCallback: (event: string, session: Session | null) => void;

    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      authChangeCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn()
          }
        }
      };
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      authChangeCallback('SIGNED_IN', mockSession);
    });

    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.initialized).toBe(true);
  });
});