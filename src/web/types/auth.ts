// @ts-check

/**
 * Human Tasks:
 * 1. Configure Supabase authentication settings in the project dashboard
 * 2. Set up OAuth providers (Google, GitHub) in Supabase
 * 3. Configure JWT token expiration and refresh token settings
 * 4. Implement proper session storage security measures
 */

// Import API response types
import { APIResponse, APIError } from './api';

// Import user-related types
import { User, UserProfile, UserSubscriptionTier } from './user';

// Import Supabase auth types
// @supabase/supabase-js ^2.0.0
import { Session, Provider } from '@supabase/supabase-js';

// Requirement: Authentication & Authorization - Login/registration credentials
export interface AuthCredentials {
  email: string;
  password: string;
}

// Requirement: Authentication & Authorization - JWT-based session management
export interface AuthSession {
  user: User;
  session: Session;
  profile: UserProfile;
  expiresAt: number; // Unix timestamp for JWT expiration
}

// Requirement: Authentication & Authorization - Frontend auth state management
export interface AuthState {
  initialized: boolean; // Whether auth system has been initialized
  loading: boolean; // Loading state for auth operations
  authenticated: boolean; // Current authentication status
  session: AuthSession | null; // Active session data
  user: User | null; // Current authenticated user
}

// Requirement: Security Controls - API response type for auth operations
export type AuthResponse = APIResponse<AuthSession>;

// Requirement: Authentication & Authorization - Supported auth providers
export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  GITHUB = 'github'
}

// Requirement: Security Controls - Password reset request
export interface PasswordResetRequest {
  email: string;
}

// Requirement: Security Controls - Password update with reset token
export interface PasswordUpdateRequest {
  token: string; // JWT reset token
  newPassword: string;
}

// Type guard to check if a provider is supported
export const isValidAuthProvider = (provider: string): provider is AuthProvider => {
  return Object.values(AuthProvider).includes(provider as AuthProvider);
};

// Type to ensure proper provider configuration
export type AuthProviderConfig = {
  [key in AuthProvider]: {
    enabled: boolean;
    clientId: string;
    clientSecret?: string;
    scopes?: string[];
  };
};

// Type for JWT payload structure
export interface JWTPayload {
  sub: string; // User ID
  email: string;
  role: string;
  tier: UserSubscriptionTier;
  iat: number; // Issued at
  exp: number; // Expiration
}

// Type for session refresh response
export interface SessionRefreshResponse extends AuthResponse {
  data: {
    session: Session;
    newExpiresAt: number;
  };
}

// Type for auth error details
export interface AuthErrorDetails extends APIError {
  provider?: AuthProvider;
  attemptCount?: number;
  lockoutUntil?: number;
}