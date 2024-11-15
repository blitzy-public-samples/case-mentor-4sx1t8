/**
 * API endpoint handler for creating Stripe checkout sessions
 * Human Tasks:
 * 1. Configure STRIPE_SECRET_KEY in environment variables
 * 2. Set up success and cancel URLs in payment configuration
 * 3. Create and configure Stripe products and price IDs
 * 4. Set up webhook endpoint for post-payment processing
 */

import { NextRequest, NextResponse } from 'next/server'; // v13.0.0
import { APIResponse } from '../../types/api';
import { createCheckoutSession } from '../../lib/payments/stripe';
import { withAuth } from '../../lib/auth/middleware';

/**
 * Interface for checkout session creation request body
 * Requirement: Payment Integration - Validate payment request data
 */
interface CreateCheckoutRequest {
  priceId: string;
}

/**
 * Creates a new Stripe checkout session for subscription payment
 * Requirements addressed:
 * - Subscription System: Implement tiered access control and payment processing
 * - Payment Integration: Integrate Stripe for payment processing using SDK
 */
export const POST = withAuth(async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Extract authenticated user ID from request context
    const userId = req.auth?.userId;
    if (!userId) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'User not authenticated',
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      } as APIResponse<null>, { status: 401 });
    }

    // Parse and validate request body
    const body: CreateCheckoutRequest = await req.json();
    if (!body.priceId || typeof body.priceId !== 'string') {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Invalid price ID',
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      } as APIResponse<null>, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession(userId, body.priceId);

    // Return success response with checkout URL
    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: session.url
      },
      error: null,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    } as APIResponse<{ checkoutUrl: string | null }>, { status: 200 });

  } catch (error) {
    // Handle potential errors with proper APIResponse structure
    console.error('Checkout session creation failed:', error);
    
    return NextResponse.json({
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    } as APIResponse<null>, { status: 500 });
  }
}, { optional: false });