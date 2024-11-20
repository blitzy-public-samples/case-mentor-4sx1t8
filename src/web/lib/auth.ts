// Human Tasks:
// 1. Configure password strength requirements in environment variables
// 2. Set up email templates for password reset in Supabase dashboard
// 3. Configure OAuth provider settings if using social authentication
// 4. Review and adjust session timeout and refresh settings
// 5. Set up proper CORS and security headers in production

// @supabase/supabase-js ^2.38.0
import { Session } from '@supabase/supabase-js';
import supabase from './supabase';
import {
  AuthCredentials,
  AuthSession,
  AuthState,
  AuthResponse,
  PasswordResetRequest,
  PasswordUpdateRequest
} from '../types/auth';

// Initial auth state
const initialAuthState: AuthState = {
  initialized: false,
  loading: true,
  authenticated: false,
  session: null,
  user: null
};

let authState: AuthState = { ...initialAuthState };

// Email validation regex
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Password requirements regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validates email format
 * Requirement: Security Controls - Input validation
 */
const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validates password strength
 * Requirement: Security Controls - Password policy enforcement
 */
const validatePassword = (password: string): boolean => {
  return PASSWORD_REGEX.test(password);
};

/**
 * Formats auth session data
 * Requirement: Authentication & Authorization - JWT-based session management
 */
const formatAuthSession = async (session: Session): Promise<AuthSession> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return {
    user: session.user,
    session,
    profile,
    expiresAt: new Date(session.expires_at!).getTime()
  };
};

/**
 * Signs in user with email and password
 * Requirement: Authentication & Authorization - Email/password authentication
 */
export async function signIn(credentials: AuthCredentials): Promise<AuthResponse> {
  try {
    if (!validateEmail(credentials.email)) {
      return { success: false, error: { message: 'Invalid email format' } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      return { success: false, error: { message: error.message } };
    }

    const authSession = await formatAuthSession(data.session);
    authState = {
      ...authState,
      authenticated: true,
      session: authSession,
      user: authSession.user
    };

    return { success: true, data: authSession };
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Authentication failed', details: error }
    };
  }
}

/**
 * Registers new user
 * Requirement: Authentication & Authorization - User registration
 */
export async function signUp(credentials: AuthCredentials): Promise<AuthResponse> {
  try {
    if (!validateEmail(credentials.email)) {
      return { success: false, error: { message: 'Invalid email format' } };
    }

    if (!validatePassword(credentials.password)) {
      return { 
        success: false, 
        error: { message: 'Password must be at least 8 characters and contain uppercase, lowercase, number and special character' }
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      return { success: false, error: { message: error.message } };
    }

    // Create initial profile
    await supabase.from('profiles').insert([
      { id: data.user!.id, email: credentials.email }
    ]);

    const authSession = await formatAuthSession(data.session!);
    authState = {
      ...authState,
      authenticated: true,
      session: authSession,
      user: authSession.user
    };

    return { success: true, data: authSession };
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Registration failed', details: error }
    };
  }
}

/**
 * Signs out current user
 * Requirement: Authentication & Authorization - Session management
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  authState = { ...initialAuthState, initialized: true, loading: false };
}

/**
 * Initiates password reset
 * Requirement: Security Controls - Password reset functionality
 */
export async function resetPassword(request: PasswordResetRequest): Promise<AuthResponse> {
  try {
    if (!validateEmail(request.email)) {
      return { success: false, error: { message: 'Invalid email format' } };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      return { success: false, error: { message: error.message } };
    }

    return { 
      success: true, 
      data: { message: 'Password reset instructions sent to email' }
    };
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Password reset failed', details: error }
    };
  }
}

/**
 * Updates user password
 * Requirement: Security Controls - Password update functionality
 */
export async function updatePassword(request: PasswordUpdateRequest): Promise<AuthResponse> {
  try {
    if (!validatePassword(request.newPassword)) {
      return { 
        success: false, 
        error: { message: 'Password does not meet security requirements' }
      };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: request.newPassword
    });

    if (error) {
      return { success: false, error: { message: error.message } };
    }

    const authSession = await formatAuthSession(data.session!);
    return { success: true, data: authSession };
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Password update failed', details: error }
    };
  }
}

/**
 * Gets current session
 * Requirement: Authentication & Authorization - Session management
 */
export async function getSession(): Promise<AuthSession | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }

  return formatAuthSession(session);
}

/**
 * Refreshes session token
 * Requirement: Security Controls - Token refresh mechanism
 */
export async function refreshSession(): Promise<AuthSession | null> {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error || !session) {
      return null;
    }

    const authSession = await formatAuthSession(session);
    authState = {
      ...authState,
      authenticated: true,
      session: authSession,
      user: authSession.user
    };

    return authSession;
  } catch (error) {
    console.error('Session refresh failed:', error);
    return null;
  }
}