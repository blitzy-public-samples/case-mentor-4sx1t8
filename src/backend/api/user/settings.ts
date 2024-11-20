/**
 * Human Tasks:
 * 1. Configure timezone validation against IANA timezone database
 * 2. Set up monitoring for settings update failures
 * 3. Configure language code validation against ISO 639-1
 */

// next/server v13.0.0
import { NextResponse, NextRequest } from 'next/server';
// zod ^3.0.0
import { z } from 'zod';

import { UserSettings } from '../../../types/user';
import { updateUserProfile } from '../../../lib/database/queries/users';
import { withAuth } from '../../../lib/auth/middleware';

/**
 * Validation schema for settings update request
 * Requirement: Data Security - Handle confidential user settings data
 */
const updateSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  progressReminders: z.boolean(),
  timezone: z.string().min(1).max(50),
  language: z.string().length(2),
  uiPreferences: z.record(z.any())
});

/**
 * Retrieves current user settings
 * Requirement: User Management - Profile customization and settings management
 */
async function getSettings(req: NextRequest): Promise<NextResponse> {
  try {
    // Extract authenticated user ID from request
    const userId = req.auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    // Retrieve user settings from database
    const userSettings = await updateUserProfile(userId, {});

    // Return settings in standardized response format
    return NextResponse.json({
      success: true,
      data: {
        userId: userSettings.id,
        emailNotifications: userSettings.preferences?.emailNotifications ?? false,
        progressReminders: userSettings.preferences?.progressReminders ?? false,
        timezone: userSettings.preferences?.timezone ?? 'UTC',
        language: userSettings.preferences?.language ?? 'en',
        uiPreferences: userSettings.preferences?.uiPreferences ?? {}
      } as UserSettings
    });
  } catch (error) {
    console.error('Error retrieving user settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

/**
 * Updates user settings with validation
 * Requirement: User Management - Profile customization and settings management
 * Requirement: Data Security - Handle confidential user settings data
 */
async function updateSettings(req: NextRequest): Promise<NextResponse> {
  try {
    // Extract authenticated user ID from request
    const userId = req.auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid settings data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const settings = validationResult.data;

    // Update settings in database
    const updatedProfile = await updateUserProfile(userId, {
      preferences: {
        emailNotifications: settings.emailNotifications,
        progressReminders: settings.progressReminders,
        timezone: settings.timezone,
        language: settings.language,
        uiPreferences: settings.uiPreferences
      }
    });

    // Return updated settings
    return NextResponse.json({
      success: true,
      data: {
        userId: updatedProfile.id,
        emailNotifications: settings.emailNotifications,
        progressReminders: settings.progressReminders,
        timezone: settings.timezone,
        language: settings.language,
        uiPreferences: settings.uiPreferences
      } as UserSettings
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// Export route handlers with authentication middleware
export const GET = withAuth(getSettings, { optional: false });
export const PUT = withAuth(updateSettings, { optional: false });