// @package react ^18.0.0
// @package next ^13.0.0

// Human Tasks:
// 1. Configure email service provider for password reset emails
// 2. Set up rate limiting for password reset requests
// 3. Review and update email templates for password reset notifications
// 4. Test password reset flow across different email clients

import React from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Card } from '../../../components/common/card';
import { PasswordResetForm } from '../../../components/auth/password-reset-form';
import { getCurrentSession } from '../../../lib/auth';

// @requirement Authentication System - Page metadata configuration
export const generateMetadata = (): Metadata => {
  return {
    title: 'Forgot Password | Case Interview Practice Platform',
    description: 'Reset your password to regain access to your Case Interview Practice Platform account',
    robots: {
      index: false,
      follow: false,
    },
    // Additional metadata for better SEO and social sharing
    openGraph: {
      title: 'Forgot Password | Case Interview Practice Platform',
      description: 'Reset your password to regain access to your Case Interview Practice Platform account',
      type: 'website',
    },
  };
};

/**
 * @requirement Authentication System - Secure password reset functionality
 * @requirement User Management - Account management and password recovery
 * @requirement Accessibility Requirements - WCAG 2.1 AA compliant
 */
async function ForgotPasswordPage(): Promise<JSX.Element> {
  // Check if user is already authenticated
  const session = await getCurrentSession();
  
  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    // @requirement Accessibility Requirements - Proper ARIA landmarks
    <main 
      className="min-h-screen flex items-center justify-center px-4 py-12"
      role="main"
      aria-labelledby="forgot-password-heading"
    >
      <Card
        variant="elevated"
        padding="large"
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 
            id="forgot-password-heading"
            className="text-2xl font-semibold text-gray-900"
          >
            Forgot Password
          </h1>
          <p 
            className="mt-2 text-sm text-gray-600"
            // @requirement Accessibility Requirements - Descriptive text
            aria-describedby="forgot-password-description"
          >
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {/* @requirement Authentication System - Password reset form with email validation */}
        <PasswordResetForm
          token=""
          email=""
          onSuccess={() => {
            // Success callback will be handled by the form component
          }}
        />

        {/* Additional help text for accessibility */}
        <div
          id="forgot-password-description"
          className="mt-6 text-xs text-gray-500 text-center"
          aria-live="polite"
        >
          If you don't receive an email within a few minutes, please check your spam folder
          or contact support for assistance.
        </div>
      </Card>
    </main>
  );
}

export default ForgotPasswordPage;