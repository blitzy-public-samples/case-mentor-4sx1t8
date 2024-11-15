/**
 * Human Tasks:
 * 1. Configure email notification service for profile updates
 * 2. Set up monitoring for profile update failures
 * 3. Review and update form validation rules periodically
 */

// react version: ^18.0.0
'use client';

import React, { useCallback } from 'react';
import { SettingsForm, type SettingsFormProps } from '../../../components/profile/settings-form';
import { useAuth } from '../../../hooks/use-auth';
import { useToast } from '../../../hooks/use-toast';
import type { UserProfile } from '../../../types/user';

/**
 * @requirement User Management
 * Updates the user's profile settings with validation
 */
const updateProfile = async (profile: UserProfile): Promise<void> => {
  const response = await fetch('/api/profile/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }
};

/**
 * @requirement User Management
 * Protected page component for user profile settings management with form validation and feedback
 */
const SettingsPage: React.FC = () => {
  const { authState } = useAuth();
  const { showToast, ToastType } = useToast();

  /**
   * @requirement Form Validation
   * Handles profile update submission with validation
   */
  const handleProfileUpdate = useCallback(async (updatedProfile: UserProfile) => {
    try {
      await updateProfile(updatedProfile);
      showToast(
        'Profile settings updated successfully',
        ToastType.SUCCESS
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to update profile',
        ToastType.ERROR
      );
      throw error;
    }
  }, [showToast]);

  // Show loading state while auth data is being fetched
  if (authState.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Show error state for unauthorized access
  if (!authState.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Unauthorized Access
        </h1>
        <p className="text-gray-600 mb-6">
          Please log in to access profile settings
        </p>
        <a
          href="/login"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your personal information and preferences
          </p>
        </div>

        {/* Settings form */}
        <SettingsForm
          initialProfile={{
            fullName: authState.user.profile.fullName,
            email: authState.user.profile.email,
            preferences: authState.user.profile.preferences,
          }}
          onSubmit={handleProfileUpdate}
        />
      </div>
    </div>
  );
};

export default SettingsPage;