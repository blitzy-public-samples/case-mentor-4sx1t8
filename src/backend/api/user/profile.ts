/**
 * Human Tasks:
 * 1. Set up monitoring for profile update operations
 * 2. Configure audit logging for profile deletions
 * 3. Set up rate limiting for profile endpoints
 */

// next/server v13.0.0
import { NextRequest, NextResponse } from 'next/server';
// zod v3.22.0
import { z } from 'zod';

import { UserProfile } from '../../../types/user';
import { UserModel } from '../../lib/database/models/user';
import { withAuth } from '../../lib/auth/middleware';
import { validateRequest } from '../../lib/utils/validation';

/**
 * Zod schema for profile update validation
 * Requirement: User Management - Profile customization and validation
 */
const UpdateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  preferredDrillTypes: z.array(z.string()).optional(),
  preferences: z.record(z.any()).optional()
});

/**
 * GET /api/user/profile
 * Retrieves authenticated user's profile data
 * Requirement: User Management - Profile data retrieval
 * Requirement: Authentication Flow - Secure profile access
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in request' },
        { status: 400 }
      );
    }

    const userModel = new UserModel(req.db);
    const profile = await userModel.findById(userId);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data before sending response
    const { passwordHash, ...safeProfile } = profile;

    return NextResponse.json(safeProfile);
  } catch (error) {
    console.error('Profile retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve profile' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/user/profile
 * Updates authenticated user's profile data
 * Requirement: User Management - Profile customization
 * Requirement: Data Security - Secure profile updates
 */
export const PUT = withAuth(async (req: NextRequest) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in request' },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validatedData = await validateRequest(body, UpdateProfileSchema);

    const userModel = new UserModel(req.db);
    
    // Verify user exists before update
    const existingProfile = await userModel.findById(userId);
    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Perform update with validated data
    const updatedProfile = await userModel.update(userId, validatedData);

    // Remove sensitive data before sending response
    const { passwordHash, ...safeProfile } = updatedProfile;

    return NextResponse.json(safeProfile);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid profile data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/user/profile
 * Soft deletes user's profile
 * Requirement: Data Security - Secure profile deletion
 * Requirement: User Management - Account lifecycle management
 */
export const DELETE = withAuth(async (req: NextRequest) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in request' },
        { status: 400 }
      );
    }

    const userModel = new UserModel(req.db);
    
    // Verify user exists before deletion
    const existingProfile = await userModel.findById(userId);
    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Perform soft delete
    await userModel.delete(userId);

    return NextResponse.json({
      message: 'Profile successfully deleted'
    });
  } catch (error) {
    console.error('Profile deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
});