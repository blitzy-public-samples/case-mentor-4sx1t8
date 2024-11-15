/**
 * CORS (Cross-Origin Resource Sharing) configuration module
 * 
 * Human Tasks:
 * 1. Review and verify allowed origins match deployment environments
 * 2. Ensure development environment uses appropriate localhost ports
 * 3. Update CORS settings in cloud platform/deployment environment
 */

import { allowedOrigins } from './auth';

/**
 * Interface defining CORS configuration options
 * Requirements:
 * - Security Controls: Implement CORS whitelist for allowed origins
 * - API Security: Configure secure CORS headers for cross-origin requests
 */
export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

/**
 * List of allowed HTTP methods
 * Requirement: API Security - Configure secure CORS headers for cross-origin requests
 */
const ALLOWED_METHODS: string[] = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'OPTIONS'
];

/**
 * List of allowed request headers
 * Requirement: API Security - Configure secure CORS headers for cross-origin requests
 */
const ALLOWED_HEADERS: string[] = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'X-CSRF-Token'
];

/**
 * CORS preflight cache duration in seconds (24 hours)
 * Requirement: API Security - Configure secure CORS headers for cross-origin requests
 */
const MAX_AGE = 86400;

/**
 * Validates if a given origin is allowed based on environment and configured origins
 * Requirement: Security Controls - Implement CORS whitelist for allowed origins
 */
const isOriginAllowed = (origin: string): boolean => {
  // Allow localhost origins in development environment
  if (process.env.NODE_ENV === 'development') {
    const localhostRegex = /^https?:\/\/localhost(:\d+)?$/;
    if (localhostRegex.test(origin)) {
      return true;
    }
  }

  // Check against whitelist for production environment
  return allowedOrigins.includes(origin);
};

/**
 * Core CORS configuration object
 * Requirements:
 * - Security Controls: Implement CORS whitelist for allowed origins
 * - API Security: Configure secure CORS headers for cross-origin requests
 */
export const corsConfig: CORSConfig = {
  allowedOrigins: ['https://case-interview-platform.vercel.app'],
  allowedMethods: ALLOWED_METHODS,
  allowedHeaders: ALLOWED_HEADERS,
  credentials: true,
  maxAge: MAX_AGE
};

/**
 * CORS middleware configuration for NextJS
 * Requirements:
 * - Security Controls: Implement CORS whitelist for allowed origins
 * - API Security: Configure secure CORS headers for cross-origin requests
 */
export const corsMiddlewareConfig = {
  origin: isOriginAllowed,
  credentials: true,
  methods: ALLOWED_METHODS,
  allowedHeaders: ALLOWED_HEADERS,
  maxAge: MAX_AGE
};