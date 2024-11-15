/**
 * Human Tasks:
 * 1. Configure Stripe publishable key in environment variables
 * 2. Set up webhook endpoint for subscription events
 * 3. Test payment form accessibility with screen readers
 * 4. Verify color contrast ratios meet WCAG 2.1 AA standards
 */

// react ^18.0.0
'use client'
import * as React from 'react'
// @stripe/stripe-react-components ^2.0.0
import { Elements } from '@stripe/stripe-react-components'

// Internal imports with relative paths
import PricingTable from '../../../components/subscription/PricingTable'
import PaymentForm from '../../../components/subscription/PaymentForm'
import { useSubscription } from '../../../hooks/useSubscription'

// Requirement: Design System Specifications (7.1.1)
const containerClasses = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'
const headingClasses = 'text-3xl font-bold tracking-tight text-gray-900 mb-8'
const statusClasses = 'text-sm font-medium text-gray-500 mb-4'
const alertClasses = 'p-4 rounded-md bg-blue-50 text-blue-700 mb-6'

// Requirement: Subscription System - Main subscription page component
const SubscriptionPage = () => {
  // Initialize subscription hook for state management
  const { subscription, isLoading } = useSubscription()
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null)
  const [showPaymentForm, setShowPaymentForm] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)

  // Requirement: Subscription System - Handle plan selection
  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    // Don't process if it's the current plan
    if (subscription?.currentPlan.id === plan.id) {
      setStatusMessage('You are already subscribed to this plan')
      return
    }

    // Set selected plan and show payment form
    setSelectedPlan(plan)
    setShowPaymentForm(true)
    
    // Requirement: Accessibility Requirements - ARIA live region update
    setStatusMessage(`Selected ${plan.name} plan - Please complete payment details`)
  }

  // Requirement: Subscription System - Handle successful payment
  const handlePaymentSuccess = async () => {
    setShowPaymentForm(false)
    setSelectedPlan(null)
    
    // Requirement: Accessibility Requirements - Success message
    setStatusMessage('Subscription updated successfully')
  }

  // Requirement: Subscription System - Handle payment cancellation
  const handlePaymentCancel = () => {
    setShowPaymentForm(false)
    setSelectedPlan(null)
    
    // Requirement: Accessibility Requirements - Cancellation message
    setStatusMessage('Payment cancelled')
  }

  // Requirement: Design System Specifications (7.1.1)
  return (
    <div className={containerClasses}>
      <h1 className={headingClasses}>Subscription Plans</h1>

      {/* Requirement: Accessibility Requirements - Status messages */}
      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className={alertClasses}
        >
          {statusMessage}
        </div>
      )}

      {/* Requirement: Subscription System - Current subscription status */}
      {subscription && !isLoading && (
        <div className={statusClasses}>
          Current plan: {subscription.currentPlan.name}
          {subscription.status === 'active' && (
            <span className="ml-2 text-green-600">
              (Active until {new Date(subscription.currentPeriodEnd).toLocaleDateString()})
            </span>
          )}
        </div>
      )}

      {/* Requirement: Rate Limiting (7.3.4) - Display plans with rate limits */}
      {!showPaymentForm ? (
        <PricingTable
          plans={[
            {
              id: 'free',
              name: 'Free',
              price: 0,
              features: ['60 requests/hour', '2 drills per type', 'Basic analytics'],
              stripePriceId: ''
            },
            {
              id: 'basic',
              name: 'Basic',
              price: 29,
              features: ['300 requests/hour', 'Unlimited drills', 'Advanced analytics'],
              stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID!
            },
            {
              id: 'premium',
              name: 'Premium',
              price: 99,
              features: ['1000 requests/hour', 'All features', 'Priority support'],
              stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID!
            }
          ]}
          onPlanSelect={handlePlanSelect}
        />
      ) : (
        // Requirement: Subscription System - Stripe payment integration
        <Elements
          stripe={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
          options={{
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#3B82F6',
                colorBackground: '#ffffff',
                colorText: '#0F172A',
                colorDanger: '#EF4444',
                fontFamily: 'Inter, system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '6px'
              }
            }
          }}
        >
          <PaymentForm
            selectedPlan={selectedPlan!}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </Elements>
      )}
    </div>
  )
}

export default SubscriptionPage