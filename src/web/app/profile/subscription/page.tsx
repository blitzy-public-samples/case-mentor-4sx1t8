/**
 * Human Tasks:
 * 1. Configure Stripe webhook endpoints in production environment
 * 2. Set up monitoring alerts for subscription state changes
 * 3. Verify error tracking integration for subscription-related errors
 */

// react version: ^18.0.0
'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { SubscriptionPlan } from '../../../components/profile/subscription-plan';
import { useAuth } from '../../../hooks/use-auth';
import { LoadingSpinner } from '../../../components/common/loading-spinner';

/**
 * @requirement Authentication - Protected route implementation with authentication checks
 * Subscription page component with authentication protection and accessibility support
 */
const SubscriptionPage = (): JSX.Element => {
  const { authState, loading } = useAuth();

  // Redirect to login if user is not authenticated
  if (!loading && !authState.user) {
    redirect('/login');
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div 
        className="flex justify-center items-center min-h-screen"
        role="status"
        aria-label="Loading subscription page"
      >
        <LoadingSpinner 
          size="lg"
          color="primary"
          className="mx-auto"
        />
      </div>
    );
  }

  /**
   * @requirement Subscription System - Tiered access control, payment processing
   * @requirement User Management - Profile customization and subscription status
   * Render subscription management interface for authenticated users
   */
  return (
    <main
      className="container mx-auto px-4 py-8 max-w-4xl"
      role="main"
      aria-labelledby="subscription-title"
    >
      <h1 
        id="subscription-title"
        className="text-3xl font-bold mb-8 text-gray-900"
      >
        Subscription Management
      </h1>
      
      <div className="space-y-6">
        <SubscriptionPlan 
          className="w-full"
        />
        
        {/* Accessibility note for screen readers */}
        <div 
          className="sr-only"
          role="status"
          aria-live="polite"
        >
          Subscription management interface loaded
        </div>
      </div>
    </main>
  );
};

export default SubscriptionPage;