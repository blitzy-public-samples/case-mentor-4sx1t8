import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals'; // ^29.0.0
import StripeMock from 'stripe-mock'; // ^2.0.0
import { SubscriptionModel } from '../../models/Subscription';
import { Subscription, UserSubscriptionStatus } from '../../types/subscription';

// Human Tasks:
// 1. Configure test environment variables for Stripe test keys
// 2. Set up test database with required schema and tables
// 3. Configure test subscription plan IDs in test environment
// 4. Verify test rate limiting thresholds match test data

// Mock Stripe and database modules
jest.mock('stripe');
jest.mock('../../utils/database');

describe('SubscriptionModel', () => {
  let stripeMock: StripeMock;
  let testSubscription: Subscription;

  beforeEach(async () => {
    // Initialize Stripe mock
    stripeMock = new StripeMock();
    await stripeMock.start();

    // Set up test data
    testSubscription = {
      id: 'test-sub-123',
      userId: 'test-user-123',
      planId: 'test-plan-123',
      status: UserSubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: 'stripe-sub-123',
      stripeCustomerId: 'stripe-cust-123'
    };

    // Clear database tables
    await jest.requireMock('../../utils/database').executeQuery('TRUNCATE subscriptions CASCADE');
  });

  afterEach(async () => {
    await stripeMock.stop();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new subscription successfully', async () => {
      // Requirement: Subscription System - Payment processing integration
      const stripeResponse = {
        id: 'stripe-sub-123',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      };
      stripeMock.subscriptions.create.mockResolvedValue(stripeResponse);

      const result = await SubscriptionModel.create(testSubscription);

      expect(result).toBeInstanceOf(SubscriptionModel);
      expect(result.id).toBe(testSubscription.id);
      expect(stripeMock.subscriptions.create).toHaveBeenCalledWith({
        customer: testSubscription.stripeCustomerId,
        items: [{ price: testSubscription.planId }],
        metadata: {
          userId: testSubscription.userId,
          subscriptionId: testSubscription.id
        }
      });
    });

    it('should throw error for missing required fields', async () => {
      const invalidSubscription = { ...testSubscription, userId: '' };
      await expect(SubscriptionModel.create(invalidSubscription))
        .rejects
        .toThrow('Missing required field: userId');
    });

    it('should handle Stripe API failures', async () => {
      stripeMock.subscriptions.create.mockRejectedValue(new Error('Stripe API error'));
      await expect(SubscriptionModel.create(testSubscription))
        .rejects
        .toThrow('Failed to create subscription: Stripe API error');
    });
  });

  describe('findById', () => {
    it('should retrieve subscription by ID', async () => {
      // Requirement: Subscription System - Account management
      const mockDbResponse = { ...testSubscription };
      jest.requireMock('../../utils/database').executeQuery.mockResolvedValue(mockDbResponse);

      const result = await SubscriptionModel.findById(testSubscription.id);

      expect(result).toBeInstanceOf(SubscriptionModel);
      expect(result?.id).toBe(testSubscription.id);
    });

    it('should return null for non-existent subscription', async () => {
      jest.requireMock('../../utils/database').executeQuery.mockResolvedValue(null);
      const result = await SubscriptionModel.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should retrieve active subscription for user', async () => {
      // Requirement: Subscription System - Account management
      const mockDbResponse = { ...testSubscription };
      jest.requireMock('../../utils/database').executeQuery.mockResolvedValue(mockDbResponse);

      const result = await SubscriptionModel.findByUserId(testSubscription.userId);

      expect(result).toBeInstanceOf(SubscriptionModel);
      expect(result?.userId).toBe(testSubscription.userId);
      expect(result?.status).toBe(UserSubscriptionStatus.ACTIVE);
    });

    it('should return null for user without subscription', async () => {
      jest.requireMock('../../utils/database').executeQuery.mockResolvedValue(null);
      const result = await SubscriptionModel.findByUserId('user-without-sub');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update subscription with plan change', async () => {
      // Requirement: Subscription System - Account management
      const subscription = new SubscriptionModel(testSubscription);
      const updateData = { planId: 'new-plan-123' };

      stripeMock.subscriptions.update.mockResolvedValue({
        id: subscription.stripeSubscriptionId,
        items: [{ price: updateData.planId }]
      });

      jest.requireMock('../../utils/database').executeQuery.mockResolvedValue({
        ...testSubscription,
        ...updateData
      });

      const result = await subscription.update(updateData);

      expect(result.planId).toBe(updateData.planId);
      expect(stripeMock.subscriptions.update).toHaveBeenCalled();
    });

    it('should handle Stripe update failures', async () => {
      const subscription = new SubscriptionModel(testSubscription);
      stripeMock.subscriptions.update.mockRejectedValue(new Error('Stripe update failed'));

      await expect(subscription.update({ planId: 'new-plan' }))
        .rejects
        .toThrow('Failed to update subscription: Stripe update failed');
    });
  });

  describe('cancel', () => {
    it('should cancel subscription immediately', async () => {
      // Requirement: Subscription System - Account management
      const subscription = new SubscriptionModel(testSubscription);

      stripeMock.subscriptions.update.mockResolvedValue({
        id: subscription.stripeSubscriptionId,
        cancel_at_period_end: false
      });

      await subscription.cancel(true);

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
          metadata: { cancelReason: 'immediate' }
        }
      );
    });

    it('should schedule cancellation at period end', async () => {
      const subscription = new SubscriptionModel(testSubscription);

      stripeMock.subscriptions.update.mockResolvedValue({
        id: subscription.stripeSubscriptionId,
        cancel_at_period_end: true
      });

      await subscription.cancel(false);

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
          metadata: { cancelReason: 'end_of_period' }
        }
      );
    });
  });

  describe('checkUsage', () => {
    it('should verify usage within limits', async () => {
      // Requirement: Rate Limiting - Different API rate limits based on subscription tier
      const subscription = new SubscriptionModel(testSubscription);
      
      jest.requireMock('../../utils/database').executeQuery
        .mockResolvedValueOnce({ usage_count: 50 })
        .mockResolvedValueOnce({ limits: { api_calls: 100 } });

      const result = await subscription.checkUsage('api_calls');
      expect(result).toBe(true);
    });

    it('should detect usage exceeding limits', async () => {
      const subscription = new SubscriptionModel(testSubscription);
      
      jest.requireMock('../../utils/database').executeQuery
        .mockResolvedValueOnce({ usage_count: 150 })
        .mockResolvedValueOnce({ limits: { api_calls: 100 } });

      const result = await subscription.checkUsage('api_calls');
      expect(result).toBe(false);
    });
  });
});