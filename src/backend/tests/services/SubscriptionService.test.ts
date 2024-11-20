import { describe, test, expect, jest, beforeEach } from '@jest/globals'; // ^29.0.0
import { Stripe } from 'stripe'; // ^12.0.0
import { 
  SubscriptionService,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscriptionUsage,
  handleWebhook
} from '../../services/SubscriptionService';
import { 
  SubscriptionModel,
  create,
  findById,
  findByUserId,
  update,
  cancel,
  checkUsage
} from '../../models/Subscription';
import { stripeClient, SUBSCRIPTION_PRODUCTS } from '../../config/stripe';

// Mock dependencies
jest.mock('../../models/Subscription');
jest.mock('../../config/stripe', () => ({
  stripeClient: {
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn()
    },
    subscriptions: {
      create: jest.fn(),
      update: jest.fn(),
      del: jest.fn()
    },
    paymentMethods: {
      attach: jest.fn()
    }
  },
  SUBSCRIPTION_PRODUCTS: {
    FREE: {
      id: 'free-tier',
      stripeProductId: 'price_free',
      limits: {
        drillAttempts: 5,
        simulationAttempts: 1,
        apiRequests: 100
      }
    },
    BASIC: {
      id: 'basic-tier',
      stripeProductId: 'price_basic',
      limits: {
        drillAttempts: 20,
        simulationAttempts: 5,
        apiRequests: 1000
      }
    }
  }
}));

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  const mockUserId = 'user123';
  const mockSubscriptionId = 'sub123';
  const mockCustomerId = 'cus123';
  const mockPaymentMethodId = 'pm123';

  beforeEach(() => {
    jest.clearAllMocks();
    subscriptionService = new SubscriptionService();
  });

  /**
   * @requirement Subscription System - Payment processing integration
   */
  test('createSubscription should create a new subscription successfully', async () => {
    // Mock Stripe customer creation
    (stripeClient.customers.create as jest.Mock).mockResolvedValue({
      id: mockCustomerId
    });

    // Mock Stripe subscription creation
    (stripeClient.subscriptions.create as jest.Mock).mockResolvedValue({
      id: mockSubscriptionId,
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      status: 'active'
    });

    // Mock database subscription creation
    (create as jest.Mock).mockResolvedValue({
      id: mockSubscriptionId,
      userId: mockUserId,
      planId: 'BASIC',
      status: 'ACTIVE'
    });

    const result = await subscriptionService.createSubscription(
      mockUserId,
      'BASIC',
      mockPaymentMethodId
    );

    expect(stripeClient.customers.create).toHaveBeenCalledWith({
      metadata: { userId: mockUserId }
    });
    expect(stripeClient.paymentMethods.attach).toHaveBeenCalledWith(
      mockPaymentMethodId,
      { customer: mockCustomerId }
    );
    expect(stripeClient.subscriptions.create).toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.status).toBe('ACTIVE');
  });

  /**
   * @requirement Subscription System - Account management
   */
  test('updateSubscription should update an existing subscription', async () => {
    const mockExistingSubscription = {
      id: mockSubscriptionId,
      stripeSubscriptionId: 'stripe_sub_123',
      planId: 'BASIC'
    };

    (findById as jest.Mock).mockResolvedValue(mockExistingSubscription);
    (stripeClient.subscriptions.update as jest.Mock).mockResolvedValue({
      id: mockSubscriptionId,
      status: 'active'
    });
    (update as jest.Mock).mockResolvedValue({
      ...mockExistingSubscription,
      planId: 'PREMIUM'
    });

    const updateData = { planId: 'PREMIUM' };
    const result = await subscriptionService.updateSubscription(
      mockSubscriptionId,
      updateData
    );

    expect(findById).toHaveBeenCalledWith(mockSubscriptionId);
    expect(stripeClient.subscriptions.update).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(mockSubscriptionId, updateData);
    expect(result.planId).toBe('PREMIUM');
  });

  /**
   * @requirement Subscription System - Account management
   */
  test('cancelSubscription should cancel subscription immediately', async () => {
    const mockSubscription = {
      id: mockSubscriptionId,
      stripeSubscriptionId: 'stripe_sub_123'
    };

    (findById as jest.Mock).mockResolvedValue(mockSubscription);
    (stripeClient.subscriptions.del as jest.Mock).mockResolvedValue({});
    (cancel as jest.Mock).mockResolvedValue(undefined);

    await subscriptionService.cancelSubscription(mockSubscriptionId, true);

    expect(findById).toHaveBeenCalledWith(mockSubscriptionId);
    expect(stripeClient.subscriptions.del).toHaveBeenCalledWith(
      mockSubscription.stripeSubscriptionId
    );
    expect(cancel).toHaveBeenCalledWith(mockSubscriptionId, true);
  });

  /**
   * @requirement Rate Limiting - Different API rate limits based on subscription tier
   */
  test('getSubscriptionUsage should return current usage metrics', async () => {
    const mockSubscription = {
      id: mockSubscriptionId,
      planId: 'BASIC'
    };

    const mockUsage = {
      drillAttempts: 10,
      simulationAttempts: 2,
      apiRequests: 500
    };

    (findById as jest.Mock).mockResolvedValue(mockSubscription);
    (checkUsage as jest.Mock).mockResolvedValue(mockUsage);

    const result = await subscriptionService.getSubscriptionUsage(mockSubscriptionId);

    expect(findById).toHaveBeenCalledWith(mockSubscriptionId);
    expect(checkUsage).toHaveBeenCalledWith(mockSubscriptionId);
    expect(result).toMatchObject({
      subscriptionId: mockSubscriptionId,
      ...mockUsage,
      limits: SUBSCRIPTION_PRODUCTS.BASIC.limits
    });
  });

  /**
   * @requirement Subscription System - Payment processing integration
   */
  test('handleWebhook should process subscription update events', async () => {
    const mockEvent = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: mockSubscriptionId,
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          cancel_at_period_end: false,
          metadata: {
            userId: mockUserId,
            planId: 'BASIC'
          }
        }
      }
    } as Stripe.Event;

    (update as jest.Mock).mockResolvedValue({
      id: mockSubscriptionId,
      status: 'ACTIVE'
    });

    await subscriptionService['handleWebhook'](mockEvent);

    expect(update).toHaveBeenCalledWith(mockSubscriptionId, expect.any(Object));
  });

  test('createSubscription should throw error for invalid plan', async () => {
    await expect(
      subscriptionService.createSubscription(mockUserId, 'INVALID_PLAN', mockPaymentMethodId)
    ).rejects.toThrow('Invalid subscription plan');
  });

  test('updateSubscription should throw error for non-existent subscription', async () => {
    (findById as jest.Mock).mockResolvedValue(null);

    await expect(
      subscriptionService.updateSubscription(mockSubscriptionId, { planId: 'BASIC' })
    ).rejects.toThrow('Subscription not found');
  });

  test('cancelSubscription should throw error for non-existent subscription', async () => {
    (findById as jest.Mock).mockResolvedValue(null);

    await expect(
      subscriptionService.cancelSubscription(mockSubscriptionId)
    ).rejects.toThrow('Subscription not found');
  });

  test('getSubscriptionUsage should throw error for invalid subscription', async () => {
    (findById as jest.Mock).mockResolvedValue(null);

    await expect(
      subscriptionService.getSubscriptionUsage(mockSubscriptionId)
    ).rejects.toThrow('Subscription not found');
  });
});