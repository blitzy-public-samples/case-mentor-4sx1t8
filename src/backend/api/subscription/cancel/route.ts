// Human Tasks:
// 1. Configure Stripe webhook endpoint for subscription cancellation events
// 2. Set up monitoring alerts for subscription cancellation rates
// 3. Review and adjust subscription cancellation grace period settings

import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { z } from 'zod'; // ^3.22.0
import { withAuth } from '../../../lib/auth/middleware';
import { SubscriptionService } from '../../../services/SubscriptionService';
import { handleError } from '../../../lib/errors/handlers';

// Initialize subscription service singleton
const subscriptionService = new SubscriptionService();

// Validate subscription cancellation request parameters
const cancelRequestSchema = z.object({
  subscriptionId: z.string(),
  immediately: z.boolean().optional()
});

/**
 * Protected route handler for subscription cancellation requests
 * @requirement Subscription System - Tiered access control, payment processing, account management
 * @requirement Security Controls - Authentication and authorization for subscription management
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { user }
): Promise<NextResponse> => {
  try {
    // Extract request parameters from URL
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());

    // Validate request parameters
    const validatedParams = cancelRequestSchema.parse(params);
    const { subscriptionId, immediately = false } = validatedParams;

    // Process subscription cancellation
    await subscriptionService.cancelSubscription(
      subscriptionId,
      immediately
    );

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: null,
        error: null,
        metadata: {
          subscriptionId,
          cancelledAt: new Date().toISOString(),
          immediately
        }
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors using standardized error handler
    return handleError(error, request.headers.get('x-request-id') || '');
  }
});