// @package react ^18.0.0
// @package next ^13.0.0

// Human Tasks:
// 1. Configure subscription tier limits in environment variables
// 2. Set up error tracking for subscription validation failures
// 3. Verify accessibility compliance for subscription upgrade prompts
// 4. Test loading state animations across different devices

import React from 'react';
import { redirect } from 'next/navigation';
import { DrillList, type DrillListProps } from '../../components/drills/drill-list';
import { useAuth } from '../../hooks/use-auth';
import { useSubscription } from '../../hooks/use-subscription';

// Constants for subscription messaging and limits
const SUBSCRIPTION_REQUIRED_MESSAGE = 'Upgrade your subscription to access all drill types and features';
const FREE_TIER_LIMIT = 2;

/**
 * DrillsPage - Main drills listing page with authentication and subscription checks
 * 
 * @requirement Practice Drills - Displays and manages access to Case Prompt, Calculations,
 * Case Math, Brainstorming, Market Sizing, and Synthesizing Drills
 * @requirement Subscription System - Enforces tiered access control for drill content
 * @requirement Authentication Flow - Enforces authenticated access to protected drill content
 */
export default async function DrillsPage(): Promise<JSX.Element> {
  // Get authentication state
  const { authState } = useAuth();

  // Redirect to login if user is not authenticated
  if (!authState.user || !authState.session) {
    redirect('/login');
  }

  // Get subscription status
  const { subscription, isLoading: subscriptionLoading } = useSubscription();

  // Show loading state while checking subscription
  if (subscriptionLoading) {
    return (
      <div 
        className="flex justify-center items-center min-h-[400px]"
        role="status"
        aria-label="Loading subscription status"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Determine subscription tier and access level
  const hasPaidSubscription = subscription?.tier !== 'free';

  return (
    <main 
      className="container mx-auto px-4 py-8"
      aria-busy={subscriptionLoading}
    >
      {/* Subscription upgrade prompt for free tier users */}
      {!hasPaidSubscription && (
        <div 
          className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          role="alert"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-800">
                Limited Access
              </h2>
              <p className="text-blue-700 mt-1">
                {SUBSCRIPTION_REQUIRED_MESSAGE}
              </p>
            </div>
            <a
              href="/subscription/upgrade"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Upgrade subscription for full access"
            >
              Upgrade Now
            </a>
          </div>
        </div>
      )}

      {/* Main drill list component */}
      <DrillList 
        className="mt-6"
        // Pass subscription tier for content filtering
        subscriptionTier={subscription?.tier || 'free'}
        // Pass drill limit for free tier users
        drillLimit={hasPaidSubscription ? undefined : FREE_TIER_LIMIT}
      />
    </main>
  );
}

// Force dynamic rendering for real-time subscription status
export const dynamic = 'force-dynamic';