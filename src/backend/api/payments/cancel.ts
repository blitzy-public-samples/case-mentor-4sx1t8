/**
 * API endpoint handler for canceling user subscriptions
 * Human Tasks:
 * 1. Configure Stripe webhook endpoint for subscription cancellation events
 * 2. Set up monitoring for failed cancellation attempts
 * 3. Configure email notifications for subscription cancellations
 */

// next/server v13.0.0
import { NextRequest, NextResponse } from 'next/server';

// Internal imports with relative paths
import { APIResponse } from '../../types/api';
import { withAuth } from '../../lib/auth/middleware';
import { cancelSubscription } from '../../lib/payments/stripe';
import { cancelUserSubscription } from '../../lib/database/queries/subscriptions';

/**
 * Handles subscription cancellation requests
 * Requirements addressed:
 * - Subscription System (3. SCOPE/Core Features/User Management): Implement subscription management with ability to cancel subscriptions
 * - Payment Integration (4. TECHNOLOGY STACK/4.4 THIRD-PARTY SERVICES): Handle subscription cancellation through Stripe integration
 */
async function cancelSubscriptionHandler(req: NextRequest): Promise<NextResponse> {
  try {
    // Generate unique request ID for tracking
    const requestId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Extract subscription ID from request body
    const body = await req.json();
    const { subscriptionId } = body;

    // Validate subscription ID format
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        data: null,
        error: 'Invalid subscription ID format',
        requestId,
        timestamp
      }, { status: 400 });
    }

    // Cancel subscription in Stripe
    await cancelSubscription(subscriptionId);

    // Update subscription status in database
    await cancelUserSubscription(subscriptionId);

    // Return success response
    return NextResponse.json<APIResponse<{ subscriptionId: string }>>({
      success: true,
      data: { subscriptionId },
      error: null,
      requestId,
      timestamp
    }, { status: 200 });

  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      const errorResponse: APIResponse<null> = {
        success: false,
        data: null,
        error: error.message,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };

      // Determine appropriate status code based on error
      const status = error.message.includes('not found') ? 404 :
                    error.message.includes('permission') ? 403 :
                    error.message.includes('invalid') ? 400 : 500;

      return NextResponse.json(errorResponse, { status });
    }

    // Handle unexpected errors
    return NextResponse.json<APIResponse<null>>({
      success: false,
      data: null,
      error: 'An unexpected error occurred while canceling the subscription',
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Export the handler with authentication middleware
export default withAuth(cancelSubscriptionHandler, { optional: false });