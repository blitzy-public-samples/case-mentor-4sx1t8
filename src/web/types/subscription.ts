// @ts-check

// Import required types from internal dependencies
import { APIResponse } from './api';
import { UserSubscriptionTier } from './user';

// Import Stripe types - version ^2.0.0
import type { Stripe } from '@stripe/stripe-js';

// Requirement: Subscription System - Interface for subscription plan details including Stripe integration
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string; // 'month' | 'year'
  features: string[];
  tier: UserSubscriptionTier;
  stripeProductId: string;
  stripePriceId: string;
}

// Requirement: Subscription System - Payment processing integration and account management
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID'
}

// Requirement: Rate Limiting - Tier-based rate limiting for API requests based on subscription level
export interface SubscriptionFeatures {
  drillsPerDay: number;
  simulationAccess: boolean;
  aiEvaluation: boolean;
  progressAnalytics: boolean;
}

// Requirement: Subscription System - Interface for frontend subscription state management with Stripe integration
export interface SubscriptionState {
  currentPlan: SubscriptionPlan;
  status: SubscriptionStatus;
  features: SubscriptionFeatures;
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  autoRenew: boolean;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
}

// Requirement: Subscription System - Type alias for subscription-related API responses using APIResponse wrapper
export type SubscriptionResponse = APIResponse<SubscriptionState>;