/**
 * Login endpoint handler that implements secure JWT-based authentication with rate limiting
 * 
 * Human Tasks:
 * 1. Configure rate limiting Redis instance in environment variables
 * 2. Set up monitoring for failed login attempts
 * 3. Configure audit logging for authentication events
 * 4. Set up CORS policy for authentication endpoints
 */

// External dependencies
import { z } from 'zod'; // ^3.22.0
import bcrypt from 'bcryptjs'; // ^2.4.3
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/middleware/rateLimit';

// Internal dependencies
import { AuthResponse, JWTPayload } from '../../types/auth';
import { 
  generateToken, 
  generateRefreshToken 
} from '../../lib/auth/jwt';
import { 
  validateRequest,
  validateEmail,
  validatePassword 
} from '../../lib/utils/validation';
import { getUserByEmail } from '../../lib/database/queries/users';

// Rate limiting configuration
const LOGIN_RATE_LIMIT = 60; // Requests per hour
const LOGIN_RATE_WINDOW = 3600; // Window in seconds (1 hour)

/**
 * Login request schema validation
 * Requirement: Authentication Flow - Input validation
 */
const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .refine(validateEmail, 'Invalid email format'),
  password: z.string()
    .min(1, 'Password is required')
    .refine(validatePassword, 'Invalid password format'),
  rememberMe: z.boolean().optional().default(false)
});

/**
 * Login request handler with rate limiting protection
 * Requirements addressed:
 * - Authentication Flow (8.1.1): JWT-based authentication with RSA-256 signing
 * - Session Management (8.1.3): 24-hour token with 7-day refresh option
 * - Rate Limiting (7.3.4): 60 requests per hour limit
 */
async function handleLogin(
  req: NextRequest
): Promise<NextResponse<AuthResponse>> {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validatedData = await validateRequest(body, loginSchema);

    // Retrieve user by email
    const user = await getUserByEmail(validatedData.email);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Verify account status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Account is not active',
          code: 'ACCOUNT_INACTIVE'
        },
        { status: 403 }
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(
      validatedData.password,
      user.passwordHash
    );
    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Generate JWT payload
    const tokenPayload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000)
    };

    // Generate access token
    const token = await generateToken(tokenPayload);

    // Generate refresh token if rememberMe is true
    let refreshToken: string | undefined;
    if (validatedData.rememberMe) {
      refreshToken = await generateRefreshToken(user.id);
    }

    // Prepare response
    const response: AuthResponse = {
      success: true,
      token,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      data: {
        state: 'authenticated',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status
        },
        token,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)),
        refreshStrategy: validatedData.rememberMe ? 'expiringSoon' : 'never',
        isRefreshing: false
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Rate-limited login endpoint handler
 * Requirement: Rate Limiting - Protect against brute force attacks
 */
export const POST = rateLimit({
  limit: LOGIN_RATE_LIMIT,
  window: LOGIN_RATE_WINDOW,
  handler: handleLogin
});