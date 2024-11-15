// react: ^18.0.0
// next: ^13.0.0

import React from 'react';
import { Metadata } from 'next';
import { Avatar } from '../../components/shared/Avatar';
import { Card } from '../../components/shared/Card';
import { useAuth } from '../../hooks/useAuth';

/**
 * Human Tasks:
 * 1. Configure proper image optimization settings in next.config.js for avatar images
 * 2. Set up proper error monitoring for profile data loading failures
 * 3. Verify accessibility testing coverage for profile interactions
 */

// Requirement: User Interface Design - Component Library (7.1.2)
// Profile section configuration for consistent layout
const PROFILE_SECTIONS = ['Personal Information', 'Subscription', 'Practice History', 'Settings'];

// Requirement: User Interface Design - Component Library (7.1.2)
// Skill categories for progress tracking
const SKILL_CATEGORIES = ['Case Math', 'Market Sizing', 'Brainstorming', 'Synthesis'];

// Requirement: User Interface Design - Component Library (7.1.2)
interface ProfileStats {
  totalDrills: number;
  averageScore: number;
  completedSimulations: number;
  skillProgress: Record<string, number>;
}

// Requirement: User Interface Design - Component Library (7.1.2)
// Metadata configuration for profile page
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Profile | Case Interview Practice Platform',
    description: 'Manage your profile, view practice history, and track your progress in case interview preparation',
    robots: {
      index: false,
      follow: false,
    },
  };
}

// Requirement: User Interface Design & Accessibility Requirements (7.1.4)
export default function ProfilePage() {
  const { state } = useAuth();
  
  // Requirement: Authentication & Authorization (8.1)
  if (!state.initialized) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-label="Loading profile"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Requirement: Authentication & Authorization (8.1)
  if (!state.authenticated || !state.session) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-screen"
        role="alert"
      >
        <h1 className="text-xl font-semibold mb-2">Authentication Required</h1>
        <p>Please sign in to view your profile</p>
      </div>
    );
  }

  const { user, profile } = state.session;

  // Requirement: User Interface Design - Component Library (7.1.2)
  const stats: ProfileStats = {
    totalDrills: profile.drillsCompleted || 0,
    averageScore: profile.averageScore || 0,
    completedSimulations: profile.simulationsCompleted || 0,
    skillProgress: profile.skillProgress || {},
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Requirement: Accessibility Requirements (7.1.4) - Semantic structure */}
      <header className="mb-8">
        <div className="flex items-center gap-4">
          {/* Requirement: User Interface Design - Component Library (7.1.2) */}
          <Avatar
            size="lg"
            profile={profile}
            className="flex-shrink-0"
          />
          <div>
            <h1 className="text-2xl font-semibold mb-1">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* Personal Information Section */}
        {/* Requirement: User Interface Design - Component Library (7.1.2) */}
        <Card shadow="sm" padding="lg">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Subscription Section */}
        {/* Requirement: User Interface Design - Component Library (7.1.2) */}
        <Card shadow="sm" padding="lg">
          <h2 className="text-xl font-semibold mb-4">Subscription</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Plan</label>
              <p className="mt-1 flex items-center">
                <span className="capitalize">{profile.subscriptionTier || 'Free'}</span>
                {profile.subscriptionTier !== 'free' && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Active
                  </span>
                )}
              </p>
            </div>
            {profile.subscriptionEndsAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Renewal Date</label>
                <p className="mt-1">
                  {new Date(profile.subscriptionEndsAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Practice History Section */}
        {/* Requirement: User Interface Design - Component Library (7.1.2) */}
        <Card shadow="sm" padding="lg">
          <h2 className="text-xl font-semibold mb-4">Practice History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Statistics</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total Drills</dt>
                  <dd className="font-medium">{stats.totalDrills}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Average Score</dt>
                  <dd className="font-medium">{stats.averageScore}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Simulations</dt>
                  <dd className="font-medium">{stats.completedSimulations}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">Skill Progress</h3>
              <div className="space-y-3">
                {SKILL_CATEGORIES.map(skill => (
                  <div key={skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{skill}</span>
                      <span>{stats.skillProgress[skill] || 0}%</span>
                    </div>
                    {/* Requirement: Accessibility Requirements (7.1.4) - Progress indication */}
                    <div 
                      className="h-2 bg-gray-200 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={stats.skillProgress[skill] || 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${stats.skillProgress[skill] || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Settings Section */}
        {/* Requirement: User Interface Design - Component Library (7.1.2) */}
        <Card shadow="sm" padding="lg">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="notifications"
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id="notifications"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={profile.notificationsEnabled}
                  onChange={() => {}} // Handle in implementation
                />
                <span>Email notifications for practice reminders</span>
              </label>
            </div>
            <div className="pt-4 border-t">
              <button
                type="button"
                className="text-red-600 hover:text-red-700 font-medium"
                onClick={() => {}} // Handle in implementation
              >
                Delete Account
              </button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}