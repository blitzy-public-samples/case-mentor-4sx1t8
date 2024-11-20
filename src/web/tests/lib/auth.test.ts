// @jest/globals ^29.7.0
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
// vitest ^0.34.0
import { vi } from 'vitest';
import {
  signIn,
  signUp,
  signOut,
  resetPassword,
  updatePassword,
  getSession,
  refreshSession
} from '../../lib/auth';
import type {
  AuthCredentials,
  AuthSession,
  PasswordResetRequest,
  PasswordUpdateRequest
} from '../../types/auth';
import supabase from '../../lib/supabase';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn()
    }))
  }
}));

// Test data
const mockValidCredentials: AuthCredentials = {
  email: 'test@example.com',
  password: 'ValidPass123!'
};

const mockInvalidCredentials: AuthCredentials = {
  email: 'invalid@example.com',
  password: 'wrong'
};

const mockSession: AuthSession = {
  access_token: 'mock-jwt-token',
  expires_at: 1234567890,
  refresh_token: 'mock-refresh-token',
  user: {
    id: 'mock-user-id',
    email: 'test@example.com'
  }
};

describe('signIn', () => {
  // Requirement: Authentication & Authorization - JWT-based authentication
  test('successful sign in with valid credentials returns AuthSession', async () => {
    const mockResponse = { data: { session: mockSession }, error: null };
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce(mockResponse);
    
    const result = await signIn(mockValidCredentials);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: mockValidCredentials.email,
      password: mockValidCredentials.password
    });
  });

  test('failed sign in with invalid credentials returns error', async () => {
    const mockError = { message: 'Invalid credentials' };
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({ data: { session: null }, error: mockError });
    
    const result = await signIn(mockInvalidCredentials);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Invalid credentials');
  });

  test('invalid email format returns validation error', async () => {
    const result = await signIn({ ...mockValidCredentials, email: 'invalid-email' });
    
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Invalid email format');
  });
});

describe('signUp', () => {
  // Requirement: Security Controls - Password policy enforcement
  test('successful registration with valid credentials returns AuthSession', async () => {
    const mockResponse = { data: { session: mockSession, user: mockSession.user }, error: null };
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce(mockResponse);
    
    const result = await signUp(mockValidCredentials);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: mockValidCredentials.email,
      password: mockValidCredentials.password
    });
  });

  test('failed registration with existing email returns error', async () => {
    const mockError = { message: 'User already registered' };
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({ data: { session: null, user: null }, error: mockError });
    
    const result = await signUp(mockValidCredentials);
    
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('User already registered');
  });

  test('weak password returns validation error', async () => {
    const result = await signUp({ ...mockValidCredentials, password: 'weak' });
    
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Password must be at least 8 characters');
  });
});

describe('signOut', () => {
  // Requirement: Authentication & Authorization - Session management
  test('successful sign out clears session', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });
    
    await signOut();
    
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  test('handles sign out error gracefully', async () => {
    const mockError = { message: 'Network error' };
    vi.mocked(supabase.auth.signOut).mockRejectedValueOnce(mockError);
    
    await expect(signOut()).resolves.not.toThrow();
  });
});

describe('resetPassword', () => {
  // Requirement: Security Controls - Password reset functionality
  test('successful password reset request with valid email', async () => {
    const resetRequest: PasswordResetRequest = { email: 'test@example.com' };
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({ data: {}, error: null });
    
    const result = await resetPassword(resetRequest);
    
    expect(result.success).toBe(true);
    expect(result.data?.message).toContain('Password reset instructions sent');
  });

  test('invalid email format returns validation error', async () => {
    const resetRequest: PasswordResetRequest = { email: 'invalid-email' };
    
    const result = await resetPassword(resetRequest);
    
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Invalid email format');
  });
});

describe('updatePassword', () => {
  // Requirement: Security Controls - Password update functionality
  test('successful password update with valid password', async () => {
    const updateRequest: PasswordUpdateRequest = {
      token: 'valid-token',
      newPassword: 'NewValidPass123!'
    };
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({ data: { session: mockSession }, error: null });
    
    const result = await updatePassword(updateRequest);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('weak password returns validation error', async () => {
    const updateRequest: PasswordUpdateRequest = {
      token: 'valid-token',
      newPassword: 'weak'
    };
    
    const result = await updatePassword(updateRequest);
    
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Password does not meet security requirements');
  });
});

describe('getSession', () => {
  // Requirement: Authentication & Authorization - Session management
  test('successful session retrieval returns AuthSession', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: mockSession }, error: null });
    
    const result = await getSession();
    
    expect(result).toBeDefined();
    expect(result?.user).toBeDefined();
  });

  test('no active session returns null', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: null }, error: null });
    
    const result = await getSession();
    
    expect(result).toBeNull();
  });
});

describe('refreshSession', () => {
  // Requirement: Security Controls - Token refresh mechanism
  test('successful session refresh returns new AuthSession', async () => {
    vi.mocked(supabase.auth.refreshSession).mockResolvedValueOnce({ data: { session: mockSession }, error: null });
    
    const result = await refreshSession();
    
    expect(result).toBeDefined();
    expect(result?.user).toBeDefined();
  });

  test('refresh failure returns null', async () => {
    vi.mocked(supabase.auth.refreshSession).mockResolvedValueOnce({ data: { session: null }, error: { message: 'Refresh failed' } });
    
    const result = await refreshSession();
    
    expect(result).toBeNull();
  });

  test('handles refresh error gracefully', async () => {
    vi.mocked(supabase.auth.refreshSession).mockRejectedValueOnce(new Error('Network error'));
    
    const result = await refreshSession();
    
    expect(result).toBeNull();
  });
});