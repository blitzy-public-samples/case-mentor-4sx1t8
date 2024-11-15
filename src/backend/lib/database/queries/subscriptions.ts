// @ts-check
import { PostgrestError } from '@supabase/postgrest-js'; // ^1.0.0
import { Subscription, SubscriptionStatus, SubscriptionTier } from '../models/subscription';
import { supabase } from '../../../config/database';
import { createErrorResponse } from '../../../lib/utils/errors';

/**
 * Human Tasks:
 * 1. Ensure proper database indexes are created on subscriptions table:
 *    - user_id (for quick user subscription lookups)
 *    - tier, status (for tier-based queries)
 *    - current_period_end (for subscription expiration checks)
 * 2. Set up monitoring for query performance metrics
 */

/**
 * Requirement: Subscription System - Retrieves user subscription with proper error handling
 * Requirement: System Performance - Optimized query with proper indexing
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('current_period_end', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw error;
    }

    return data ? {
      ...data,
      current_period_start: new Date(data.current_period_start),
      current_period_end: new Date(data.current_period_end)
    } : null;

  } catch (error) {
    if (error instanceof PostgrestError) {
      throw createErrorResponse(
        new Error('Failed to retrieve user subscription'),
        error.message
      );
    }
    throw error;
  }
}

/**
 * Requirement: Subscription System - Creates new subscription records with Stripe integration
 */
export async function createUserSubscription(subscriptionData: {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}): Promise<Subscription> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: subscriptionData.userId,
        stripe_subscription_id: subscriptionData.stripeSubscriptionId,
        stripe_customer_id: subscriptionData.stripeCustomerId,
        tier: subscriptionData.tier,
        status: subscriptionData.status,
        current_period_start: subscriptionData.currentPeriodStart.toISOString(),
        current_period_end: subscriptionData.currentPeriodEnd.toISOString(),
        cancel_at_period_end: subscriptionData.cancelAtPeriodEnd
      }])
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      current_period_start: new Date(data.current_period_start),
      current_period_end: new Date(data.current_period_end)
    };

  } catch (error) {
    if (error instanceof PostgrestError) {
      throw createErrorResponse(
        new Error('Failed to create subscription'),
        error.message
      );
    }
    throw error;
  }
}

/**
 * Requirement: Subscription System - Updates subscription records with validation
 */
export async function updateUserSubscription(
  subscriptionId: string,
  updates: {
    status?: SubscriptionStatus;
    tier?: SubscriptionTier;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  }
): Promise<Subscription> {
  try {
    const updateData: Record<string, any> = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.tier) updateData.tier = updates.tier;
    if (updates.currentPeriodEnd) updateData.current_period_end = updates.currentPeriodEnd.toISOString();
    if (typeof updates.cancelAtPeriodEnd === 'boolean') {
      updateData.cancel_at_period_end = updates.cancelAtPeriodEnd;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      current_period_start: new Date(data.current_period_start),
      current_period_end: new Date(data.current_period_end)
    };

  } catch (error) {
    if (error instanceof PostgrestError) {
      throw createErrorResponse(
        new Error('Failed to update subscription'),
        error.message
      );
    }
    throw error;
  }
}

/**
 * Requirement: Subscription System - Handles subscription cancellations
 */
export async function cancelUserSubscription(subscriptionId: string): Promise<Subscription> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      current_period_start: new Date(data.current_period_start),
      current_period_end: new Date(data.current_period_end)
    };

  } catch (error) {
    if (error instanceof PostgrestError) {
      throw createErrorResponse(
        new Error('Failed to cancel subscription'),
        error.message
      );
    }
    throw error;
  }
}

/**
 * Requirement: Subscription System - Retrieves subscriptions by tier with pagination
 * Requirement: System Performance - Optimized query with proper indexing
 */
export async function getSubscriptionsByTier(tier: SubscriptionTier): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tier', tier)
      .eq('status', 'active')
      .order('current_period_end', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(subscription => ({
      ...subscription,
      current_period_start: new Date(subscription.current_period_start),
      current_period_end: new Date(subscription.current_period_end)
    }));

  } catch (error) {
    if (error instanceof PostgrestError) {
      throw createErrorResponse(
        new Error('Failed to retrieve subscriptions by tier'),
        error.message
      );
    }
    throw error;
  }
}