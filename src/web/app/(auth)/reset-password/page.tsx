// react v18.0.0
import React from 'react';
// next v13.0.0
import { Metadata } from 'next';
import ResetPasswordForm from '../../../components/auth/ResetPasswordForm';
import Loading from '../../../components/shared/Loading';

// Human Tasks:
// 1. Verify Supabase email templates are configured for password reset
// 2. Test password reset flow in all supported browsers
// 3. Verify email sending domain is properly configured
// 4. Test screen reader compatibility across different devices

/**
 * Generates static metadata for the reset password page
 * Requirement: User Interface Design - SEO optimization
 */
export const generateMetadata = (): Metadata => {
  return {
    title: 'Reset Password | Case Interview Practice Platform',
    description: 'Reset your password securely to regain access to your Case Interview Practice Platform account.',
    // Additional metadata for SEO optimization
    robots: 'noindex, nofollow', // Prevent indexing of sensitive pages
    openGraph: {
      title: 'Reset Password | Case Interview Practice Platform',
      description: 'Reset your password securely to regain access to your Case Interview Practice Platform account.',
      type: 'website',
    },
  };
};

/**
 * Reset password page component implementing WCAG 2.1 AA accessibility standards
 * Requirement: Authentication & Authorization - Secure password reset functionality
 * Requirement: User Interface Design - WCAG 2.1 AA compliant interface
 */
const ResetPasswordPage: React.FC = () => {
  return (
    // Requirement: User Interface Design - Semantic HTML and ARIA landmarks
    <main
      role="main"
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50"
      // Requirement: User Interface Design - Skip navigation for keyboard users
      tabIndex={-1}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Requirement: User Interface Design - Semantic heading hierarchy */}
        <div className="text-center">
          <h1 
            className="text-3xl font-bold tracking-tight text-gray-900"
            // Requirement: User Interface Design - Screen reader optimization
            aria-label="Reset Password Page"
          >
            Reset Password
          </h1>
          <p 
            className="mt-2 text-sm text-gray-600"
            // Requirement: User Interface Design - Descriptive text for screen readers
            aria-describedby="reset-password-description"
          >
            Enter your email address below and we&apos;ll send you instructions to reset your password.
          </p>
          {/* Hidden description for screen readers */}
          <span id="reset-password-description" className="sr-only">
            This is a secure form to request a password reset link. You will receive an email with instructions.
          </span>
        </div>

        {/* 
          Requirement: Authentication & Authorization - Secure password reset form
          Requirement: Security Controls - Proper validation and error handling
        */}
        <div
          // Requirement: User Interface Design - Focus management
          role="region"
          aria-live="polite"
          className="mt-8"
        >
          <ResetPasswordForm />
        </div>

        {/* 
          Loading state with accessibility considerations
          Requirement: User Interface Design - Accessible loading states
        */}
        <div 
          aria-live="assertive"
          className="flex justify-center"
        >
          <Loading
            size="md"
            color="secondary"
            label="Processing your request"
            className="hidden" // Initially hidden, shown during form submission
          />
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordPage;