// Human Tasks:
// 1. Configure Stripe webhook endpoint URL in production environment
// 2. Set up Stripe product IDs in environment variables
// 3. Verify subscription plan limits match business requirements
// 4. Configure rate limiting thresholds for each subscription tier

import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { withAuth } from '../../../lib/auth/middleware';
import { SubscriptionService } from '../../../services/SubscriptionService';
import { APIError } from '../../../lib/errors/APIError';
import { SubscriptionPlan } from '../../../types/subscription';

/**
 * Route handler for creating new subscriptions
 * @requirement Subscription System - Tiered access control, payment processing, account management
 * @requirement Payment Processing - Payment handling via Stripe integration
 */
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    // Extract request body
    const body = await req.json();
    const { planId, paymentMethodId } = body;

    // Validate required parameters
    if (!planId || !paymentMethodId) {
      throw new APIError(
        'VALIDATION_ERROR',
        'Missing required parameters',
        {
          required: ['planId', 'paymentMethodId'],
          received: { planId, paymentMethodId }
        },
        req.headers.get('x-request-id') || 'unknown'
      );
    }

    // Initialize subscription service
    const subscriptionService = new SubscriptionService();

    // Create subscription
    const subscription = await subscriptionService.createSubscription(
      user.id,
      planId,
      paymentMethodId
    );

    // Return success response
    return NextResponse.json({
      code: 'SUCCESS',
      message: 'Subscription created successfully',
      data: subscription
    }, { status: 201 });

  } catch (error) {
    // Handle known errors
    if (error instanceof APIError) {
      return NextResponse.json(error.toJSON(), { status: 400 });
    }

    // Handle Stripe errors
    if (error.type?.startsWith('Stripe')) {
      return NextResponse.json({
        code: 'PAYMENT_ERROR',
        message: 'Payment processing failed',
        details: {
          error: error.message,
          type: error.type
        }
      }, { status: 400 });
    }

    // Handle unexpected errors
    console.error('Subscription creation error:', error);
    return NextResponse.json({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: {
        requestId: req.headers.get('x-request-id') || 'unknown'
      }
    }, { status: 500 });
  }
});