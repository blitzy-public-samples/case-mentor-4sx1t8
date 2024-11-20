// react version: ^18.0.0
// swr version: ^2.0.0

import { useState } from 'react';
import useSWR from 'swr';
import { APIResponse } from '../types/api';
import { UserSubscription, SubscriptionTier } from '../types/user';
import { apiClient } from '../lib/api-client';

/**
 * Human Tasks:
 * 1. Configure Stripe webhook endpoints for subscription event handling
 * 2. Set up monitoring for subscription state changes
 * 3. Configure proper error tracking for payment processing failures
 * 4. Set up automated subscription expiration notifications
 */

const SUBSCRIPTION_API_ENDPOINTS = {
  current: '/api/subscription/current',
  checkout: '/api/subscription/checkout',
  cancel: '/api/subscription/cancel',
  autoRenew: '/api/subscription/auto-renew',
} as const;

/**
 * @requirement Subscription System
 * React hook for managing user subscription state and operations
 */
export function useSubscription() {
  const [checkoutError, setCheckoutError] = useState<Error | null>(null);
  const [operationError, setOperationError] = useState<Error | null>(null);

  // Fetch current subscription data with SWR for caching and revalidation
  const {
    data: subscriptionResponse,
    error: fetchError,
    isLoading,
    mutate
  } = useSWR<APIResponse<UserSubscription>>(
    SUBSCRIPTION_API_ENDPOINTS.current,
    () => apiClient.get<UserSubscription>(SUBSCRIPTION_API_ENDPOINTS.current)
  );

  /**
   * @requirement Subscription System
   * Creates a Stripe checkout session for subscription upgrade
   */
  const createCheckoutSession = async (targetTier: SubscriptionTier): Promise<string> => {
    try {
      setCheckoutError(null);
      const response = await apiClient.post<{ checkoutUrl: string }>(
        SUBSCRIPTION_API_ENDPOINTS.checkout,
        { targetTier }
      );

      if (!response.success || !response.data.checkoutUrl) {
        throw new Error(response.error?.message || 'Failed to create checkout session');
      }

      return response.data.checkoutUrl;
    } catch (error) {
      setCheckoutError(error as Error);
      throw error;
    }
  };

  /**
   * @requirement Subscription System
   * Cancels user's current subscription
   */
  const cancelSubscription = async (): Promise<void> => {
    try {
      setOperationError(null);
      const response = await apiClient.post<void>(SUBSCRIPTION_API_ENDPOINTS.cancel);

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to cancel subscription');
      }

      // Revalidate subscription data after cancellation
      await mutate();
    } catch (error) {
      setOperationError(error as Error);
      throw error;
    }
  };

  /**
   * @requirement Subscription System
   * Updates auto-renewal setting for subscription
   */
  const updateAutoRenew = async (enabled: boolean): Promise<void> => {
    try {
      setOperationError(null);
      const response = await apiClient.post<void>(
        SUBSCRIPTION_API_ENDPOINTS.autoRenew,
        { enabled }
      );

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update auto-renewal setting');
      }

      // Revalidate subscription data after update
      await mutate();
    } catch (error) {
      setOperationError(error as Error);
      throw error;
    }
  };

  return {
    subscription: subscriptionResponse?.success ? subscriptionResponse.data : null,
    isLoading,
    error: fetchError || checkoutError || operationError,
    createCheckoutSession,
    cancelSubscription,
    updateAutoRenew,
  };
}