/**
 * Core TypeScript type definitions for authentication, authorization, and session management
 * Addresses the following requirements:
 * - Authentication Flow: JWT-based authentication with secure token handling
 * - Session Management: 24-hour session duration with 7-day refresh limit
 * - Authorization Levels: Type definitions for user roles and access control
 */

import { APIResponse } from './api';
import { UserProfile } from './user';

/**
 * Type alias for JWT token string
 * Requirement: Authentication Flow - Secure token generation and validation
 */
export type AuthToken = string;

/**
 * Authentication state tracking
 * Requirement: Authentication Flow - State management
 */
export type AuthState = "authenticated" | "unauthenticated" | "loading";

/**
 * Token refresh behavior configuration
 * Requirement: Session Management - Refresh token handling
 */
export type RefreshStrategy = "always" | "never" | "expiringSoon";

/**
 * JWT token payload structure
 * Requirement: Authentication Flow - Secure token payload definition
 */
export interface JWTPayload {
  sub: string;                    // Subject (user ID)
  email: string;                  // User email
  role: UserRole;                 // User role for authorization
  status: UserStatus;             // Account status
  exp: number;                    // Expiration timestamp (24-hour validity)
  iat: number;                    // Issued at timestamp
  refreshToken?: string;          // Optional refresh token (7-day validity)
}

/**
 * Authentication context state
 * Requirement: Authentication Flow - Context management
 */
export interface AuthContext {
  state: AuthState;               // Current authentication state
  user: UserProfile | null;       // Authenticated user profile or null
  token: AuthToken | null;        // Current JWT token or null
  expiresAt: Date | null;         // Token expiration date
  refreshStrategy: RefreshStrategy; // Token refresh behavior
  isRefreshing: boolean;          // Refresh operation status
}

/**
 * Authentication endpoint response structure
 * Requirement: Authentication Flow - Standardized response format
 */
export interface AuthResponse extends APIResponse<AuthContext> {
  token: AuthToken;               // JWT access token
  refreshToken?: AuthToken;       // Optional refresh token
  expiresIn: number;             // Token expiration time in seconds
  requestId: string;             // Request tracking ID
  timestamp: string;             // Response timestamp
}

/**
 * Authentication-specific error codes
 * Requirement: Authentication Flow - Error handling
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  REFRESH_TOKEN_EXPIRED = "REFRESH_TOKEN_EXPIRED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  INVALID_SESSION = "INVALID_SESSION",
  USER_SUSPENDED = "USER_SUSPENDED",
  USER_DELETED = "USER_DELETED"
}

/**
 * Human Tasks:
 * 1. Configure JWT secret key in environment variables
 * 2. Set up token expiration times in configuration:
 *    - Access token: 24 hours
 *    - Refresh token: 7 days
 * 3. Implement token rotation strategy for refresh tokens
 * 4. Set up secure storage for refresh tokens
 * 5. Configure CORS settings for authentication endpoints
 */