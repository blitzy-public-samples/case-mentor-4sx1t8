// Human Tasks:
// 1. Configure rate limiting for user profile endpoints
// 2. Set up monitoring for subscription status changes
// 3. Implement audit logging for profile updates
// 4. Configure backup strategy for user data

import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { UserService } from '../../../services/UserService';
import { withAuth } from '../../../lib/auth/middleware';
import { APIError } from '../../../lib/errors/APIError';

/**
 * Retrieves user profile and progress data
 * @requirement User Management - Profile customization, progress tracking
 * @requirement Data Security - JWT-based authentication
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    const userService = new UserService();
    const requestingUser = (request as any).user;

    // Verify requesting user has access to requested profile
    if (requestingUser.id !== params.id) {
      throw new APIError(
        'AUTHORIZATION_ERROR',
        'Unauthorized access to user profile',
        { requestedId: params.id },
        request.headers.get('x-request-id') || 'unknown'
      );
    }

    // Retrieve user progress data
    const userProgress = await userService.getUserProgress(params.id);

    return NextResponse.json({
      success: true,
      data: userProgress
    });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(error.toJSON(), { status: 401 });
    }
    return NextResponse.json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve user data',
      details: {},
      timestamp: new Date().toISOString(),
      requestId: request.headers.get('x-request-id') || 'unknown'
    }, { status: 500 });
  }
});

/**
 * Updates user profile information
 * @requirement User Management - Profile customization
 * @requirement Data Security - JWT-based authentication
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    const userService = new UserService();
    const requestingUser = (request as any).user;

    // Verify requesting user owns the profile
    if (requestingUser.id !== params.id) {
      throw new APIError(
        'AUTHORIZATION_ERROR',
        'Unauthorized profile modification',
        { requestedId: params.id },
        request.headers.get('x-request-id') || 'unknown'
      );
    }

    // Parse and validate request body
    const profileData = await request.json();
    
    // Update user profile
    const updatedUser = await userService.updateProfile(params.id, profileData);

    return NextResponse.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(error.toJSON(), { status: 401 });
    }
    return NextResponse.json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update user profile',
      details: {},
      timestamp: new Date().toISOString(),
      requestId: request.headers.get('x-request-id') || 'unknown'
    }, { status: 500 });
  }
});

/**
 * Deactivates user account and cancels subscriptions
 * @requirement Subscription System - Account management
 * @requirement Data Security - JWT-based authentication
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    const userService = new UserService();
    const requestingUser = (request as any).user;

    // Verify requesting user owns the account
    if (requestingUser.id !== params.id) {
      throw new APIError(
        'AUTHORIZATION_ERROR',
        'Unauthorized account deletion',
        { requestedId: params.id },
        request.headers.get('x-request-id') || 'unknown'
      );
    }

    // Cancel subscription and deactivate account
    await userService.updateSubscription(params.id, {
      tier: 'FREE',
      status: 'CANCELLED'
    });

    return NextResponse.json({
      success: true,
      message: 'Account successfully deactivated'
    });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(error.toJSON(), { status: 401 });
    }
    return NextResponse.json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to deactivate account',
      details: {},
      timestamp: new Date().toISOString(),
      requestId: request.headers.get('x-request-id') || 'unknown'
    }, { status: 500 });
  }
});