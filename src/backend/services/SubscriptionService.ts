// Human Tasks:
// 1. Configure Stripe webhook endpoint URL in production environment
// 2. Set up Stripe product IDs in environment variables
// 3. Verify subscription plan limits match business requirements
// 4. Configure rate limiting thresholds for each subscription tier

import { Stripe } from 'stripe'; // ^12.0.0
import { 
  SubscriptionModel, 
  create, 
  findById, 
  findByUserId, 
  update, 
  cancel, 
  checkUsage 
} from '../models/Subscription';
import { stripeClient, SUBSCRIPTION_PRODUCTS } from '../config/stripe';
import { 
  SubscriptionPlan, 
  Subscription 
} from '../types/subscription';

/**
 * Service class for managing subscription operations and Stripe integration
 * @requirement Subscription System - Tiered access control, payment processing, account management
 * @requirement Rate Limiting - Different API rate limits based on subscription tier
 */
export class SubscriptionService {
  private stripe: Stripe;
  private subscriptionProducts: Record<string, SubscriptionPlan>;

  constructor() {
    this.stripe = stripeClient;
    this.subscriptionProducts = SUBSCRIPTION_PRODUCTS;
  }

  /**
   * Creates a new subscription for a user
   * @requirement Subscription System - Payment processing integration
   */
  public async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string
  ): Promise<Subscription> {
    try {
      // Validate plan existence
      const plan = this.subscriptionProducts[planId];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Create or retrieve Stripe customer
      let customer = await this.findOrCreateCustomer(userId);

      // Attach payment method to customer
      if (paymentMethodId) {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });

        // Set as default payment method
        await this.stripe.customers.update(customer.id, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Create Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: plan.stripeProductId }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        metadata: {
          userId,
          planId,
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Create local subscription record
      const subscription = await create({
        id: stripeSubscription.id,
        userId,
        planId,
        status: 'ACTIVE',
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: customer.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: false,
      });

      return subscription;
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Updates an existing subscription
   * @requirement Subscription System - Account management
   */
  public async updateSubscription(
    subscriptionId: string,
    updateData: Partial<Subscription>
  ): Promise<Subscription> {
    try {
      // Validate subscription existence
      const existingSubscription = await findById(subscriptionId);
      if (!existingSubscription) {
        throw new Error('Subscription not found');
      }

      // Update Stripe subscription if plan changed
      if (updateData.planId) {
        const plan = this.subscriptionProducts[updateData.planId];
        if (!plan) {
          throw new Error('Invalid subscription plan');
        }

        await this.stripe.subscriptions.update(existingSubscription.stripeSubscriptionId, {
          items: [
            {
              id: existingSubscription.stripeSubscriptionId,
              price: plan.stripeProductId,
            },
          ],
          metadata: {
            planId: updateData.planId,
          },
        });
      }

      // Update local subscription record
      const updatedSubscription = await update(subscriptionId, updateData);
      return updatedSubscription;
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  /**
   * Cancels a subscription
   * @requirement Subscription System - Account management
   */
  public async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<void> {
    try {
      // Validate subscription existence
      const subscription = await findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Cancel Stripe subscription
      if (immediately) {
        await this.stripe.subscriptions.del(subscription.stripeSubscriptionId);
      } else {
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Update local subscription record
      await cancel(subscriptionId, immediately);
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Retrieves current usage metrics for a subscription
   * @requirement Rate Limiting - Different API rate limits based on subscription tier
   */
  public async getSubscriptionUsage(subscriptionId: string): Promise<SubscriptionUsage> {
    try {
      // Get subscription details
      const subscription = await findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get plan limits
      const plan = this.subscriptionProducts[subscription.planId];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Check current usage
      const usage = await checkUsage(subscriptionId);

      return {
        subscriptionId,
        drillAttempts: usage.drillAttempts,
        simulationAttempts: usage.simulationAttempts,
        apiRequests: usage.apiRequests,
        limits: plan.limits,
        period: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to get subscription usage: ${error.message}`);
    }
  }

  /**
   * Handles Stripe webhook events for subscription updates
   * @private
   */
  private async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
      }
    } catch (error) {
      throw new Error(`Failed to handle webhook: ${error.message}`);
    }
  }

  /**
   * Creates or retrieves a Stripe customer for a user
   * @private
   */
  private async findOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      // Check for existing subscription
      const existingSubscription = await findByUserId(userId);
      if (existingSubscription?.stripeCustomerId) {
        return await this.stripe.customers.retrieve(
          existingSubscription.stripeCustomerId
        ) as Stripe.Customer;
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        metadata: {
          userId,
        },
      });

      return customer;
    } catch (error) {
      throw new Error(`Failed to find or create customer: ${error.message}`);
    }
  }

  /**
   * Handles subscription updated webhook event
   * @private
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const userId = subscription.metadata.userId;
    const planId = subscription.metadata.planId;

    await update(subscription.id, {
      status: subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planId,
    });
  }

  /**
   * Handles subscription canceled webhook event
   * @private
   */
  private async handleSubscriptionCanceled(
    subscription: Stripe.Subscription
  ): Promise<void> {
    await update(subscription.id, {
      status: 'CANCELED',
      cancelAtPeriodEnd: false,
    });
  }

  /**
   * Handles payment failed webhook event
   * @private
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      await update(invoice.subscription as string, {
        status: 'PAYMENT_FAILED',
      });
    }
  }
}