// Human Tasks:
// 1. Configure Stripe API keys in environment variables
// 2. Set up Stripe webhook endpoints for subscription events
// 3. Configure subscription plan IDs in Stripe dashboard
// 4. Verify rate limiting thresholds match subscription tiers

import { Stripe } from 'stripe'; // ^12.0.0
import { Subscription } from '../types/subscription';
import { executeQuery, withTransaction } from '../utils/database';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

/**
 * Model class for managing subscription data and operations
 * @requirement Subscription System - Tiered access control, payment processing, account management
 * @requirement Rate Limiting - Different API rate limits based on subscription tier
 */
export class SubscriptionModel {
  public id: string;
  public userId: string;
  public planId: string;
  public status: UserSubscriptionStatus;
  public currentPeriodStart: Date;
  public currentPeriodEnd: Date;
  public cancelAtPeriodEnd: boolean;
  public stripeSubscriptionId: string;
  public stripeCustomerId: string;

  /**
   * Creates a new subscription model instance
   * @requirement Subscription System - Account management
   */
  constructor(data: Subscription) {
    this.validateRequiredFields(data);
    this.id = data.id;
    this.userId = data.userId;
    this.planId = data.planId;
    this.status = data.status;
    this.currentPeriodStart = new Date(data.currentPeriodStart);
    this.currentPeriodEnd = new Date(data.currentPeriodEnd);
    this.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
    this.stripeSubscriptionId = data.stripeSubscriptionId;
    this.stripeCustomerId = data.stripeCustomerId;
  }

  /**
   * Validates required subscription fields
   * @private
   */
  private validateRequiredFields(data: Subscription): void {
    const requiredFields = ['id', 'userId', 'planId', 'status'];
    for (const field of requiredFields) {
      if (!data[field as keyof Subscription]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Creates a new subscription in the database with Stripe integration
   * @requirement Subscription System - Payment processing integration
   */
  public static async create(data: Subscription): Promise<SubscriptionModel> {
    try {
      // Create Stripe subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: data.stripeCustomerId,
        items: [{ price: data.planId }],
        metadata: {
          userId: data.userId,
          subscriptionId: data.id
        }
      });

      // Store subscription in database within transaction
      const subscription = await withTransaction(async (client) => {
        const query = `
          INSERT INTO subscriptions (
            id, user_id, plan_id, status, 
            current_period_start, current_period_end,
            cancel_at_period_end, stripe_subscription_id,
            stripe_customer_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const values = [
          data.id,
          data.userId,
          data.planId,
          data.status,
          new Date(stripeSubscription.current_period_start * 1000),
          new Date(stripeSubscription.current_period_end * 1000),
          false,
          stripeSubscription.id,
          data.stripeCustomerId
        ];

        return executeQuery(query, values);
      });

      return new SubscriptionModel(subscription);
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Retrieves a subscription by ID
   * @requirement Subscription System - Account management
   */
  public static async findById(id: string): Promise<SubscriptionModel | null> {
    try {
      const query = `
        SELECT * FROM subscriptions 
        WHERE id = $1
      `;
      const subscription = await executeQuery<Subscription>(query, [id]);
      return subscription ? new SubscriptionModel(subscription) : null;
    } catch (error) {
      throw new Error(`Failed to find subscription: ${error.message}`);
    }
  }

  /**
   * Retrieves a user's active subscription
   * @requirement Subscription System - Account management
   */
  public static async findByUserId(userId: string): Promise<SubscriptionModel | null> {
    try {
      const query = `
        SELECT * FROM subscriptions 
        WHERE user_id = $1 
        AND status = 'ACTIVE'
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const subscription = await executeQuery<Subscription>(query, [userId]);
      return subscription ? new SubscriptionModel(subscription) : null;
    } catch (error) {
      throw new Error(`Failed to find user subscription: ${error.message}`);
    }
  }

  /**
   * Updates subscription details with Stripe synchronization
   * @requirement Subscription System - Account management
   */
  public async update(data: Partial<Subscription>): Promise<SubscriptionModel> {
    try {
      // Update Stripe subscription if payment details changed
      if (data.planId) {
        await stripe.subscriptions.update(this.stripeSubscriptionId, {
          items: [{ price: data.planId }],
          metadata: {
            userId: this.userId,
            subscriptionId: this.id
          }
        });
      }

      // Update database record within transaction
      const subscription = await withTransaction(async (client) => {
        const updateFields = Object.keys(data)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');

        const query = `
          UPDATE subscriptions 
          SET ${updateFields}
          WHERE id = $1
          RETURNING *
        `;

        const values = [this.id, ...Object.values(data)];
        return executeQuery<Subscription>(query, values);
      });

      return new SubscriptionModel(subscription);
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  /**
   * Cancels the subscription
   * @requirement Subscription System - Account management
   */
  public async cancel(immediately: boolean): Promise<void> {
    try {
      // Cancel Stripe subscription
      await stripe.subscriptions.update(this.stripeSubscriptionId, {
        cancel_at_period_end: !immediately,
        metadata: {
          cancelReason: immediately ? 'immediate' : 'end_of_period'
        }
      });

      // Update database record within transaction
      await withTransaction(async (client) => {
        const query = `
          UPDATE subscriptions 
          SET status = $1, 
              cancel_at_period_end = $2,
              updated_at = NOW()
          WHERE id = $3
        `;

        const values = [
          immediately ? 'CANCELED' : 'ACTIVE',
          !immediately,
          this.id
        ];

        return executeQuery(query, values);
      });
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Checks current usage against subscription tier limits
   * @requirement Rate Limiting - Different API rate limits based on subscription tier
   */
  public async checkUsage(featureType: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as usage_count
        FROM feature_usage
        WHERE subscription_id = $1
        AND feature_type = $2
        AND created_at > NOW() - INTERVAL '1 day'
      `;

      const usage = await executeQuery<{ usage_count: number }>(query, [
        this.id,
        featureType
      ]);

      // Get plan limits based on subscription tier
      const planLimits = await executeQuery(`
        SELECT limits
        FROM subscription_plans
        WHERE id = $1
      `, [this.planId]);

      return usage.usage_count < planLimits[featureType];
    } catch (error) {
      throw new Error(`Failed to check usage: ${error.message}`);
    }
  }
}