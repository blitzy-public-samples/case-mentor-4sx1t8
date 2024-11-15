/**
 * Test suite for payment-related API endpoints
 * Human Tasks:
 * 1. Configure test environment variables for Stripe test mode
 * 2. Set up test webhook endpoint in Stripe dashboard
 * 3. Create test products and prices in Stripe test mode
 * 4. Configure test database with mock user data
 */

// @ts-ignore @jest/globals ^29.0.0
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
// @ts-ignore stripe ^12.0.0
import Stripe from 'stripe';
// @ts-ignore @testing-library/jest-dom ^5.16.0
import { testClient } from '@testing-library/jest-dom';

import { createCheckoutSession, handleWebhook } from '../../lib/payments/stripe';
import { SUBSCRIPTION_PLANS } from '../../config/payments';
import type { APIResponse } from '../../types/api';

// Mock Stripe client and responses
const mockStripeCheckoutSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/test-session',
  payment_status: 'unpaid',
  status: 'open',
};

const mockStripeEvent = {
  id: 'evt_test_123',
  type: 'customer.subscription.updated',
  data: {
    object: {
      id: 'sub_test_123',
      status: 'active',
      customer: 'cus_test_123',
    },
  },
};

// Mock authentication middleware
const authMiddlewareMock = jest.fn((req, res, next) => {
  req.user = { id: 'test_user_id', customerId: 'cus_test_123' };
  next();
});

describe('POST /api/payments/create-checkout', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock Stripe checkout session creation
    jest.spyOn(Stripe.prototype.checkout.sessions, 'create')
      .mockResolvedValue(mockStripeCheckoutSession as Stripe.Checkout.Session);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Test successful checkout session creation
   * Requirement: Subscription System - Test implementation of tiered access control
   */
  test('should create checkout session successfully', async () => {
    const validPriceId = SUBSCRIPTION_PLANS[1].stripePriceId!;
    const customerId = 'cus_test_123';

    const response = await testClient
      .post('/api/payments/create-checkout')
      .set('Authorization', 'Bearer test_token')
      .send({ priceId: validPriceId });

    expect(response.status).toBe(200);
    const body = response.body as APIResponse<Stripe.Checkout.Session>;
    expect(body.success).toBe(true);
    expect(body.data.url).toBe(mockStripeCheckoutSession.url);
    expect(Stripe.prototype.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: customerId,
        line_items: [{
          price: validPriceId,
          quantity: 1,
        }],
      })
    );
  });

  /**
   * Test invalid price ID handling
   * Requirement: Payment Integration - Verify Stripe integration
   */
  test('should return error for invalid price ID', async () => {
    const invalidPriceId = 'invalid_price_id';

    const response = await testClient
      .post('/api/payments/create-checkout')
      .set('Authorization', 'Bearer test_token')
      .send({ priceId: invalidPriceId });

    expect(response.status).toBe(400);
    const body = response.body as APIResponse<null>;
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid price ID');
  });

  /**
   * Test unauthenticated request handling
   * Requirement: Subscription System - Test tiered access control
   */
  test('should return 401 for unauthenticated request', async () => {
    const response = await testClient
      .post('/api/payments/create-checkout')
      .send({ priceId: SUBSCRIPTION_PLANS[1].stripePriceId });

    expect(response.status).toBe(401);
  });

  /**
   * Test Stripe API error handling
   * Requirement: Payment Integration - Verify error handling
   */
  test('should handle Stripe API errors gracefully', async () => {
    jest.spyOn(Stripe.prototype.checkout.sessions, 'create')
      .mockRejectedValue(new Error('Stripe API error'));

    const response = await testClient
      .post('/api/payments/create-checkout')
      .set('Authorization', 'Bearer test_token')
      .send({ priceId: SUBSCRIPTION_PLANS[1].stripePriceId });

    expect(response.status).toBe(500);
    const body = response.body as APIResponse<null>;
    expect(body.success).toBe(false);
    expect(body.error).toContain('Stripe API error');
  });
});

describe('POST /api/payments/webhook', () => {
  const STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
  
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    jest.restoreAllMocks();
  });

  /**
   * Test successful webhook event handling
   * Requirement: Payment Integration - Test webhook functionality
   */
  test('should handle subscription update webhook successfully', async () => {
    jest.spyOn(Stripe.prototype.webhooks, 'constructEvent')
      .mockReturnValue(mockStripeEvent as Stripe.Event);

    const response = await testClient
      .post('/api/payments/webhook')
      .set('Stripe-Signature', 'test_signature')
      .send(JSON.stringify(mockStripeEvent));

    expect(response.status).toBe(200);
    expect(Stripe.prototype.webhooks.constructEvent).toHaveBeenCalledWith(
      JSON.stringify(mockStripeEvent),
      'test_signature',
      STRIPE_WEBHOOK_SECRET
    );
  });

  /**
   * Test invalid webhook signature handling
   * Requirement: Payment Integration - Verify security measures
   */
  test('should return 400 for invalid webhook signature', async () => {
    jest.spyOn(Stripe.prototype.webhooks, 'constructEvent')
      .mockImplementation(() => {
        throw new Error('Invalid signature');
      });

    const response = await testClient
      .post('/api/payments/webhook')
      .set('Stripe-Signature', 'invalid_signature')
      .send(JSON.stringify(mockStripeEvent));

    expect(response.status).toBe(400);
    const body = response.body as APIResponse<null>;
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid signature');
  });

  /**
   * Test subscription deletion webhook handling
   * Requirement: Subscription System - Test subscription lifecycle
   */
  test('should handle subscription deletion webhook', async () => {
    const deletionEvent = {
      ...mockStripeEvent,
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test_123',
          status: 'canceled',
          customer: 'cus_test_123',
        },
      },
    };

    jest.spyOn(Stripe.prototype.webhooks, 'constructEvent')
      .mockReturnValue(deletionEvent as Stripe.Event);

    const response = await testClient
      .post('/api/payments/webhook')
      .set('Stripe-Signature', 'test_signature')
      .send(JSON.stringify(deletionEvent));

    expect(response.status).toBe(200);
  });

  /**
   * Test webhook secret configuration validation
   * Requirement: Payment Integration - Verify configuration
   */
  test('should handle missing webhook secret', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const response = await testClient
      .post('/api/payments/webhook')
      .set('Stripe-Signature', 'test_signature')
      .send(JSON.stringify(mockStripeEvent));

    expect(response.status).toBe(500);
    const body = response.body as APIResponse<null>;
    expect(body.success).toBe(false);
    expect(body.error).toContain('Webhook secret not configured');
  });
});