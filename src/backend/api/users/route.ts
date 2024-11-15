// Human Tasks:
// 1. Configure rate limiting thresholds in environment variables
// 2. Set up monitoring for authentication failures
// 3. Configure session cookie settings for production environment
// 4. Set up error tracking for failed user operations

import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { z } from 'zod'; // ^3.22.0
import { UserService } from '../../services/UserService';
import { withAuth } from '../../lib/auth/middleware';
import { handleError } from '../../lib/errors/handlers';
import { APIErrorCode } from '../../types/api';

// Initialize global UserService instance
const userService = new UserService();

// Validation schemas
const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  profile: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    targetRole: z.string().optional(),
    interviewDate: z.string().optional(),
    preferredFirms: z.array(z.string()).optional()
  })
});

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  targetRole: z.string().optional(),
  interviewDate: z.string().optional(),
  preferredFirms: z.array(z.string()).optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    push: z.boolean()
  }).optional()
});

/**
 * GET /api/users - Retrieves authenticated user's profile and progress
 * Requirements addressed:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Authentication (8. SECURITY CONSIDERATIONS/8.1 Authentication and Authorization)
 */
export const GET = withAuth(async (
  request: NextRequest,
  context: { user: { id: string } }
) => {
  try {
    // Extract user ID from authenticated context
    const { id: userId } = context.user;

    // Retrieve user progress data
    const userProgress = await userService.getUserProgress(userId);

    return NextResponse.json({
      success: true,
      data: userProgress,
      error: null,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleError(error as Error, request.headers.get('x-request-id') || '');
  }
});

/**
 * POST /api/users - Handles user registration with profile creation
 * Requirements addressed:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Subscription System (3. SCOPE/Core Features/Subscription System)
 */
export const POST = async (request: NextRequest) => {
  try {
    // Parse and validate registration data
    const registrationData = registrationSchema.parse(await request.json());

    // Register new user
    const user = await userService.registerUser(registrationData);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        subscription: user.subscription
      },
      error: null,
      metadata: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError({
        name: 'ValidationError',
        message: 'Invalid registration data',
        cause: error
      }, request.headers.get('x-request-id') || '');
    }
    return handleError(error as Error, request.headers.get('x-request-id') || '');
  }
});

/**
 * PUT /api/users - Updates authenticated user's profile
 * Requirements addressed:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Authentication (8. SECURITY CONSIDERATIONS/8.1 Authentication and Authorization)
 */
export const PUT = withAuth(async (
  request: NextRequest,
  context: { user: { id: string } }
) => {
  try {
    // Extract user ID from authenticated context
    const { id: userId } = context.user;

    // Parse and validate profile update data
    const profileData = profileUpdateSchema.parse(await request.json());

    // Update user profile
    const updatedUser = await userService.updateProfile(userId, profileData);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        profile: updatedUser.profile,
        subscription: updatedUser.subscription
      },
      error: null,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError({
        name: 'ValidationError',
        message: 'Invalid profile data',
        cause: error
      }, request.headers.get('x-request-id') || '');
    }
    return handleError(error as Error, request.headers.get('x-request-id') || '');
  }
});