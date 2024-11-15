/**
 * Core subscription management module for Case Interview Practice Platform
 * Human Tasks:
 * 1. Configure Stripe webhook endpoint in Stripe dashboard
 * 2. Set up Stripe product and price IDs in environment variables
 * 3. Configure subscription tier rate limits in environment variables
 */

// @ts-ignore stripe ^12.0.0
import Stripe from 'stripe';
import { APIError, ErrorCode } from '../../types/api';
import { SUBSCRIPTION_PLANS } from '../../config/payments';
import { createCheckoutSession } from './stripe';
import { Subscription } from '../database/models/subscription';

/**
 * Interface defining available features per subscription tier
 * Requirement: Subscription System - Tiered access control
 */
export interface SubscriptionFeatures {
  drillsPerHour: number;
  simulationAccess: boolean;
  advancedAnalytics: boolean;
}

/**
 * Interface for subscription upgrade parameters
 * Requirement: Subscription System - Plan management
 */
export interface SubscriptionUpgradeOptions {
  userId: string;
  targetTier: string;
  paymentMethodId: string;
}

/**
 * Initiates a new subscription or upgrades existing subscription
 * Requirement: Subscription System - Payment processing
 */
export async function initiateSubscription(
  userId: string,
  planId: string
): Promise<{ sessionId: string }> {
  try {
    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      throw {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid user ID provided'
      } as APIError;
    }

    // Validate plan ID against available plans
    const selectedPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
    if (!selectedPlan) {
      throw {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid subscription plan ID'
      } as APIError;
    }

    // Ensure plan has a Stripe price ID
    if (!selectedPlan.stripePriceId) {
      throw {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Selected plan is not available for purchase'
      } as APIError;
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession(userId, selectedPlan.stripePriceId);

    return { sessionId: session.id };
  } catch (error) {
    throw {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Failed to initiate subscription',
      details: error
    } as APIError;
  }
}

/**
 * Retrieves feature access for current subscription tier
 * Requirement: Subscription System - Feature access control
 */
export async function getSubscriptionFeatures(userId: string): Promise<SubscriptionFeatures> {
  try {
    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      throw {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid user ID provided'
      } as APIError;
    }

    // Get user's subscription from database
    const subscription = await Subscription.getSubscription(userId);
    
    // If no subscription found, return free tier features
    if (!subscription) {
      return {
        drillsPerHour: 60, // Free tier limit
        simulationAccess: false,
        advancedAnalytics: false
      };
    }

    // Map subscription tier to features
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.tier);
    if (!plan) {
      throw {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Invalid subscription tier configuration'
      } as APIError;
    }

    return {
      drillsPerHour: plan.features.drillsPerHour,
      simulationAccess: plan.features.simulationAccess,
      advancedAnalytics: subscription.tier === 'premium'
    };
  } catch (error) {
    throw {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Failed to retrieve subscription features',
      details: error
    } as APIError;
  }
}

/**
 * Checks if user has access to specific feature
 * Requirement: System Performance - Optimized feature checks
 */
export async function checkFeatureAccess(
  userId: string,
  featureName: string
): Promise<boolean> {
  try {
    // Validate inputs
    if (!userId || !featureName) {
      throw {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid parameters provided'
      } as APIError;
    }

    // Get user's subscription features
    const features = await getSubscriptionFeatures(userId);

    // Check feature availability
    switch (featureName) {
      case 'simulation':
        return features.simulationAccess;
      case 'advancedAnalytics':
        return features.advancedAnalytics;
      case 'drills':
        return features.drillsPerHour > 0;
      default:
        throw {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid feature name'
        } as APIError;
    }
  } catch (error) {
    throw {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Failed to check feature access',
      details: error
    } as APIError;
  }
}

/**
 * Handles subscription status changes from Stripe webhooks
 * Requirement: Subscription System - Subscription lifecycle
 */
export async function handleSubscriptionChange(event: Stripe.Event): Promise<void> {
  try {
    // Validate webhook event
    if (!event || !event.data.object) {
      throw {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid webhook event'
      } as APIError;
    }

    const subscription = event.data.object as Stripe.Subscription;
    
    // Update subscription status in database
    await Subscription.updateSubscription(subscription.id, {
      status: subscription.status as any,
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end
    });

    // Handle specific subscription states
    switch (subscription.status) {
      case 'active':
        // Update feature access
        await updateFeatureAccess(subscription);
        break;
      case 'past_due':
        // Send payment reminder
        await sendPaymentReminder(subscription);
        break;
      case 'canceled':
        // Revert to free tier
        await revertToFreeTier(subscription);
        break;
    }
  } catch (error) {
    throw {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Failed to handle subscription change',
      details: error
    } as APIError;
  }
}

// Helper functions
async function updateFeatureAccess(subscription: Stripe.Subscription): Promise<void> {
  // Implementation would update user's feature access based on subscription
  console.log('Updating feature access for subscription:', subscription.id);
}

async function sendPaymentReminder(subscription: Stripe.Subscription): Promise<void> {
  // Implementation would send payment reminder email
  console.log('Sending payment reminder for subscription:', subscription.id);
}

async function revertToFreeTier(subscription: Stripe.Subscription): Promise<void> {
  // Implementation would revert user to free tier features
  console.log('Reverting to free tier for subscription:', subscription.id);
}