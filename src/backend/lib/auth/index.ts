/**
 * Main authentication module for the Case Interview Practice Platform
 * Centralizes authentication-related functionality including token management,
 * secure cookie handling, and role-based access control
 * 
 * Human Tasks:
 * 1. Review and validate JWT key pair configuration
 * 2. Set up monitoring for authentication events
 * 3. Configure rate limiting for auth endpoints
 * 4. Implement audit logging strategy
 */

// @requirement: Authentication and Authorization - JWT-based authentication with RSA-256 signing and secure session management
import {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  refreshToken
} from './jwt';

// @requirement: Security Controls - Authentication middleware with JWT validation and rate limiting
import {
  withAuth,
  requireSubscription
} from './middleware';

// Re-export all authentication utilities and middleware
export {
  // Token management functions
  generateToken,
  verifyToken,
  refreshToken,

  // Cookie management functions
  setAuthCookie,
  clearAuthCookie,

  // Authentication and authorization middleware
  withAuth,
  requireSubscription
};