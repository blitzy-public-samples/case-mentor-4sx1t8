/**
 * Human Tasks:
 * 1. Set up Stripe publishable key in environment variables
 * 2. Configure Stripe webhook endpoint for subscription events
 * 3. Test payment form with screen readers for accessibility
 * 4. Verify color contrast ratios meet WCAG 2.1 AA standards
 */

import * as React from 'react' // ^18.0.0
import { Elements, CardElement, useStripe } from '@stripe/stripe-react-components' // ^2.0.0
import { buttonVariants } from '../shared/Button'
import { useSubscription } from '../../hooks/useSubscription'
import type { SubscriptionPlan } from '../../types/subscription'

// Requirement: Subscription System - Payment processing interface
interface PaymentFormProps {
  selectedPlan: SubscriptionPlan
  onSuccess: () => void
  onCancel: () => void
}

// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant styling
const cardElementStyles = {
  base: {
    fontSize: '16px',
    color: '#0F172A',
    '::placeholder': {
      color: '#64748B',
    },
    ':focus': {
      outline: '2px solid #3B82F6',
      outlineOffset: '2px',
    },
  },
  invalid: {
    color: '#EF4444',
    ':focus': {
      outline: '2px solid #EF4444',
    },
  },
}

// Requirement: Subscription System - Stripe integration for secure transactions
export const PaymentForm: React.FC<PaymentFormProps> = ({
  selectedPlan,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe()
  const { updateSubscription } = useSubscription()
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Requirement: Accessibility Requirements - Keyboard navigation
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const target = event.target as HTMLElement
      if (target.getAttribute('role') === 'button') {
        target.click()
      }
    }
  }

  // Requirement: Subscription System - Payment processing and error handling
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe) {
      setError('Stripe failed to initialize. Please try again.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create payment method with Stripe
      const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
        type: 'card',
        card: CardElement,
        billing_details: {
          email: '', // Email is handled by Stripe Checkout
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method')
      }

      // Process subscription update
      const result = await updateSubscription(selectedPlan)

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update subscription')
      }

      // Trigger success callback
      onSuccess()
    } catch (err) {
      setError((err as Error).message)
      // Requirement: Accessibility Requirements - Error handling with ARIA
      const errorRegion = document.getElementById('payment-error')
      if (errorRegion) {
        errorRegion.focus()
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    // Requirement: Accessibility Requirements - Semantic HTML and ARIA labels
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6"
      aria-label="Payment form"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="card-element"
            className="block text-sm font-medium text-gray-700"
          >
            Card details
          </label>
          <div
            id="card-element"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <CardElement
              options={{
                style: cardElementStyles,
                aria: {
                  label: 'Credit or debit card input',
                },
              }}
            />
          </div>
        </div>

        {/* Requirement: Accessibility Requirements - Error message handling */}
        {error && (
          <div
            id="payment-error"
            role="alert"
            aria-live="polite"
            className="text-red-600 text-sm"
            tabIndex={-1}
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-between space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className={buttonVariants({
              variant: 'ghost',
              size: 'lg',
              className: 'w-full',
            })}
            disabled={isProcessing}
            aria-label="Cancel payment"
            onKeyDown={handleKeyPress}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={buttonVariants({
              variant: 'primary',
              size: 'lg',
              className: 'w-full',
            })}
            disabled={isProcessing}
            aria-label={`Pay ${selectedPlan.price} for ${selectedPlan.name} plan`}
            aria-busy={isProcessing}
            onKeyDown={handleKeyPress}
          >
            {isProcessing ? 'Processing...' : `Pay $${selectedPlan.price}`}
          </button>
        </div>
      </div>

      {/* Requirement: Accessibility Requirements - Processing status */}
      {isProcessing && (
        <div
          role="status"
          aria-live="polite"
          className="text-center text-sm text-gray-600"
        >
          Processing your payment...
        </div>
      )}
    </form>
  )
}