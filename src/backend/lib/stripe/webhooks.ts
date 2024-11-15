// Human Tasks:
// 1. Set up Stripe webhook endpoint URL in production environment
// 2. Configure Stripe webhook signing secret in environment variables
// 3. Set up monitoring for failed webhook events
// 4. Configure retry policy for failed webhook processing

import { Stripe } from 'stripe'; // ^12.0.0
import { Request, Response } from 'express';
import { SubscriptionService } from '../../services/SubscriptionService';
import { APIError } from '../errors/APIError';
import { Subscription } from '../../types/subscription';

/**
 * Validates the Stripe webhook signature to ensure request authenticity
 * @requirement Payment Processing - Secure webhook handling
 */
export const validateWebhookSignature = async (
  payload: string,
  signature: string
): Promise<boolean> => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new APIError(
        'CONFIGURATION_ERROR',
        'Stripe webhook secret not configured',
        {},
        'STRIPE_WEBHOOK_CONFIG'
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    await stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return true;
  } catch (error) {
    console.error('Webhook signature validation failed:', error);
    return false;
  }
};

/**
 * Handles subscription.created webhook event
 * @requirement Subscription System - Subscription lifecycle management
 */
const handleSubscriptionCreated = async (event: Stripe.Event): Promise<void> => {
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionService = new SubscriptionService();

  try {
    await subscriptionService.handleWebhook(event);
    console.log(`Subscription created successfully: ${subscription.id}`);
  } catch (error) {
    throw new APIError(
      'SUBSCRIPTION_ERROR',
      'Failed to handle subscription creation',
      { subscriptionId: subscription.id },
      'SUBSCRIPTION_CREATE'
    );
  }
};

/**
 * Handles subscription.updated webhook event
 * @requirement Subscription System - Subscription status updates
 */
const handleSubscriptionUpdated = async (event: Stripe.Event): Promise<void> => {
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionService = new SubscriptionService();

  try {
    await subscriptionService.handleWebhook(event);
    console.log(`Subscription updated successfully: ${subscription.id}`);
  } catch (error) {
    throw new APIError(
      'SUBSCRIPTION_ERROR',
      'Failed to handle subscription update',
      { subscriptionId: subscription.id },
      'SUBSCRIPTION_UPDATE'
    );
  }
};

/**
 * Handles subscription.deleted webhook event
 * @requirement Subscription System - Subscription cancellation
 */
const handleSubscriptionDeleted = async (event: Stripe.Event): Promise<void> => {
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionService = new SubscriptionService();

  try {
    await subscriptionService.handleWebhook(event);
    console.log(`Subscription deleted successfully: ${subscription.id}`);
  } catch (error) {
    throw new APIError(
      'SUBSCRIPTION_ERROR',
      'Failed to handle subscription deletion',
      { subscriptionId: subscription.id },
      'SUBSCRIPTION_DELETE'
    );
  }
};

/**
 * Handles payment_intent.payment_failed webhook event
 * @requirement Payment Processing - Failed payment handling
 */
const handlePaymentFailed = async (event: Stripe.Event): Promise<void> => {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const subscriptionService = new SubscriptionService();

  try {
    await subscriptionService.handleWebhook(event);
    console.log(`Payment failed handled for: ${paymentIntent.id}`);
  } catch (error) {
    throw new APIError(
      'PAYMENT_ERROR',
      'Failed to handle payment failure',
      { paymentIntentId: paymentIntent.id },
      'PAYMENT_FAILURE'
    );
  }
};

/**
 * Main webhook handler for processing Stripe events
 * @requirement Payment Processing - Webhook event processing
 * @requirement Subscription System - Subscription management
 */
export const handleWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const signature = req.headers['stripe-signature'];
  const payload = req.body;

  try {
    // Validate webhook signature
    if (!signature || typeof signature !== 'string') {
      throw new APIError(
        'VALIDATION_ERROR',
        'Missing Stripe signature',
        {},
        'WEBHOOK_SIGNATURE'
      );
    }

    const isValid = await validateWebhookSignature(
      payload,
      signature
    );

    if (!isValid) {
      throw new APIError(
        'VALIDATION_ERROR',
        'Invalid webhook signature',
        {},
        'WEBHOOK_SIGNATURE'
      );
    }

    // Parse the event
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
    
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    if (error instanceof APIError) {
      return res.status(400).json(error.toJSON());
    }
    
    const apiError = new APIError(
      'INTERNAL_ERROR',
      'Webhook processing failed',
      { error: error.message },
      'WEBHOOK_PROCESSING'
    );
    
    return res.status(500).json(apiError.toJSON());
  }
};