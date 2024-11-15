// Human Tasks:
// 1. Configure test environment variables for Stripe API keys and webhook secrets
// 2. Set up test data for subscription products in Stripe dashboard
// 3. Configure test webhook endpoints for local development
// 4. Verify test credit card numbers are up to date with Stripe's test cards

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'; // ^29.0.0
import Stripe from 'stripe'; // ^12.0.0
import {
  createCustomer,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  handleWebhook,
  validateWebhookSignature,
  createPaymentIntent
} from '../../lib/stripe';
import { stripeConfig, SUBSCRIPTION_PRODUCTS, WEBHOOK_EVENTS } from '../../config/stripe';

// Mock Stripe client
jest.mock('stripe');

// Test data setup
const testCustomer = {
  id: 'cus_test',
  email: 'test@example.com',
  name: 'Test User'
};

const testSubscription = {
  id: 'sub_test',
  customer: 'cus_test',
  status: 'active',
  plan: { id: 'plan_test' }
};

const testPaymentMethod = {
  id: 'pm_test',
  type: 'card'
};

const testWebhookSecret = 'whsec_test';

describe('Stripe Customer Management', () => {
  /**
   * @requirement Subscription System - Customer management
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new customer successfully', async () => {
    const mockCreate = jest.fn().mockResolvedValue(testCustomer);
    (Stripe as jest.Mock).mockImplementation(() => ({
      customers: { create: mockCreate }
    }));

    const customer = await createCustomer('test@example.com', 'Test User');

    expect(mockCreate).toHaveBeenCalledWith({
      email: 'test@example.com',
      name: 'Test User',
      metadata: {
        platform: 'case-interview-practice'
      }
    });
    expect(customer).toEqual(testCustomer);
  });

  test('should handle customer creation error', async () => {
    const mockCreate = jest.fn().mockRejectedValue(new Error('Stripe API Error'));
    (Stripe as jest.Mock).mockImplementation(() => ({
      customers: { create: mockCreate }
    }));

    await expect(createCustomer('invalid', 'Test User')).rejects.toThrow('Failed to create customer');
  });
});

describe('Subscription Management', () => {
  /**
   * @requirement Subscription System - Payment processing
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new subscription successfully', async () => {
    const mockAttach = jest.fn().mockResolvedValue(testPaymentMethod);
    const mockUpdate = jest.fn().mockResolvedValue(testCustomer);
    const mockCreate = jest.fn().mockResolvedValue(testSubscription);

    (Stripe as jest.Mock).mockImplementation(() => ({
      paymentMethods: { attach: mockAttach },
      customers: { update: mockUpdate },
      subscriptions: { create: mockCreate }
    }));

    const subscription = await createSubscription(
      testCustomer.id,
      'price_test',
      testPaymentMethod
    );

    expect(mockAttach).toHaveBeenCalledWith(testPaymentMethod.id, {
      customer: testCustomer.id
    });
    expect(mockUpdate).toHaveBeenCalledWith(testCustomer.id, {
      invoice_settings: {
        default_payment_method: testPaymentMethod.id
      }
    });
    expect(mockCreate).toHaveBeenCalledWith({
      customer: testCustomer.id,
      items: [{ price: 'price_test' }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });
    expect(subscription).toEqual(testSubscription);
  });

  test('should update subscription successfully', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(testSubscription);
    (Stripe as jest.Mock).mockImplementation(() => ({
      subscriptions: { update: mockUpdate }
    }));

    const updateParams = {
      items: [{ price: 'price_new' }]
    };

    const subscription = await updateSubscription(testSubscription.id, updateParams);

    expect(mockUpdate).toHaveBeenCalledWith(testSubscription.id, {
      ...updateParams,
      proration_behavior: 'create_prorations'
    });
    expect(subscription).toEqual(testSubscription);
  });

  test('should cancel subscription successfully', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ ...testSubscription, status: 'canceled' });
    (Stripe as jest.Mock).mockImplementation(() => ({
      subscriptions: { update: mockUpdate }
    }));

    const subscription = await cancelSubscription(testSubscription.id, true);

    expect(mockUpdate).toHaveBeenCalledWith(testSubscription.id, {
      cancel_at_period_end: false,
      status: 'canceled'
    });
    expect(subscription.status).toBe('canceled');
  });
});

describe('Webhook Processing', () => {
  /**
   * @requirement Payment Processing - Secure webhook handling
   */
  const mockWebhookPayload = Buffer.from(JSON.stringify({
    type: WEBHOOK_EVENTS.SUBSCRIPTION_CREATED,
    data: { object: testSubscription }
  }));
  const mockSignature = 'test_signature';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should validate webhook signature successfully', async () => {
    const mockConstructEvent = jest.fn().mockReturnValue({
      type: WEBHOOK_EVENTS.SUBSCRIPTION_CREATED,
      data: { object: testSubscription }
    });

    (Stripe as jest.Mock).mockImplementation(() => ({
      webhooks: { constructEvent: mockConstructEvent }
    }));

    const isValid = await validateWebhookSignature(mockWebhookPayload, mockSignature);

    expect(mockConstructEvent).toHaveBeenCalledWith(
      mockWebhookPayload,
      mockSignature,
      stripeConfig.webhookSecret
    );
    expect(isValid).toBe(true);
  });

  test('should handle webhook signature validation failure', async () => {
    const mockConstructEvent = jest.fn().mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    (Stripe as jest.Mock).mockImplementation(() => ({
      webhooks: { constructEvent: mockConstructEvent }
    }));

    await expect(validateWebhookSignature(mockWebhookPayload, 'invalid_signature'))
      .rejects.toThrow('Invalid webhook signature');
  });

  test('should process subscription.created webhook successfully', async () => {
    const mockConstructEvent = jest.fn().mockReturnValue({
      type: WEBHOOK_EVENTS.SUBSCRIPTION_CREATED,
      data: { object: testSubscription }
    });

    (Stripe as jest.Mock).mockImplementation(() => ({
      webhooks: { constructEvent: mockConstructEvent }
    }));

    const response = await handleWebhook(mockWebhookPayload, mockSignature);

    expect(response).toEqual({
      status: 'success',
      message: 'Subscription created successfully',
      data: testSubscription
    });
  });

  test('should process payment_intent.succeeded webhook successfully', async () => {
    const mockConstructEvent = jest.fn().mockReturnValue({
      type: WEBHOOK_EVENTS.PAYMENT_SUCCEEDED,
      data: { object: { id: 'pi_test' } }
    });

    (Stripe as jest.Mock).mockImplementation(() => ({
      webhooks: { constructEvent: mockConstructEvent }
    }));

    const response = await handleWebhook(mockWebhookPayload, mockSignature);

    expect(response).toEqual({
      status: 'success',
      message: 'Payment processed successfully',
      data: { id: 'pi_test' }
    });
  });

  test('should handle payment_intent.failed webhook correctly', async () => {
    const mockConstructEvent = jest.fn().mockReturnValue({
      type: WEBHOOK_EVENTS.PAYMENT_FAILED,
      data: { object: { id: 'pi_test' } }
    });

    (Stripe as jest.Mock).mockImplementation(() => ({
      webhooks: { constructEvent: mockConstructEvent }
    }));

    const response = await handleWebhook(mockWebhookPayload, mockSignature);

    expect(response).toEqual({
      status: 'error',
      message: 'Payment failed',
      data: { id: 'pi_test' }
    });
  });
});