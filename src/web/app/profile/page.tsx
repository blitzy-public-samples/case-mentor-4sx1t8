// react version: ^18.0.0
// class-variance-authority version: ^1.0.0
'use client';

import React, { useEffect } from 'react';
import { cn } from 'class-variance-authority';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import ProgressChart from '../../../components/profile/progress-chart';
import SubscriptionPlan from '../../../components/profile/subscription-plan';
import SettingsForm from '../../../components/profile/settings-form';
import { useAuth } from '../../../hooks/use-auth';

// Human Tasks:
// 1. Configure monitoring for profile page performance metrics
// 2. Set up error tracking for profile data loading failures
// 3. Review and update SEO metadata periodically

// @requirement User Management - Profile customization and progress tracking
export const generateMetadata = (): Metadata => {
  return {
    title: 'Profile | Case Interview Practice Platform',
    description: 'Manage your profile settings, track practice progress, and handle subscription details',
    robots: 'noindex, nofollow',
    openGraph: {
      title: 'Your Profile - Case Interview Practice',
      description: 'Track your progress and manage your account settings'
    }
  };
};

// @requirement User Management - Profile customization, progress tracking, and performance analytics
export default function ProfilePage(): JSX.Element {
  const { authState, loading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !authState.user) {
      redirect('/login');
    }
  }, [authState.user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-200 rounded-lg" />
            <div className="h-96 bg-gray-200 rounded-lg" />
            <div className="h-[400px] bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!authState.user) {
    return null; // Let the redirect handle unauthorized state
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your account settings and view your practice progress
            </p>
          </div>

          {/* Progress Section */}
          {/* @requirement User Management - Progress tracking and performance analytics */}
          <section aria-labelledby="progress-heading">
            <h2 id="progress-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Practice Progress
            </h2>
            <div className="bg-white shadow rounded-lg">
              <ProgressChart
                className="p-6"
                drillTypes={[
                  'CASE_PROMPT',
                  'CALCULATION',
                  'MARKET_SIZING',
                  'BRAINSTORMING'
                ]}
                showLegend={true}
              />
            </div>
          </section>

          {/* Subscription Section */}
          {/* @requirement Subscription System - Tiered access control and subscription management */}
          <section aria-labelledby="subscription-heading">
            <h2 id="subscription-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Subscription Plan
            </h2>
            <SubscriptionPlan 
              className={cn(
                "bg-white shadow rounded-lg",
                "transition-all duration-200 hover:shadow-md"
              )}
            />
          </section>

          {/* Settings Section */}
          {/* @requirement User Management - Profile customization and settings management */}
          <section aria-labelledby="settings-heading">
            <h2 id="settings-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Profile Settings
            </h2>
            <div className="bg-white shadow rounded-lg p-6">
              <SettingsForm
                initialProfile={{
                  fullName: authState.user.user_metadata?.full_name || '',
                  email: authState.user.email || '',
                  targetInterviewDate: authState.user.user_metadata?.target_interview_date,
                  targetCompanies: authState.user.user_metadata?.target_companies || [],
                  preferences: {
                    emailNotifications: authState.user.user_metadata?.email_notifications ?? true,
                    darkMode: authState.user.user_metadata?.dark_mode ?? false
                  }
                }}
                onSubmit={async (profile) => {
                  try {
                    // Update user metadata through Supabase auth
                    const { data, error } = await supabase.auth.updateUser({
                      data: {
                        full_name: profile.fullName,
                        target_interview_date: profile.targetInterviewDate,
                        target_companies: profile.targetCompanies,
                        email_notifications: profile.preferences.emailNotifications,
                        dark_mode: profile.preferences.darkMode
                      }
                    });

                    if (error) throw error;
                    return data;
                  } catch (error) {
                    console.error('Failed to update profile:', error);
                    throw error;
                  }
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}