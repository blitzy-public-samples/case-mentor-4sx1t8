/**
 * Human Tasks:
 * 1. Configure rate limiting in environment variables (RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)
 * 2. Set up monitoring for registration failures and rate limit hits
 * 3. Configure email verification settings if required
 * 4. Set up audit logging for user registration events
 */

// @ts-ignore zod v3.0.0
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { UserModel } from '../../lib/database/models/user';
import { generateToken, generateRefreshToken } from '../../lib/auth/jwt';
import { AuthResponse, UserProfile } from '../../types/auth';

// Initial user state constants
const INITIAL_USER_ROLE = "FREE_USER";
const INITIAL_USER_STATUS = "ACTIVE";

/**
 * Registration data validation schema
 * Requirement: Data Security - Input validation and sanitization
 */
const registrationSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(3, 'Email must be at least 3 characters')
    .max(255, 'Email must not exceed 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

/**
 * Validates user registration request data
 * Requirement: Data Security - Secure input validation
 */
async function validateRegistrationData(requestData: any): Promise<boolean> {
  try {
    await registrationSchema.parseAsync(requestData);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Registration endpoint handler with rate limiting
 * Requirements addressed:
 * - User Management: Enable profile customization and user account creation
 * - Authentication Flow: Implement secure user registration with JWT
 * - Data Security: Handle confidential user registration data
 */
export async function POST(req: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    // Parse request body
    const requestData = await req.json();

    // Validate registration data
    const isValid = await validateRegistrationData(requestData);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid registration data' },
        { status: 400 }
      );
    }

    // Check for existing user
    const userModel = new UserModel(req.db);
    const existingUser = await userModel.findByEmail(requestData.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create new user profile
    const newUserData: Partial<UserProfile> = {
      email: requestData.email,
      passwordHash: requestData.password,
      role: INITIAL_USER_ROLE,
      status: INITIAL_USER_STATUS,
      firstName: requestData.firstName,
      lastName: requestData.lastName,
      preferences: {}
    };

    // Create user record
    const user = await userModel.create(newUserData);

    // Generate authentication tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    };

    const token = await generateToken(tokenPayload);
    const refreshToken = await generateRefreshToken(user.id);

    // Return authentication response
    const response: AuthResponse = {
      token,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      data: {
        state: 'authenticated',
        user,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        refreshStrategy: 'expiringSoon',
        isRefreshing: false
      },
      success: true,
      message: 'Registration successful'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        success: false
      },
      { status: 500 }
    );
  }
}