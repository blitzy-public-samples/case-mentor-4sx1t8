// Human Tasks:
// 1. Set up Stripe account and obtain API keys
// 2. Configure webhook endpoints in Stripe dashboard
// 3. Create products in Stripe dashboard matching SUBSCRIPTION_PRODUCTS
// 4. Set up environment variables for STRIPE_SECRET_KEY, STRIPE_PUBLIC_KEY, and STRIPE_WEBHOOK_SECRET
// 5. Verify webhook endpoint URL in production environment

import Stripe from 'stripe'; // ^12.0.0
import { SubscriptionPlan } from '../types/subscription';
import { RATE_LIMITS } from './constants';

/**
 * @fileoverview Stripe payment processing and subscription configuration
 * Requirements addressed:
 * - Subscription System (3. SCOPE/Core Features/Subscription System)
 * - Payment Processing (5. SYSTEM ARCHITECTURE/5.2 Component Details)
 */

// Stripe API version must match the one specified in Stripe dashboard
export const STRIPE_API_VERSION = '2023-10-16';
export const STRIPE_WEBHOOK_TOLERANCE = 300; // 5 minutes in seconds

// Core Stripe configuration
export const stripeConfig = {
  publicKey: process.env.STRIPE_PUBLIC_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  apiVersion: STRIPE_API_VERSION,
};

/**
 * Creates and configures a Stripe client instance
 * @requirement Payment Processing - Stripe integration
 */
export const createStripeClient = (
  secretKey: string,
  apiVersion: string
): Stripe => {
  if (!secretKey) {
    throw new Error('Stripe secret key is required');
  }

  return new Stripe(secretKey, {
    apiVersion,
    typescript: true,
    timeout: 10000, // 10 second timeout
    maxNetworkRetries: 3,
  });
};

// Initialize Stripe client
export const stripeClient = createStripeClient(
  stripeConfig.secretKey,
  stripeConfig.apiVersion
);

/**
 * Validates Stripe webhook signatures
 * @requirement Payment Processing - Secure webhook handling
 */
export const validateWebhookSignature = (
  payload: string,
  signature: string,
  webhookSecret: string
): boolean => {
  try {
    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Subscription product definitions
 * @requirement Subscription System - Tiered access control
 */
export const SUBSCRIPTION_PRODUCTS: Record<string, SubscriptionPlan> = {
  FREE: {
    id: 'free-tier',
    name: 'Free',
    tier: 'free',
    stripeProductId: process.env.STRIPE_PRODUCT_FREE || '',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      {
        id: 'basic-drills',
        name: 'Basic Case Drills',
        description: 'Access to basic case interview practice drills',
        enabled: true,
      },
      {
        id: 'community',
        name: 'Community Access',
        description: 'Access to community forums',
        enabled: true,
      },
    ],
    limits: {
      drillAttemptsPerDay: RATE_LIMITS.free['drills/attempt'],
      simulationAttemptsPerDay: RATE_LIMITS.free['simulation/start'],
      apiRequestsPerHour: RATE_LIMITS.free['api/requests'],
    },
  },
  BASIC: {
    id: 'basic-tier',
    name: 'Basic',
    tier: 'basic',
    stripeProductId: process.env.STRIPE_PRODUCT_BASIC || '',
    priceMonthly: 19.99,
    priceYearly: 199.99,
    features: [
      {
        id: 'advanced-drills',
        name: 'Advanced Case Drills',
        description: 'Access to advanced case interview practice drills',
        enabled: true,
      },
      {
        id: 'performance-analytics',
        name: 'Performance Analytics',
        description: 'Detailed performance tracking and analytics',
        enabled: true,
      },
    ],
    limits: {
      drillAttemptsPerDay: RATE_LIMITS.basic['drills/attempt'],
      simulationAttemptsPerDay: RATE_LIMITS.basic['simulation/start'],
      apiRequestsPerHour: RATE_LIMITS.basic['api/requests'],
    },
  },
  PREMIUM: {
    id: 'premium-tier',
    name: 'Premium',
    tier: 'premium',
    stripeProductId: process.env.STRIPE_PRODUCT_PREMIUM || '',
    priceMonthly: 49.99,
    priceYearly: 499.99,
    features: [
      {
        id: 'ai-feedback',
        name: 'AI-Powered Feedback',
        description: 'Real-time AI feedback on case performance',
        enabled: true,
      },
      {
        id: 'mock-interviews',
        name: 'Mock Interviews',
        description: 'Access to AI-driven mock interviews',
        enabled: true,
      },
      {
        id: 'priority-support',
        name: 'Priority Support',
        description: '24/7 priority customer support',
        enabled: true,
      },
    ],
    limits: {
      drillAttemptsPerDay: RATE_LIMITS.premium['drills/attempt'],
      simulationAttemptsPerDay: RATE_LIMITS.premium['simulation/start'],
      apiRequestsPerHour: RATE_LIMITS.premium['api/requests'],
    },
  },
};

/**
 * Webhook event type constants
 * @requirement Payment Processing - Subscription lifecycle management
 */
export const WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  PAYMENT_FAILED: 'invoice.payment_failed',
} as const;