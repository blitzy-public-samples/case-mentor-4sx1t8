/**
 * Human Tasks:
 * 1. Configure session refresh intervals in Supabase dashboard
 * 2. Set up authentication event monitoring and analytics
 * 3. Configure user session timeout settings
 * 4. Set up role-based access control policies in Supabase
 */

// react version: ^18.0.0
import { useState, useEffect, useCallback } from 'react';

// Import auth types and functions
import {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from '../types/auth';
import {
  login,
  register,
  logout,
  getCurrentSession,
} from '../lib/auth';

// Session management constants
const ACTIVITY_CHECK_INTERVAL = 60000; // 1 minute
const SESSION_TIMEOUT = 1800000; // 30 minutes

/**
 * @requirement Authentication System
 * Custom React hook for managing authentication state and user sessions
 */
export function useAuth() {
  // Initialize authentication state
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: 'anonymous',
    loading: true,
    lastActivity: null,
    permissions: [],
  });

  /**
   * @requirement Authentication System
   * Handle user login with credentials validation
   */
  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const newAuthState = await login(credentials);
      setAuthState(newAuthState);
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  /**
   * @requirement User Management
   * Handle new user registration and profile creation
   */
  const handleRegister = useCallback(async (credentials: RegisterCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const newAuthState = await register(credentials);
      setAuthState(newAuthState);
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  /**
   * @requirement Authentication System
   * Handle user logout and session cleanup
   */
  const handleLogout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await logout();
      setAuthState({
        user: null,
        session: null,
        role: 'anonymous',
        loading: false,
        lastActivity: null,
        permissions: [],
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  /**
   * @requirement Authentication System
   * Check and refresh session on component mount
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getCurrentSession();
        if (session) {
          // Re-authenticate with existing session
          const credentials = {
            email: session.user.email!,
            password: '', // Not needed for session refresh
            rememberMe: true,
          };
          await handleLogin(credentials);
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        setAuthState(prev => ({ ...prev, loading: false }));
        console.error('Session check failed:', error);
      }
    };

    checkSession();
  }, [handleLogin]);

  /**
   * @requirement Authentication System
   * Monitor user activity and manage session timeout
   */
  useEffect(() => {
    if (!authState.session) return;

    const updateActivity = () => {
      setAuthState(prev => ({
        ...prev,
        lastActivity: new Date(),
      }));
    };

    const checkActivity = () => {
      if (!authState.lastActivity) return;

      const inactiveTime = Date.now() - authState.lastActivity.getTime();
      if (inactiveTime > SESSION_TIMEOUT) {
        handleLogout();
      }
    };

    // Set up activity listeners
    const events = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Set up activity check interval
    const activityInterval = setInterval(checkActivity, ACTIVITY_CHECK_INTERVAL);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(activityInterval);
    };
  }, [authState.session, authState.lastActivity, handleLogout]);

  return {
    authState,
    handleLogin,
    handleRegister,
    handleLogout,
    loading: authState.loading,
  };
}