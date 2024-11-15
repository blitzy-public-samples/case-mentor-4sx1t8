/**
 * Stripe webhook event handling for Case Interview Practice Platform
 * 
 * Human Tasks:
 * 1. Set STRIPE_WEBHOOK_SECRET in environment variables
 * 2. Configure webhook endpoint URL in Stripe dashboard
 * 3. Ensure proper error monitoring is set up for webhook failures
 */

// @ts-ignore stripe ^12.0.0
import Stripe from 'stripe';
import { handleSubscriptionChange } from './subscriptions';
import { logger } from '../utils/logger';

/**
 * Interface for Stripe webhook event data
 * Requirement: Payment Integration - Webhook event handling
 */
interface WebhookEvent {
  id: string;
  type: string;
  data: object;
  created: number;
  livemode: boolean;
}

/**
 * Verifies the authenticity of incoming Stripe webhook events
 * Requirement: Payment Integration - Secure webhook processing
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      return false;
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });

    try {
      stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return true;
    } catch (err) {
      logger.error({
        error: err,
        signature: signature.substring(0, 10) + '...',
      }, 'Invalid webhook signature');
      return false;
    }
  } catch (error) {
    logger.error({ error }, 'Error verifying webhook signature');
    return false;
  }
}

/**
 * Processes subscription.updated webhook events
 * Requirement: Subscription System - Subscription lifecycle management
 */
async function handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  
  logger.info({
    subscriptionId: subscription.id,
    status: subscription.status,
    eventId: event.id
  }, 'Processing subscription update webhook');

  await handleSubscriptionChange(event);
}

/**
 * Processes payment_intent.payment_failed webhook events
 * Requirement: Payment Integration - Payment failure handling
 */
async function handlePaymentFailed(event: Stripe.Event): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  logger.info({
    paymentIntentId: paymentIntent.id,
    eventId: event.id
  }, 'Processing payment failure webhook');

  // Update subscription status for failed payment
  await handleSubscriptionChange(event);
}

/**
 * Decorator for error handling in webhook processing
 */
function tryCatch(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      logger.error({ error }, `Error in ${propertyKey}`);
      throw error;
    }
  };

  return descriptor;
}

/**
 * Main webhook processing function
 * Requirement: Payment Integration - Webhook event routing
 */
@tryCatch
export async function processWebhook(
  payload: string,
  signature: string
): Promise<void> {
  // Verify webhook signature
  const isValid = await verifyWebhookSignature(payload, signature);
  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }

  // Parse event data
  const event = JSON.parse(payload) as WebhookEvent;

  logger.info({
    eventId: event.id,
    eventType: event.type,
    livemode: event.livemode
  }, 'Processing webhook event');

  // Route event to appropriate handler
  switch (event.type) {
    case 'subscription.updated':
      await handleSubscriptionUpdated(event as Stripe.Event);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event as Stripe.Event);
      break;
    default:
      logger.info({ eventType: event.type }, 'Unhandled webhook event type');
  }

  logger.info({
    eventId: event.id,
    eventType: event.type
  }, 'Successfully processed webhook event');
}