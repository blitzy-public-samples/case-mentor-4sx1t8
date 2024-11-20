/**
 * Protected API endpoint handler for user logout that invalidates JWT tokens and clears session data
 * 
 * Human Tasks:
 * 1. Configure secure cookie settings in production environment
 * 2. Set up monitoring for logout events
 * 3. Configure Redis connection parameters
 * 4. Set up audit logging for logout events
 */

import { NextResponse, NextRequest } from 'next/server'; // v13.0.0
import { withAuth, MiddlewareConfig } from '../../lib/auth/middleware';
import { RedisCache } from '../../lib/cache/redis';
import { AuthenticationError } from '../../lib/utils/errors';

// Cookie configuration for clearing auth tokens
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 0, // Immediately expire the cookie
  expires: new Date(0) // Set expiration to past date
};

/**
 * Protected API route handler that manages user logout by invalidating JWT tokens and clearing session data
 * Requirements addressed:
 * - Authentication Flow (8.1.1): Implement secure logout flow with token invalidation
 * - Session Management (8.1.3): Handle JWT session termination and cookie cleanup
 */
async function logoutHandler(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract JWT token from request auth context
    const token = request.auth?.token;
    if (!token) {
      throw new AuthenticationError('No active session found', {
        code: 'TOKEN_INVALID'
      });
    }

    // Get Redis cache singleton instance
    const redisCache = RedisCache.getInstance();

    // Delete user session data from Redis cache using token as key
    await redisCache.delete(`session:${token}`);

    // Create success response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Successfully logged out'
      },
      { status: 200 }
    );

    // Clear auth cookies by setting empty values and past expiry
    response.cookies.set('auth_token', '', AUTH_COOKIE_OPTIONS);
    response.cookies.set('refresh_token', '', AUTH_COOKIE_OPTIONS);

    // Set security headers
    response.headers.set('Clear-Site-Data', '"cookies", "storage"');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');

    return response;

  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code
        },
        { status: 401 }
      );
    }

    // Handle unexpected errors
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process logout',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware with required authentication
const middlewareConfig: MiddlewareConfig = {
  optional: false // Require valid authentication
};

// Export protected logout handler
export default withAuth(logoutHandler, middlewareConfig);