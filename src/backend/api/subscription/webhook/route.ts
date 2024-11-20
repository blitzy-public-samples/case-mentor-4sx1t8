// Human Tasks:
// 1. Configure Stripe webhook endpoint URL in production environment
// 2. Set up Stripe webhook signing secret in environment variables
// 3. Set up monitoring for webhook processing failures
// 4. Configure retry mechanism for failed webhook events
// 5. Ensure <200ms response time for webhook processing

import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { Stripe } from 'stripe'; // ^12.0.0
import { handleWebhook, validateWebhookSignature } from '../../../lib/stripe/webhooks';
import { SubscriptionService } from '../../../services/SubscriptionService';
import { handleError } from '../../../lib/errors/handlers';

/**
 * Handles incoming Stripe webhook events for subscription management
 * @requirement Subscription System - Tiered access control, payment processing, account management
 * @requirement Payment Processing - Payment handling via Stripe integration
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Generate unique request ID for tracking
    const requestId = crypto.randomUUID();

    // Extract raw request body and signature
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      throw new Error('Missing Stripe signature header');
    }

    // Validate webhook signature
    const isValid = await validateWebhookSignature(
      rawBody,
      signature
    );

    if (!isValid) {
      return handleError(
        new Error('Invalid webhook signature'),
        requestId
      );
    }

    // Parse webhook event
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Process webhook event using subscription service
    const subscriptionService = new SubscriptionService();
    await subscriptionService.handleWebhook(event);

    // Return success response
    return new NextResponse(
      JSON.stringify({
        success: true,
        data: { received: true },
        error: null,
        metadata: {
          requestId,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      }
    );

  } catch (error) {
    // Use global error handler for standardized error responses
    return handleError(
      error as Error,
      crypto.randomUUID()
    );
  }
}