/**
 * Human Tasks:
 * 1. Configure Stripe webhook endpoint in dashboard to point to this URL
 * 2. Add STRIPE_WEBHOOK_SECRET to environment variables
 * 3. Set up monitoring for webhook events in Stripe dashboard
 * 4. Configure retry settings for failed webhook deliveries
 */

// @ts-ignore stripe ^12.0.0
import Stripe from 'stripe';
import { NextResponse } from 'next/server'; // ^13.0.0
import { handleWebhook } from '../../lib/payments/stripe';
import { updateUserSubscription } from '../../lib/database/queries/subscriptions';
import { logger } from '../../lib/utils/logger';

/**
 * Handles incoming Stripe webhook events for subscription management
 * Requirement: Payment Integration - Integrate Stripe for payment processing using SDK and webhooks
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Extract Stripe signature from request headers
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      logger.error({ error: 'Missing stripe-signature header' });
      return new NextResponse('Missing stripe signature', { status: 400 });
    }

    // Get raw request body as text for signature verification
    const body = await request.text();
    if (!body) {
      logger.error({ error: 'Empty request body' });
      return new NextResponse('Empty request body', { status: 400 });
    }

    // Process webhook with signature verification
    await handleWebhook(body, signature);

    logger.info({
      message: 'Webhook processed successfully',
      signature: signature.substring(0, 8) + '...' // Log partial signature for tracing
    });

    return new NextResponse('Webhook processed', { status: 200 });

  } catch (error) {
    // Handle specific error types
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      logger.error({
        error: 'Invalid webhook signature',
        message: error.message
      });
      return new NextResponse('Invalid signature', { status: 400 });
    }

    // Log unexpected errors
    logger.error({
      error: 'Webhook processing error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * Processes subscription update events from Stripe and updates database records
 * Requirement: Subscription System - Implement tiered access control
 */
async function handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  
  try {
    // Map Stripe subscription status to internal status
    const status = subscription.status === 'active' ? 'active' :
                  subscription.status === 'canceled' ? 'cancelled' :
                  subscription.status === 'past_due' ? 'past_due' :
                  'inactive';

    // Map Stripe price to subscription tier
    const tier = subscription.items.data[0].price.lookup_key as 'basic' | 'premium';
    
    // Update subscription in database
    await updateUserSubscription(subscription.id, {
      status,
      tier,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });

    logger.info({
      message: 'Subscription updated successfully',
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status,
      tier
    });

  } catch (error) {
    logger.error({
      error: 'Failed to update subscription',
      message: error instanceof Error ? error.message : 'Unknown error',
      subscriptionId: subscription.id,
      customerId: subscription.customer
    });
    throw error;
  }
}