/**
 * API endpoint handler for refreshing JWT access tokens using refresh tokens
 * Implements secure token rotation with RSA-256 signing and AES-256-GCM encryption
 * 
 * Requirements addressed:
 * - Session Management (8.1.3): Token refresh with 24-hour duration and 7-day limit
 * - Authentication Flow (8.1.1): Secure token refresh with rotation
 * 
 * Human Tasks:
 * 1. Configure secure cookie settings in environment variables
 * 2. Set up monitoring for refresh token usage patterns
 * 3. Configure rate limiting for refresh token endpoint
 * 4. Set up audit logging for token refresh operations
 */

import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { 
  AuthResponse,
  JWTPayload 
} from '../../types/auth';
import { 
  verifyRefreshToken,
  generateToken,
  generateRefreshToken 
} from '../../lib/auth/jwt';
import { AuthenticationError } from '../../lib/utils/errors';

// Cookie configuration
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
};

/**
 * Handles refresh token requests to generate new access tokens with secure token rotation
 * Requirement: Session Management - Secure token refresh implementation
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse>> {
  try {
    // Extract refresh token from HTTP-only cookie
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token not found', {
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    // Verify and decrypt refresh token
    const userId = await verifyRefreshToken(refreshToken);

    // Generate new access token
    const tokenPayload: JWTPayload = {
      sub: userId,
      email: request.headers.get('x-user-email') || '',
      role: request.headers.get('x-user-role') as any || 'user',
      status: request.headers.get('x-user-status') as any || 'active',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    // Generate new tokens
    const [newAccessToken, newRefreshToken] = await Promise.all([
      generateToken(tokenPayload),
      generateRefreshToken(userId)
    ]);

    // Prepare response with new tokens
    const response = {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    // Create response with new refresh token cookie
    const nextResponse = NextResponse.json(response);
    
    // Set HTTP-only cookie with new refresh token
    nextResponse.cookies.set(
      REFRESH_TOKEN_COOKIE,
      newRefreshToken,
      COOKIE_OPTIONS
    );

    return nextResponse;

  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 401 }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      { 
        error: 'Token refresh failed',
        code: 'REFRESH_ERROR'
      },
      { status: 500 }
    );
  }
}