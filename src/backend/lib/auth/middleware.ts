// Human Tasks:
// 1. Configure rate limiting parameters for authentication endpoints
// 2. Set up monitoring for failed authentication attempts
// 3. Review and adjust token refresh window settings
// 4. Implement audit logging for authentication events

import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { verifyToken, refreshToken, setAuthCookie } from './jwt';
import { APIError, APIErrorCode } from '../../types/api';
import { User, UserSubscriptionTier } from '../../types/user';

/**
 * Higher-order function that wraps API route handlers with authentication logic
 * @requirement: Authentication and Authorization - JWT-based authentication with secure session management
 */
export const withAuth = (
  handler: (req: NextRequest, context: { user: User }) => Promise<NextResponse>,
  options: { requireAuth?: boolean } = { requireAuth: true }
) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Extract token from cookie or Authorization header
    const token = req.cookies.get('auth_token')?.value || 
                 req.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token && options.requireAuth) {
      return NextResponse.json(
        {
          code: APIErrorCode.AUTHENTICATION_ERROR,
          message: 'Authentication required',
          details: {}
        } as APIError,
        { status: 401 }
      );
    }

    if (!token && !options.requireAuth) {
      return handler(req, { user: null as unknown as User });
    }

    // Verify token
    const user = token ? verifyToken(token) : null;
    if (!user && options.requireAuth) {
      return NextResponse.json(
        {
          code: APIErrorCode.AUTHENTICATION_ERROR,
          message: 'Invalid or expired token',
          details: {}
        } as APIError,
        { status: 401 }
      );
    }

    // Check if token needs refresh
    const newToken = token ? refreshToken(token) : null;
    const response = await handler(req, { user: user as User });

    // Set new auth cookie if token was refreshed
    if (newToken) {
      setAuthCookie(newToken, response);
    }

    return response;
  };
};

/**
 * Middleware to check if authenticated user has required subscription tier access
 * @requirement: Security Controls - Role-based access control and subscription validation
 */
export const requireSubscription = (requiredTiers: UserSubscriptionTier[]) => {
  return async (
    req: NextRequest,
    context: { user: User }
  ): Promise<NextResponse | null> => {
    const { user } = context;

    if (!requiredTiers.includes(user.subscriptionTier)) {
      return NextResponse.json(
        {
          code: APIErrorCode.AUTHORIZATION_ERROR,
          message: 'Subscription tier not authorized for this resource',
          details: {
            currentTier: user.subscriptionTier,
            requiredTiers
          }
        } as APIError,
        { status: 403 }
      );
    }

    return null;
  };
};