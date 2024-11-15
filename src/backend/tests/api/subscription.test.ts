// Human Tasks:
// 1. Configure Stripe webhook endpoint secret in test environment
// 2. Set up test payment methods in Stripe test mode
// 3. Verify rate limiting thresholds match test configuration
// 4. Configure test database with required subscription plans

// @jest/globals ^29.0.0
import { describe, expect, jest, beforeEach, afterEach, it } from '@jest/globals';
// supertest ^6.0.0
import request from 'supertest';
// stripe-mock ^2.0.0
import stripeMock from 'stripe-mock';

import { SubscriptionService } from '../../services/SubscriptionService';
import { APIError } from '../../lib/errors/APIError';
import { SubscriptionPlan, Subscription } from '../../types/subscription';

// Mock SubscriptionService
jest.mock('../../services/SubscriptionService');

// Test data setup
const testUser = { id: 'test-user-id', email: 'test@example.com' };
const testPlan: SubscriptionPlan = {
  id: 'test-plan-id',
  name: 'Premium',
  priceMonthly: 49.99,
  stripeProductId: 'prod_test123'
};

/**
 * Test suite for subscription creation endpoint
 * @requirement Subscription System - Test coverage for tiered access control and payment processing
 */
describe('POST /api/subscription/create', () => {
  let stripeMockServer: any;

  beforeEach(() => {
    stripeMockServer = stripeMock.spawn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    stripeMockServer.close();
  });

  it('should create a subscription successfully with valid plan and payment method', async () => {
    // Mock successful subscription creation
    const mockSubscription: Subscription = {
      id: 'sub_123',
      userId: testUser.id,
      planId: testPlan.id,
      status: 'ACTIVE',
      stripeSubscriptionId: 'sub_stripe123'
    };

    (SubscriptionService.prototype.createSubscription as jest.Mock).mockResolvedValue(mockSubscription);

    const response = await request(app)
      .post('/api/subscription/create')
      .set('Authorization', `Bearer test-token`)
      .send({
        planId: testPlan.id,
        paymentMethodId: 'pm_test123'
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      subscription: mockSubscription
    });
  });

  it('should return 400 for missing payment method', async () => {
    const response = await request(app)
      .post('/api/subscription/create')
      .set('Authorization', `Bearer test-token`)
      .send({
        planId: testPlan.id
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should return 400 for invalid plan ID', async () => {
    (SubscriptionService.prototype.createSubscription as jest.Mock).mockRejectedValue(
      new APIError('VALIDATION_ERROR', 'Invalid subscription plan')
    );

    const response = await request(app)
      .post('/api/subscription/create')
      .set('Authorization', `Bearer test-token`)
      .send({
        planId: 'invalid-plan',
        paymentMethodId: 'pm_test123'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should handle Stripe payment failures', async () => {
    stripeMockServer.on('post', '/v1/subscriptions', (req: any, res: any) => {
      res.status(402).send({
        error: {
          type: 'card_error',
          message: 'Your card was declined'
        }
      });
    });

    const response = await request(app)
      .post('/api/subscription/create')
      .set('Authorization', `Bearer test-token`)
      .send({
        planId: testPlan.id,
        paymentMethodId: 'pm_declined'
      });

    expect(response.status).toBe(402);
    expect(response.body).toHaveProperty('error.code', 'PAYMENT_ERROR');
  });
});

/**
 * Test suite for subscription update endpoint
 * @requirement Subscription System - Test coverage for subscription management
 */
describe('PATCH /api/subscription/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update subscription plan successfully', async () => {
    const updatedSubscription: Subscription = {
      id: 'sub_123',
      userId: testUser.id,
      planId: 'new-plan-id',
      status: 'ACTIVE',
      stripeSubscriptionId: 'sub_stripe123'
    };

    (SubscriptionService.prototype.updateSubscription as jest.Mock).mockResolvedValue(updatedSubscription);

    const response = await request(app)
      .patch('/api/subscription/sub_123')
      .set('Authorization', `Bearer test-token`)
      .send({
        planId: 'new-plan-id'
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      subscription: updatedSubscription
    });
  });

  it('should return 404 for invalid subscription ID', async () => {
    (SubscriptionService.prototype.updateSubscription as jest.Mock).mockRejectedValue(
      new APIError('NOT_FOUND', 'Subscription not found')
    );

    const response = await request(app)
      .patch('/api/subscription/invalid-id')
      .set('Authorization', `Bearer test-token`)
      .send({
        planId: 'new-plan-id'
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error.code', 'NOT_FOUND');
  });

  it('should return 403 for unauthorized access', async () => {
    const response = await request(app)
      .patch('/api/subscription/sub_123')
      .send({
        planId: 'new-plan-id'
      });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error.code', 'UNAUTHORIZED');
  });
});

/**
 * Test suite for subscription cancellation endpoint
 * @requirement Subscription System - Test coverage for subscription lifecycle
 */
describe('DELETE /api/subscription/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should cancel subscription at period end', async () => {
    (SubscriptionService.prototype.cancelSubscription as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete('/api/subscription/sub_123')
      .set('Authorization', `Bearer test-token`)
      .send({
        immediately: false
      });

    expect(response.status).toBe(200);
    expect(SubscriptionService.prototype.cancelSubscription).toHaveBeenCalledWith('sub_123', false);
  });

  it('should cancel subscription immediately', async () => {
    (SubscriptionService.prototype.cancelSubscription as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete('/api/subscription/sub_123')
      .set('Authorization', `Bearer test-token`)
      .send({
        immediately: true
      });

    expect(response.status).toBe(200);
    expect(SubscriptionService.prototype.cancelSubscription).toHaveBeenCalledWith('sub_123', true);
  });

  it('should return 404 for invalid subscription ID', async () => {
    (SubscriptionService.prototype.cancelSubscription as jest.Mock).mockRejectedValue(
      new APIError('NOT_FOUND', 'Subscription not found')
    );

    const response = await request(app)
      .delete('/api/subscription/invalid-id')
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error.code', 'NOT_FOUND');
  });
});

/**
 * Test suite for Stripe webhook handling
 * @requirement Payment Processing - Test coverage for Stripe integration
 */
describe('POST /api/subscription/webhook', () => {
  let stripeMockServer: any;

  beforeEach(() => {
    stripeMockServer = stripeMock.spawn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    stripeMockServer.close();
  });

  it('should handle successful payment event', async () => {
    const webhookEvent = {
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          subscription: 'sub_123',
          customer: 'cus_123',
          status: 'paid'
        }
      }
    };

    const response = await request(app)
      .post('/api/subscription/webhook')
      .set('Stripe-Signature', 'test-signature')
      .send(webhookEvent);

    expect(response.status).toBe(200);
  });

  it('should handle payment failure event', async () => {
    const webhookEvent = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          subscription: 'sub_123',
          customer: 'cus_123',
          status: 'failed'
        }
      }
    };

    const response = await request(app)
      .post('/api/subscription/webhook')
      .set('Stripe-Signature', 'test-signature')
      .send(webhookEvent);

    expect(response.status).toBe(200);
  });

  it('should validate webhook signature', async () => {
    const response = await request(app)
      .post('/api/subscription/webhook')
      .send({
        type: 'invoice.payment_succeeded'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error.code', 'INVALID_SIGNATURE');
  });

  it('should handle invalid event types', async () => {
    const webhookEvent = {
      type: 'invalid.event',
      data: {
        object: {}
      }
    };

    const response = await request(app)
      .post('/api/subscription/webhook')
      .set('Stripe-Signature', 'test-signature')
      .send(webhookEvent);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error.code', 'INVALID_WEBHOOK_EVENT');
  });
});