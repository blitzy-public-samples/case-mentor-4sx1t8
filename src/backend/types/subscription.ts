// @ts-check
import { Stripe } from 'stripe'; // ^12.0.0
import { UserSubscriptionTier, UserSubscriptionStatus } from './user';

// Human Tasks:
// 1. Configure Stripe product IDs in environment variables
// 2. Verify rate limiting thresholds match infrastructure capacity
// 3. Ensure subscription plan limits align with business requirements
// 4. Set up Stripe webhook endpoints for subscription status updates

/**
 * @fileoverview Type definitions for subscription management system
 * Requirements addressed:
 * - Subscription System (3. SCOPE/Core Features/Subscription System)
 * - Rate Limiting (7. SYSTEM DESIGN/7.3 API Design/7.3.4 Rate Limiting)
 */

/**
 * Interface defining subscription features and their access control
 * Requirement: Tiered access control with feature-based permissions
 */
export interface SubscriptionFeature {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
}

/**
 * Interface defining usage limits and rate limiting thresholds
 * Requirements: 
 * - Rate limiting based on subscription tier
 * - Usage tracking and quota management
 */
export interface SubscriptionLimits {
    drillAttemptsPerDay: number;
    simulationAttemptsPerDay: number;
    apiRequestsPerHour: number;
}

/**
 * Interface defining subscription plan structure with pricing and features
 * Requirements:
 * - Tiered subscription plans
 * - Feature access control
 * - Integration with Stripe payment processing
 */
export interface SubscriptionPlan {
    id: string;
    name: string;
    tier: UserSubscriptionTier;
    priceMonthly: number;
    priceYearly: number;
    features: SubscriptionFeature[];
    limits: SubscriptionLimits;
    stripeProductId: string;
}

/**
 * Core subscription interface for managing user subscriptions
 * Requirements:
 * - Subscription management
 * - Payment processing integration
 * - Account status tracking
 */
export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    status: UserSubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
}

/**
 * Interface for tracking subscription usage metrics
 * Requirements:
 * - Usage tracking
 * - Rate limiting compliance
 * - Quota management
 */
export interface SubscriptionUsage {
    subscriptionId: string;
    drillAttempts: number;
    simulationAttempts: number;
    apiRequests: number;
    period: Date;
}