/**
 * API endpoint handler for creating and managing Stripe customer portal sessions
 * 
 * Human Tasks:
 * 1. Ensure Stripe Customer Portal is enabled in Stripe Dashboard
 * 2. Configure branding and features in Stripe Customer Portal settings
 * 3. Verify return URL (successUrl) is properly configured in environment
 */

// next/server v13.0.0
import { NextResponse, NextRequest } from 'next/server';

// Internal imports
import { withAuth } from '../../lib/auth/middleware';
import stripe from '../../lib/payments/stripe';
import { PAYMENT_CONFIG } from '../../config/payments';
import { createErrorResponse } from '../../lib/utils/errors';

/**
 * Creates a Stripe customer portal session for subscription management
 * Requirements addressed:
 * - Subscription System: Tiered access control, payment processing, account management
 * - Payment Integration: Stripe integration with SDK and customer portal functionality
 */
async function createPortalSession(
  req: NextRequest
): Promise<NextResponse> {
  try {
    // Extract customer ID from request URL parameters
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customerId');

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    // Create Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: PAYMENT_CONFIG.successUrl,
      // Configure portal features
      configuration: {
        features: {
          subscription_cancel: { enabled: true },
          subscription_pause: { enabled: true },
          payment_method_update: { enabled: true },
          invoice_history: { enabled: true }
        }
      }
    });

    // Return portal session URL for client redirect
    return NextResponse.json({
      url: session.url,
      success: true
    }, { status: 200 });

  } catch (error) {
    // Handle errors with standardized error response
    const errorResponse = createErrorResponse(
      error as Error,
      `portal_session_${Date.now()}`
    );

    return NextResponse.json(errorResponse, {
      status: error instanceof Error && error.message.includes('Customer') ? 400 : 500
    });
  }
}

// Export route handler with authentication middleware
export const POST = withAuth(createPortalSession, { optional: false });