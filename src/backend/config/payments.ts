/**
 * Payment processing configuration module for subscription management and Stripe integration
 * Human Tasks:
 * 1. Set up Stripe account and obtain API keys
 * 2. Configure webhook endpoints in Stripe dashboard
 * 3. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to environment variables
 * 4. Create products and price IDs in Stripe dashboard matching SUBSCRIPTION_PLANS
 */

// @ts-ignore stripe ^12.0.0
import Stripe from 'stripe';
import { APIError, ErrorCode } from '../types/api';
import { createErrorResponse } from '../lib/utils/errors';

/**
 * Requirement: Subscription System - Tiered access control
 * Defines available subscription tiers for access control
 */
export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}

/**
 * Requirement: Payment Integration - Payment processing states
 * Defines possible payment processing status states
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

/**
 * Requirement: Subscription System - Plan structure
 * Interface defining subscription plan structure with pricing and features
 */
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  stripePriceId: string | null;
  interval: string;
  features: {
    drillsPerHour: number;
    simulationAccess: boolean;
  };
}

/**
 * Requirement: Payment Integration - Configuration options
 * Interface for payment processing configuration options
 */
interface PaymentConfig {
  mode: string;
  currency: string;
  autoConfirm: boolean;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Requirement: Subscription System - Plan definitions
 * Available subscription plans with features and pricing
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    stripePriceId: null,
    interval: 'month',
    features: {
      drillsPerHour: 60,
      simulationAccess: false
    }
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    stripePriceId: 'price_basic_monthly',
    interval: 'month',
    features: {
      drillsPerHour: 300,
      simulationAccess: false
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99,
    stripePriceId: 'price_premium_monthly',
    interval: 'month',
    features: {
      drillsPerHour: 1000,
      simulationAccess: true
    }
  }
];

/**
 * Requirement: Payment Integration - Processing configuration
 * Payment processing configuration options
 */
export const PAYMENT_CONFIG: PaymentConfig = {
  mode: 'subscription',
  currency: 'usd',
  autoConfirm: true,
  successUrl: '/dashboard?payment=success',
  cancelUrl: '/dashboard?payment=cancelled'
};

/**
 * Requirement: Payment Integration - Stripe initialization
 * Initializes and configures Stripe client instance with environment variables
 * @returns Configured Stripe instance
 * @throws APIError if STRIPE_SECRET_KEY is not configured
 */
export function initializeStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Stripe secret key not configured',
      details: {
        config: 'STRIPE_SECRET_KEY missing'
      }
    } as APIError;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16', // Latest stable version as of implementation
    typescript: true,
    appInfo: {
      name: 'Case Interview Practice Platform',
      version: '1.0.0'
    }
  });

  // Configure webhook secret if available
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    stripe.webhooks.constructEvent.bind(null, process.env.STRIPE_WEBHOOK_SECRET);
  }

  return stripe;
}

/**
 * Requirement: Subscription System - Plan management
 * Retrieves subscription plan details by plan ID
 * @param planId - Identifier of the subscription plan to retrieve
 * @returns Plan details if found, undefined if not found
 */
export function getSubscriptionPlan(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}