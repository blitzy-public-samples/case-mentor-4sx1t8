// Human Tasks:
// 1. Configure Supabase authentication settings in project dashboard
// 2. Set up OAuth providers if using social authentication
// 3. Configure JWT token expiration and refresh settings
// 4. Review and adjust session timeout values for production

// react ^18.0.0
import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { AuthChangeEvent } from '@supabase/supabase-js';

// Import auth types
import {
  AuthState,
  AuthSession,
  AuthCredentials,
  PasswordResetRequest,
  PasswordUpdateRequest
} from '../types/auth';

// Import auth utilities
import {
  signIn,
  signUp,
  signOut,
  resetPassword,
  updatePassword,
  getSession,
  refreshSession
} from '../lib/auth';

// Import Supabase client
import supabase from '../lib/supabase';

// Initial auth state
const initialAuthState: AuthState = {
  initialized: false,
  loading: true,
  authenticated: false,
  session: null,
  user: null
};

// Create auth context
// Requirement: Authentication & Authorization - Frontend auth state management
interface AuthContextType {
  state: AuthState;
  signIn: (credentials: AuthCredentials) => Promise<{ success: boolean; error?: any }>;
  signUp: (credentials: AuthCredentials) => Promise<{ success: boolean; error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (request: PasswordResetRequest) => Promise<{ success: boolean; error?: any }>;
  updatePassword: (request: PasswordUpdateRequest) => Promise<{ success: boolean; error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
// Requirement: Authentication & Authorization - JWT-based authentication with secure session management
export function AuthProvider({ children }: PropsWithChildren<{}>) {
  const [state, setState] = useState<AuthState>(initialAuthState);

  // Initialize auth state
  useEffect(() => {
    const initialize = async () => {
      try {
        const session = await getSession();
        setState(prev => ({
          ...prev,
          initialized: true,
          loading: false,
          authenticated: !!session,
          session,
          user: session?.user || null
        }));
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setState(prev => ({
          ...prev,
          initialized: true,
          loading: false
        }));
      }
    };

    initialize();
  }, []);

  // Set up auth state change subscription
  // Requirement: Security Controls - Authentication implementation using JWT with RSA-256
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        try {
          switch (event) {
            case 'SIGNED_IN':
              if (session) {
                const formattedSession = await getSession();
                setState(prev => ({
                  ...prev,
                  authenticated: true,
                  session: formattedSession,
                  user: formattedSession?.user || null,
                  loading: false
                }));
              }
              break;

            case 'SIGNED_OUT':
              setState(prev => ({
                ...prev,
                authenticated: false,
                session: null,
                user: null,
                loading: false
              }));
              break;

            case 'TOKEN_REFRESHED':
              const refreshedSession = await refreshSession();
              if (refreshedSession) {
                setState(prev => ({
                  ...prev,
                  session: refreshedSession,
                  user: refreshedSession.user
                }));
              }
              break;
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setState(prev => ({ ...prev, loading: false }));
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auth context value with state and methods
  const contextValue: AuthContextType = {
    state,
    signIn: async (credentials) => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const result = await signIn(credentials);
        if (!result.success) {
          setState(prev => ({ ...prev, loading: false }));
        }
        return result;
      } catch (error) {
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error };
      }
    },
    signUp: async (credentials) => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const result = await signUp(credentials);
        if (!result.success) {
          setState(prev => ({ ...prev, loading: false }));
        }
        return result;
      } catch (error) {
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error };
      }
    },
    signOut: async () => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        await signOut();
      } catch (error) {
        console.error('Sign out error:', error);
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    },
    resetPassword: async (request) => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const result = await resetPassword(request);
        setState(prev => ({ ...prev, loading: false }));
        return result;
      } catch (error) {
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error };
      }
    },
    updatePassword: async (request) => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const result = await updatePassword(request);
        setState(prev => ({ ...prev, loading: false }));
        return result;
      } catch (error) {
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error };
      }
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to access auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}