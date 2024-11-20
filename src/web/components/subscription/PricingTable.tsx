/**
 * Human Tasks:
 * 1. Verify responsive layout breakpoints match design system specifications
 * 2. Test loading states and error handling with Stripe integration
 * 3. Validate subscription plan data structure with backend API
 */

// react ^18.0.0
import * as React from 'react'
// class-variance-authority ^0.7.0
import { cn } from 'class-variance-authority'

// Internal imports with relative paths
import PlanCard from './PlanCard'
import { useSubscription } from '../../hooks/useSubscription'
import type { SubscriptionPlan } from '../../types/subscription'

// Requirement: Design System Specifications (7.1.1)
interface PricingTableProps {
  plans: SubscriptionPlan[]
  className?: string
}

// Requirement: Subscription System - Tiered access control and payment processing
export const PricingTable: React.FC<PricingTableProps> = ({ plans, className }) => {
  // Initialize subscription hook for state management
  const { subscription, updateSubscription, isLoading } = useSubscription()

  // Requirement: Subscription System - Handle plan selection and payment processing
  const handlePlanSelect = React.useCallback(
    async (plan: SubscriptionPlan) => {
      // Don't process if it's the current plan
      if (subscription?.currentPlan.id === plan.id) {
        return
      }

      try {
        await updateSubscription(plan)
      } catch (error) {
        console.error('Failed to update subscription:', error)
      }
    },
    [subscription, updateSubscription]
  )

  // Requirement: Design System Specifications (7.1.1)
  // Apply responsive grid layout using design system tokens
  const containerClasses = cn(
    'grid gap-6',
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    className
  )

  return (
    <div
      className={containerClasses}
      role="radiogroup"
      aria-label="Subscription plans"
    >
      {/* Requirement: Rate Limiting (7.3.4) */}
      {/* Display plans with their respective rate limits and features */}
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isSelected={subscription?.currentPlan.id === plan.id}
          isLoading={isLoading && subscription?.currentPlan.id === plan.id}
          onSelect={() => handlePlanSelect(plan)}
        />
      ))}
    </div>
  )
}

export default PricingTable