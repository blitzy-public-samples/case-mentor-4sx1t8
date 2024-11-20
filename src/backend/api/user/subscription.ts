/**
 * API endpoint handler for user subscription management
 * Human Tasks:
 * 1. Configure Stripe webhook endpoint in Stripe dashboard
 * 2. Set up environment variables for Stripe API keys
 * 3. Configure subscription plan price IDs in environment
 * 4. Set up monitoring for subscription-related errors
 */

import { NextResponse, NextRequest } from 'next/server'; // v13.0.0
import { withAuth } from '../../lib/auth/middleware';
import { 
  createCheckoutSession,
  cancelSubscription,
  getSubscription as getStripeSubscription
} from '../../lib/payments/stripe';
import { 
  Subscription,
  createSubscription,
  updateSubscription,
  getSubscription as getDatabaseSubscription
} from '../../lib/database/models/subscription';

/**
 * GET /api/user/subscription
 * Retrieves current user's subscription details
 * Requirement: Subscription System - Implement tiered access control
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    // Extract user ID from authenticated request
    const userId = req.auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in request' },
        { status: 401 }
      );
    }

    // Get subscription from database
    const dbSubscription = await getDatabaseSubscription(userId);
    if (!dbSubscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Get latest subscription details from Stripe
    const stripeSubscription = await getStripeSubscription(
      dbSubscription.stripe_subscription_id
    );

    // Combine database and Stripe data
    const subscriptionDetails = {
      ...dbSubscription,
      stripeStatus: stripeSubscription.status,
      currentPeriodEnd: stripeSubscription.current_period_end,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
    };

    return NextResponse.json(subscriptionDetails, { status: 200 });

  } catch (error) {
    console.error('Subscription retrieval failed:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve subscription details' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/user/subscription
 * Creates a new subscription checkout session
 * Requirement: Subscription System - Implement payment processing
 */
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in request' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession(userId, priceId);

    // Create initial subscription record
    const subscription: Partial<Subscription> = {
      user_id: userId,
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
      status: 'incomplete',
      tier: 'basic', // Default to basic tier
      current_period_start: new Date(),
      current_period_end: new Date(),
      cancel_at_period_end: false
    };

    await createSubscription(subscription);

    return NextResponse.json(
      { checkoutUrl: session.url },
      { status: 200 }
    );

  } catch (error) {
    console.error('Subscription creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/user/subscription
 * Cancels an active subscription
 * Requirement: Subscription System - Implement subscription management
 */
export const DELETE = withAuth(async (req: NextRequest) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in request' },
        { status: 401 }
      );
    }

    // Get current subscription
    const subscription = await getDatabaseSubscription(userId);
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel subscription in Stripe
    const canceledStripeSubscription = await cancelSubscription(
      subscription.stripe_subscription_id
    );

    // Update subscription status in database
    await updateSubscription(subscription.id, {
      status: 'canceled',
      cancel_at_period_end: true,
      updated_at: new Date()
    });

    return NextResponse.json(
      { 
        message: 'Subscription canceled successfully',
        effectiveDate: canceledStripeSubscription.cancel_at
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Subscription cancellation failed:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
});