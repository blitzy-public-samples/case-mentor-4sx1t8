// react version: ^18.0.0
// date-fns version: ^2.30.0

/**
 * Human Tasks:
 * 1. Configure Stripe webhook endpoints for subscription events
 * 2. Set up monitoring for subscription state changes
 * 3. Verify payment processing error handling
 * 4. Test subscription cancellation flow
 */

import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '../common/button';
import { Card } from '../common/card';
import { useSubscription } from '../../hooks/use-subscription';
import type { SubscriptionTier } from '../../types/user';

interface SubscriptionPlanProps {
  className?: string;
}

interface PlanFeature {
  title: string;
  description: string;
  included: boolean;
}

// @requirement Subscription System - Tiered access control
const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      {
        title: 'Basic Drills',
        description: 'Access to fundamental practice drills',
        included: true
      },
      {
        title: 'Limited Attempts',
        description: '2 attempts per drill type',
        included: true
      }
    ]
  },
  BASIC: {
    name: 'Basic',
    price: 29,
    features: [
      {
        title: 'All Drill Types',
        description: 'Access to all practice drill categories',
        included: true
      },
      {
        title: 'Unlimited Attempts',
        description: 'Practice without restrictions',
        included: true
      }
    ]
  },
  PREMIUM: {
    name: 'Premium',
    price: 49,
    features: [
      {
        title: 'All Features',
        description: 'Access to all platform features',
        included: true
      },
      {
        title: 'McKinsey Simulation',
        description: 'Full ecosystem simulation access',
        included: true
      }
    ]
  }
} as const;

// @requirement Subscription System - Payment processing and account management
export const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({ className }) => {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const {
    subscription,
    isLoading,
    error,
    createCheckoutSession,
    cancelSubscription,
    updateAutoRenew
  } = useSubscription();

  const handleUpgrade = useCallback(async (targetTier: SubscriptionTier) => {
    try {
      const checkoutUrl = await createCheckoutSession(targetTier);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Failed to create checkout session:', err);
    }
  }, [createCheckoutSession]);

  const handleCancellation = useCallback(async () => {
    if (!isConfirmingCancel) {
      setIsConfirmingCancel(true);
      return;
    }

    try {
      await cancelSubscription();
      setIsConfirmingCancel(false);
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    }
  }, [isConfirmingCancel, cancelSubscription]);

  const handleAutoRenewToggle = useCallback(async () => {
    if (!subscription) return;
    
    try {
      await updateAutoRenew(!subscription.autoRenew);
    } catch (err) {
      console.error('Failed to update auto-renewal:', err);
    }
  }, [subscription, updateAutoRenew]);

  if (isLoading) {
    return (
      <Card className={className} aria-busy="true">
        <div className="p-6 flex justify-center items-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <div className="p-6 text-error" role="alert">
          <h2 className="text-lg font-semibold mb-2">Error Loading Subscription</h2>
          <p>{error.message}</p>
        </div>
      </Card>
    );
  }

  const currentTier = subscription?.tier || 'FREE';
  const currentPlan = SUBSCRIPTION_TIERS[currentTier];

  return (
    <Card className={className}>
      {/* @requirement User Management - Profile customization and subscription status tracking */}
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4" id="subscription-heading">
          Your Subscription
        </h2>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-medium">{currentPlan.name} Plan</h3>
              <p className="text-gray-600">
                {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/month`}
              </p>
            </div>
            {subscription?.expiresAt && (
              <p className="text-sm text-gray-600">
                Expires: {format(new Date(subscription.expiresAt), 'MMM d, yyyy')}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Plan Features:</h4>
            <ul className="space-y-2" aria-label="Current plan features">
              {currentPlan.features.map((feature) => (
                <li
                  key={feature.title}
                  className="flex items-start gap-2"
                  aria-label={`${feature.title}: ${feature.description}`}
                >
                  <span className="text-primary mt-1">✓</span>
                  <div>
                    <p className="font-medium">{feature.title}</p>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {currentTier !== 'PREMIUM' && (
            <div>
              <h4 className="font-medium mb-2">Upgrade Options:</h4>
              <div className="space-y-2">
                {currentTier === 'FREE' && (
                  <Button
                    variant="primary"
                    onClick={() => handleUpgrade('BASIC')}
                    fullWidth
                    aria-label="Upgrade to Basic plan"
                  >
                    Upgrade to Basic ($29/month)
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={() => handleUpgrade('PREMIUM')}
                  fullWidth
                  aria-label="Upgrade to Premium plan"
                >
                  Upgrade to Premium ($49/month)
                </Button>
              </div>
            </div>
          )}

          {currentTier !== 'FREE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Auto-renew subscription</span>
                <Button
                  variant="ghost"
                  onClick={handleAutoRenewToggle}
                  aria-pressed={subscription?.autoRenew}
                  aria-label="Toggle auto-renewal"
                >
                  {subscription?.autoRenew ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div>
                <Button
                  variant="outline"
                  onClick={handleCancellation}
                  fullWidth
                  aria-label={isConfirmingCancel ? 'Confirm cancellation' : 'Cancel subscription'}
                >
                  {isConfirmingCancel
                    ? 'Click again to confirm cancellation'
                    : 'Cancel Subscription'}
                </Button>
                {isConfirmingCancel && (
                  <p className="text-sm text-gray-600 mt-2">
                    Your access will continue until the end of the billing period
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};