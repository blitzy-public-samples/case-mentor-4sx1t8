/**
 * Database model and type definitions for subscription management
 * Human Tasks:
 * 1. Configure Stripe webhook endpoint in Stripe dashboard
 * 2. Set up Stripe product and price IDs in environment variables
 * 3. Configure PostgreSQL subscription table indexes
 */

// @ts-check
import { PostgrestError } from '@supabase/postgrest-js'; // ^1.0.0
import { supabase } from '../../../config/database';
import { APIError, ErrorCode } from '../../../types/api';
import { createErrorResponse } from '../../utils/errors';

/**
 * Requirement: Subscription System - Implements tiered access control
 * Type definition for subscription status aligned with Stripe
 */
export type SubscriptionStatus = 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid';

/**
 * Requirement: Subscription System - Implements tiered access control
 * Type definition for subscription tiers with associated features
 */
export type SubscriptionTier = 'free' | 'basic' | 'premium';

/**
 * Requirement: Data Storage - Implements Supabase PostgreSQL schema
 * Interface representing a user subscription record with Stripe integration
 */
export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Requirement: Subscription System - Implements subscription data retrieval
 * Retrieves a subscription record by user ID with error handling
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data ? {
      ...data,
      current_period_start: new Date(data.current_period_start),
      current_period_end: new Date(data.current_period_end),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    } : null;

  } catch (error) {
    if (error instanceof PostgrestError) {
      throw createErrorResponse(new Error('Failed to retrieve subscription'), error.message);
    }
    throw error;
  }
}

/**
 * Requirement: Subscription System - Implements subscription creation
 * Creates a new subscription record with Stripe integration
 */
export async function createSubscription(subscriptionData: Partial<Subscription>): Promise<Subscription> {
  try {
    // Validate required fields
    if (!subscriptionData.user_id || !subscriptionData.stripe_subscription_id || !subscriptionData.stripe_customer_id) {
      throw createErrorResponse(new Error('Missing required subscription fields'), ErrorCode.VALIDATION_ERROR);
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        ...subscriptionData,
        status: subscriptionData.status || 'incomplete',
        tier: subscriptionData.tier || 'free',
        cancel_at_period_end: subscriptionData.cancel_at_period_end || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      current_period_start: new Date(data.current_period_start),
      current_period_end: new Date(data.current_period_end),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };

  } catch (error) {
    if (error instanceof PostgrestError) {
      throw createErrorResponse(new Error('Failed to create subscription'), error.message);
    }
    throw error;
  }
}

/**
 * Requirement: Subscription System - Implements subscription updates
 * Updates an existing subscription record with validation
 */
export async function updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> {
  try {
    // Prevent updating critical fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.user_id;
    delete safeUpdates.created_at;

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        ...safeUpdates,
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
      current_period_end: new Date(data.current_period_end),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };

  } catch (error) {
    if (error instanceof PostgrestError) {
      throw createErrorResponse(new Error('Failed to update subscription'), error.message);
    }
    throw error;
  }
}

/**
 * Requirement: Subscription System - Implements subscription deletion
 * Soft deletes a subscription record
 */
export async function deleteSubscription(subscriptionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .rpc('soft_delete_subscription', {
        subscription_id: subscriptionId,
        deleted_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

  } catch (error) {
    if (error instanceof PostgrestError) {
      throw createErrorResponse(new Error('Failed to delete subscription'), error.message);
    }
    throw error;
  }
}