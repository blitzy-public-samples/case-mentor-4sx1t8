// Human Tasks:
// 1. Set up Stripe webhook endpoint in production environment
// 2. Configure Stripe product IDs in environment variables
// 3. Verify webhook signature secret is securely stored
// 4. Set up monitoring for failed payments and subscription events
// 5. Configure automatic retry settings for failed payments

import Stripe from 'stripe'; // ^12.0.0
import { stripeConfig, stripeClient, SUBSCRIPTION_PRODUCTS, WEBHOOK_EVENTS } from '../../config/stripe';
import { SubscriptionPlan, Subscription } from '../../types/subscription';
import { APIError } from '../errors/APIError';

/**
 * Creates a new Stripe customer for a user
 * @requirement Subscription System - Customer management
 */
export const createCustomer = async (
  email: string,
  name: string
): Promise<Stripe.Customer> => {
  try {
    const customer = await stripeClient.customers.create({
      email,
      name,
      metadata: {
        platform: 'case-interview-practice'
      }
    });
    return customer;
  } catch (error) {
    throw new APIError(
      'STRIPE_ERROR',
      'Failed to create customer',
      { error },
      'stripe-create-customer'
    );
  }
};

/**
 * Creates a new subscription for a customer
 * @requirement Subscription System - Payment processing
 */
export const createSubscription = async (
  customerId: string,
  priceId: string,
  paymentMethod: Stripe.PaymentMethod
): Promise<Stripe.Subscription> => {
  try {
    // Attach payment method to customer
    await stripeClient.paymentMethods.attach(paymentMethod.id, {
      customer: customerId,
    });

    // Set as default payment method
    await stripeClient.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    // Create the subscription
    const subscription = await stripeClient.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    throw new APIError(
      'STRIPE_ERROR',
      'Failed to create subscription',
      { error },
      'stripe-create-subscription'
    );
  }
};

/**
 * Updates an existing subscription
 * @requirement Subscription System - Subscription lifecycle management
 */
export const updateSubscription = async (
  subscriptionId: string,
  params: Stripe.SubscriptionUpdateParams
): Promise<Stripe.Subscription> => {
  try {
    const subscription = await stripeClient.subscriptions.update(
      subscriptionId,
      {
        ...params,
        proration_behavior: 'create_prorations',
      }
    );
    return subscription;
  } catch (error) {
    throw new APIError(
      'STRIPE_ERROR',
      'Failed to update subscription',
      { error },
      'stripe-update-subscription'
    );
  }
};

/**
 * Cancels an active subscription
 * @requirement Subscription System - Subscription lifecycle management
 */
export const cancelSubscription = async (
  subscriptionId: string,
  cancelImmediately: boolean = false
): Promise<Stripe.Subscription> => {
  try {
    const subscription = await stripeClient.subscriptions.update(subscriptionId, {
      cancel_at_period_end: !cancelImmediately,
      ...(cancelImmediately && { status: 'canceled' }),
    });
    return subscription;
  } catch (error) {
    throw new APIError(
      'STRIPE_ERROR',
      'Failed to cancel subscription',
      { error },
      'stripe-cancel-subscription'
    );
  }
};

/**
 * Creates a payment intent for subscription payment
 * @requirement Payment Processing - Secure payment handling
 */
export const createPaymentIntent = async (
  customerId: string,
  amount: number,
  currency: string
): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        platform: 'case-interview-practice'
      }
    });
    return paymentIntent;
  } catch (error) {
    throw new APIError(
      'STRIPE_ERROR',
      'Failed to create payment intent',
      { error },
      'stripe-create-payment-intent'
    );
  }
};

/**
 * Validates Stripe webhook signatures
 * @requirement Payment Processing - Secure webhook handling
 */
export const validateWebhookSignature = async (
  payload: Buffer,
  signature: string
): Promise<boolean> => {
  try {
    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      stripeConfig.webhookSecret
    );
    return true;
  } catch (error) {
    throw new APIError(
      'STRIPE_ERROR',
      'Invalid webhook signature',
      { error },
      'stripe-validate-webhook'
    );
  }
};

interface WebhookResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

/**
 * Processes incoming Stripe webhooks securely
 * @requirement Payment Processing - Webhook processing
 */
export const handleWebhook = async (
  rawBody: Buffer,
  signature: string
): Promise<WebhookResponse> => {
  try {
    // Validate webhook signature
    const event = stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      stripeConfig.webhookSecret
    );

    // Process different webhook events
    switch (event.type) {
      case WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
        return {
          status: 'success',
          message: 'Subscription created successfully',
          data: event.data.object
        };

      case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
        return {
          status: 'success',
          message: 'Subscription updated successfully',
          data: event.data.object
        };

      case WEBHOOK_EVENTS.SUBSCRIPTION_DELETED:
        return {
          status: 'success',
          message: 'Subscription cancelled successfully',
          data: event.data.object
        };

      case WEBHOOK_EVENTS.PAYMENT_SUCCEEDED:
        return {
          status: 'success',
          message: 'Payment processed successfully',
          data: event.data.object
        };

      case WEBHOOK_EVENTS.PAYMENT_FAILED:
        return {
          status: 'error',
          message: 'Payment failed',
          data: event.data.object
        };

      default:
        return {
          status: 'success',
          message: `Unhandled event type: ${event.type}`,
          data: event.data.object
        };
    }
  } catch (error) {
    throw new APIError(
      'STRIPE_ERROR',
      'Failed to process webhook',
      { error },
      'stripe-process-webhook'
    );
  }
};