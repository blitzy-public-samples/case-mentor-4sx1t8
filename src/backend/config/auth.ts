/**
 * Authentication configuration module for the Case Interview Practice Platform
 * 
 * Human Tasks:
 * 1. Set up JWT_SECRET in environment variables with a secure random value
 * 2. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables
 * 3. Review and adjust CORS allowed origins based on deployment environment
 * 4. Ensure RSA-256 key pair is generated and configured for JWT signing
 */

import { createClient } from '@supabase/supabase-js'; // v2.0.0
import { AuthToken, JWTPayload, AuthErrorCode } from '../types/auth';
import { AuthenticationError } from '../lib/utils/errors';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new AuthenticationError(
    'Missing Supabase configuration',
    { code: AuthErrorCode.TOKEN_INVALID }
  );
}

if (!process.env.JWT_SECRET) {
  throw new AuthenticationError(
    'Missing JWT configuration',
    { code: AuthErrorCode.TOKEN_INVALID }
  );
}

/**
 * JWT token expiration duration in seconds (24 hours)
 * Requirement: Session Management - Configure JWT token with 24-hour duration
 */
export const JWT_EXPIRES_IN = 24 * 60 * 60;

/**
 * Refresh token expiration duration in seconds (7 days)
 * Requirement: Session Management - Configure 7-day refresh limit
 */
export const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60;

/**
 * Secure cookie configuration options
 * Requirement: Security Controls - Implement secure cookie settings
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,      // Prevent JavaScript access to cookies
  secure: true,        // Only transmit cookies over HTTPS
  sameSite: 'strict' as const,  // Strict same-site policy
  path: '/'           // Cookie accessible across all routes
};

/**
 * Authentication configuration interface
 * Requirement: Authentication Flow - Define secure authentication configuration
 */
interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: number;
  refreshTokenExpiresIn: number;
  issuer: string;
  allowedOrigins: string[];
}

/**
 * Core authentication configuration
 * Requirements:
 * - Authentication Flow - Define secure authentication with JWT
 * - Security Controls - Implement JWT with RSA-256
 */
export const authConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: JWT_EXPIRES_IN,
  refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRES_IN,
  issuer: 'case-interview-platform',
  allowedOrigins: [
    'https://case-interview-platform.vercel.app'
  ]
};

/**
 * Initialize Supabase client with authentication configuration
 * Requirement: Authentication Flow - Define secure authentication with Supabase
 */
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);