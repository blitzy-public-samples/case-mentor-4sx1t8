/**
 * Core Stripe integration module for payment processing and subscription management
 * Human Tasks:
 * 1. Set up Stripe account and obtain API keys
 * 2. Configure webhook endpoints in Stripe dashboard
 * 3. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to environment variables
 * 4. Create products and price IDs in Stripe dashboard matching SUBSCRIPTION_PLANS
 */

// @ts-ignore stripe ^12.0.0
import Stripe from 'stripe';
import { APIError, ErrorCode } from '../../types/api';
import { SUBSCRIPTION_PLANS, PAYMENT_CONFIG } from '../../config/payments';
import { createErrorResponse } from '../utils/errors';

// Initialize Stripe instance with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

/**
 * Creates a Stripe checkout session for subscription purchase
 * Requirement: Subscription System - Implement tiered access control
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string
): Promise<Stripe.Checkout.Session> {
  try {
    // Validate inputs
    if (!customerId || typeof customerId !== 'string') {
      throw new Error('Invalid customer ID');
    }

    // Validate price ID exists in subscription plans
    const validPlan = SUBSCRIPTION_PLANS.find(plan => plan.stripePriceId === priceId);
    if (!validPlan) {
      throw new Error('Invalid price ID');
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: PAYMENT_CONFIG.mode,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: PAYMENT_CONFIG.successUrl,
      cancel_url: PAYMENT_CONFIG.cancelUrl,
      currency: PAYMENT_CONFIG.currency,
    });

    return session;
  } catch (error) {
    throw createErrorResponse(error as Error, 'create_checkout_session');
  }
}

/**
 * Creates a new Stripe customer for a user
 * Requirement: Payment Integration - Integrate Stripe for payment processing
 */
export async function createCustomer(
  email: string,
  name: string
): Promise<Stripe.Customer> {
  try {
    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate name
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid name');
    }

    // Create customer in Stripe
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        platform: 'Case Interview Practice Platform',
      },
    });

    return customer;
  } catch (error) {
    throw createErrorResponse(error as Error, 'create_customer');
  }
}

/**
 * Cancels an active subscription
 * Requirement: Subscription System - Subscription management
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    // Validate subscription ID
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      throw new Error('Invalid subscription ID');
    }

    // Cancel subscription immediately
    const subscription = await stripe.subscriptions.cancel(subscriptionId, {
      prorate: true,
    });

    return subscription;
  } catch (error) {
    throw createErrorResponse(error as Error, 'cancel_subscription');
  }
}

/**
 * Processes Stripe webhook events for subscription updates
 * Requirement: Payment Integration - Using SDK and webhooks
 */
export async function handleWebhook(
  body: string,
  signature: string
): Promise<void> {
  try {
    // Verify webhook signature
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle specific event types
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        // Handle subscription status change
        await handleSubscriptionChange(subscription);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Handle successful payment
        await handleSuccessfulPayment(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        // Handle failed payment
        await handleFailedPayment(failedPayment);
        break;
    }
  } catch (error) {
    throw createErrorResponse(error as Error, 'webhook_handler');
  }
}

/**
 * Retrieves subscription details from Stripe
 * Requirement: Subscription System - Subscription management
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    // Validate subscription ID
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      throw new Error('Invalid subscription ID');
    }

    // Retrieve subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'customer'],
    });

    return subscription;
  } catch (error) {
    throw createErrorResponse(error as Error, 'get_subscription');
  }
}

// Helper functions for webhook event handling
async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  // Implementation would update user's subscription status in database
  // This is a placeholder for the actual implementation
  console.log('Subscription status changed:', subscription.status);
}

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  // Implementation would update payment status in database
  // This is a placeholder for the actual implementation
  console.log('Payment succeeded:', paymentIntent.id);
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  // Implementation would handle failed payment notification
  // This is a placeholder for the actual implementation
  console.log('Payment failed:', paymentIntent.id);
}