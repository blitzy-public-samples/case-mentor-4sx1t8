// @ts-check

// Human Tasks:
// 1. Generate and securely store RSA key pair for JWT signing
// 2. Configure cookie settings in production environment
// 3. Set up monitoring for token refresh patterns
// 4. Review token expiry settings with security team

import { sign, verify } from 'jsonwebtoken'; // ^9.0.0
import { serialize, CookieSerializeOptions } from 'cookie'; // ^0.5.0
import { APIError, APIErrorCode } from '../../types/api';
import { User } from '../../types/user';
import { AUTH_CONSTANTS } from '../../config/constants';

// @requirement: Authentication and Authorization - JWT-based authentication with RSA-256 signing
const RSA_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;
const RSA_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;

if (!RSA_PRIVATE_KEY || !RSA_PUBLIC_KEY) {
  throw new Error('JWT RSA keys must be configured in environment variables');
}

/**
 * Generates a new JWT token for authenticated users using RSA-256 signing
 * @requirement: Authentication and Authorization - Secure token generation
 */
export const generateToken = (user: User): string => {
  const payload = {
    id: user.id,
    email: user.email,
    subscriptionTier: user.subscriptionTier,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + AUTH_CONSTANTS.TOKEN_EXPIRY
  };

  return sign(payload, RSA_PRIVATE_KEY, {
    algorithm: 'RS256'
  });
};

/**
 * Verifies and decodes a JWT token using RSA-256 public key
 * @requirement: Authentication and Authorization - Secure token validation
 */
export const verifyToken = (token: string): User | null => {
  try {
    const decoded = verify(token, RSA_PUBLIC_KEY, {
      algorithms: ['RS256']
    }) as {
      id: string;
      email: string;
      subscriptionTier: User['subscriptionTier'];
      exp: number;
    };

    // Verify token hasn't expired
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      subscriptionTier: decoded.subscriptionTier
    } as User;
  } catch (error) {
    return null;
  }
};

/**
 * Sets secure HTTP-only cookie with JWT token
 * @requirement: Session Management - Secure cookie handling
 */
export const setAuthCookie = (token: string, response: any): void => {
  const cookieOptions: CookieSerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AUTH_CONSTANTS.TOKEN_EXPIRY,
    path: '/'
  };

  const serializedCookie = serialize(AUTH_CONSTANTS.COOKIE_NAME, token, cookieOptions);
  response.setHeader('Set-Cookie', serializedCookie);
};

/**
 * Clears the authentication cookie on user logout
 * @requirement: Session Management - Secure session termination
 */
export const clearAuthCookie = (response: any): void => {
  const cookieOptions: CookieSerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  };

  const serializedCookie = serialize(AUTH_CONSTANTS.COOKIE_NAME, '', cookieOptions);
  response.setHeader('Set-Cookie', serializedCookie);
};

/**
 * Implements rolling refresh mechanism for JWT tokens
 * @requirement: Session Management - 24-hour session duration with rolling refresh
 */
export const refreshToken = (token: string): string | null => {
  const user = verifyToken(token);
  if (!user) {
    return null;
  }

  const tokenData = verify(token, RSA_PUBLIC_KEY, {
    algorithms: ['RS256']
  }) as { exp: number };

  // Check if token is within refresh window (7 days before expiry)
  const shouldRefresh = tokenData.exp - Math.floor(Date.now() / 1000) <= AUTH_CONSTANTS.REFRESH_WINDOW;

  if (shouldRefresh) {
    return generateToken(user);
  }

  return null;
};

/**
 * Error factory for authentication failures
 * @private
 */
const createAuthError = (message: string): APIError => ({
  code: APIErrorCode.AUTHENTICATION_ERROR,
  message
});