// react ^18.0.0
import { useState, useEffect, useCallback } from 'react';
// @stripe/stripe-js ^2.0.0
import { loadStripe } from '@stripe/stripe-js';

import { api } from '../lib/api';
import { getSession } from '../lib/auth';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionFeatures,
  SubscriptionState,
  SubscriptionResponse
} from '../types/subscription';

/**
 * Human Tasks:
 * 1. Set up Stripe webhook endpoint in production environment
 * 2. Configure Stripe product and price IDs in environment variables
 * 3. Set up proper error tracking for payment failures
 * 4. Configure subscription notification templates
 */

// Initialize Stripe with public key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/**
 * Custom hook for managing subscription state and operations
 * Requirement: Subscription System - Tiered access control, payment processing, account management
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches current subscription data from API
   * Requirement: Subscription System - Account management and status tracking
   */
  const fetchSubscription = useCallback(async () => {
    try {
      const session = await getSession();
      if (!session) {
        setSubscription(null);
        return;
      }

      const response = await api.get<SubscriptionState>('/api/subscription');
      if (response.success && response.data) {
        setSubscription(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch subscription');
      }
    } catch (err) {
      setError(err as Error);
      console.error('Subscription fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Updates subscription plan through Stripe checkout
   * Requirement: Subscription System - Payment processing integration
   */
  const updateSubscription = useCallback(async (newPlan: SubscriptionPlan): Promise<SubscriptionResponse> => {
    try {
      // Validate current session
      const session = await getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Create Stripe checkout session
      const response = await api.post<{ sessionId: string }>('/api/subscription/create-checkout', {
        planId: newPlan.id,
        priceId: newPlan.stripePriceId
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create checkout session');
      }

      // Initialize Stripe checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Redirect to checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.data.sessionId
      });

      if (error) {
        throw new Error(error.message);
      }

      // Fetch updated subscription after successful payment
      await fetchSubscription();

      return {
        success: true,
        data: subscription!,
        error: null
      };
    } catch (err) {
      console.error('Subscription update error:', err);
      return {
        success: false,
        data: null,
        error: {
          message: (err as Error).message,
          code: 'SUBSCRIPTION_UPDATE_ERROR'
        }
      };
    }
  }, [subscription, fetchSubscription]);

  /**
   * Cancels current subscription
   * Requirement: Subscription System - Account management
   */
  const cancelSubscription = useCallback(async (): Promise<SubscriptionResponse> => {
    try {
      // Validate current subscription
      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      // Send cancellation request
      const response = await api.post<SubscriptionState>('/api/subscription/cancel', {
        subscriptionId: subscription.stripeSubscriptionId
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to cancel subscription');
      }

      // Update local subscription state
      setSubscription({
        ...response.data,
        status: SubscriptionStatus.CANCELED
      });

      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (err) {
      console.error('Subscription cancellation error:', err);
      return {
        success: false,
        data: null,
        error: {
          message: (err as Error).message,
          code: 'SUBSCRIPTION_CANCEL_ERROR'
        }
      };
    }
  }, [subscription]);

  // Load subscription data on mount
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Return subscription state and management functions
  return {
    subscription,
    isLoading,
    error,
    updateSubscription,
    cancelSubscription
  };
}