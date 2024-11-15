// @supabase/supabase-js ^2.38.0
import { Session } from '@supabase/supabase-js';
// react ^18.0.0
import { useState, useEffect, useCallback } from 'react';

// Internal imports
import { 
  AuthState, 
  AuthCredentials, 
  AuthSession, 
  AuthResponse, 
  PasswordResetRequest 
} from '../types/auth';
import supabase from '../lib/supabase';
import { api } from '../lib/api';

/**
 * Human Tasks:
 * 1. Configure Supabase JWT settings in project dashboard
 * 2. Set up proper CORS and security headers in production
 * 3. Configure session cookie settings in production environment
 * 4. Set up proper error monitoring for authentication failures
 */

// Initial authentication state
const initialAuthState: AuthState = {
  initialized: false,
  loading: true,
  authenticated: false,
  session: null,
  user: null
};

/**
 * Custom React hook for managing authentication state and operations
 * Requirement: Authentication & Authorization - JWT-based authentication with secure session management
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>(initialAuthState);

  /**
   * Updates authentication state with new session data
   * Requirement: Security Controls - JWT validation and session management
   */
  const updateAuthState = useCallback(async (session: Session | null) => {
    if (!session) {
      setState({
        ...initialAuthState,
        initialized: true,
        loading: false
      });
      return;
    }

    try {
      // Fetch user profile after successful authentication
      const { data: profile } = await api.post<AuthSession>('/api/auth/profile', {
        userId: session.user.id
      });

      if (profile) {
        setState({
          initialized: true,
          loading: false,
          authenticated: true,
          session: {
            user: profile.user,
            session,
            profile: profile.profile,
            expiresAt: session.expires_at || 0
          },
          user: profile.user
        });
      }
    } catch (error) {
      // Reset state on profile fetch error
      setState({
        ...initialAuthState,
        initialized: true,
        loading: false
      });
    }
  }, []);

  /**
   * Sets up authentication state listener on mount
   * Requirement: Authentication & Authorization - Session management and state synchronization
   */
  useEffect(() => {
    // Get initial session
    const session = supabase.auth.session();
    updateAuthState(session);

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await updateAuthState(session);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [updateAuthState]);

  /**
   * Authenticates user with email and password
   * Requirement: Security Controls - Authentication implementation using JWT with RSA-256
   */
  const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) throw error;

      if (session) {
        await updateAuthState(session);
        return {
          success: true,
          data: state.session,
          error: null
        };
      }

      throw new Error('Authentication failed');
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        data: null,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message
        }
      };
    }
  };

  /**
   * Creates new user account with email and password
   * Requirement: Authentication & Authorization - User registration with secure password handling
   */
  const register = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data: { session }, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password
      });

      if (error) throw error;

      if (session) {
        // Create initial user profile
        await api.post('/api/auth/profile/create', {
          userId: session.user.id,
          email: credentials.email
        });

        await updateAuthState(session);
        return {
          success: true,
          data: state.session,
          error: null
        };
      }

      throw new Error('Registration failed');
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        data: null,
        error: {
          code: 'REGISTRATION_ERROR',
          message: error.message
        }
      };
    }
  };

  /**
   * Signs out current user and clears authentication state
   * Requirement: Authentication & Authorization - Secure logout and session cleanup
   */
  const logout = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        ...initialAuthState,
        initialized: true,
        loading: false
      });
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  /**
   * Initiates password reset process for user account
   * Requirement: Security Controls - Secure password reset functionality
   */
  const resetPassword = async (request: PasswordResetRequest): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        request.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`
        }
      );

      if (error) throw error;

      setState(prev => ({ ...prev, loading: false }));
      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        data: null,
        error: {
          code: 'PASSWORD_RESET_ERROR',
          message: error.message
        }
      };
    }
  };

  return {
    state,
    login,
    logout,
    register,
    resetPassword
  };
}