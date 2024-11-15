/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards (4.5:1 minimum)
 * 2. Test keyboard navigation and focus states
 * 3. Validate ARIA labels with screen readers
 */

// react v18.0.0
import * as React from 'react'
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority'

// Internal imports with relative paths
import Card from '../shared/Card'
import Button from '../shared/Button'
import { SubscriptionPlan } from '../../types/subscription'
import { useSubscription } from '../../hooks/useSubscription'

// Requirement: Design System Specifications (7.1.1)
// Interface for component props
interface PlanCardProps {
  plan: SubscriptionPlan
  isSelected?: boolean
  isLoading?: boolean
  onSelect?: () => void
}

// Requirement: Subscription System - Tiered access control with Free, Basic, and Premium plans
const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isSelected = false,
  isLoading: externalLoading = false,
  onSelect
}) => {
  // Initialize subscription hook for state management
  const { updateSubscription, isLoading: subscriptionLoading } = useSubscription()
  const [localLoading, setLocalLoading] = React.useState(false)

  // Combine loading states
  const isLoading = externalLoading || subscriptionLoading || localLoading

  // Requirement: Subscription System - Payment processing integration
  const handleSelect = async () => {
    if (isSelected || isLoading) return

    try {
      setLocalLoading(true)
      await updateSubscription(plan)
      onSelect?.()
    } catch (error) {
      console.error('Failed to update subscription:', error)
    } finally {
      setLocalLoading(false)
    }
  }

  // Requirement: Design System Specifications (7.1.1)
  // Apply consistent styling using design system tokens
  const cardClasses = cn(
    'relative flex flex-col p-6 transition-all duration-200',
    isSelected && 'ring-2 ring-primary-500',
    !isSelected && 'hover:scale-[1.02]'
  )

  // Requirement: Accessibility Requirements (7.1.4)
  // Render features list with proper ARIA attributes
  const renderFeatures = () => (
    <ul
      className="mt-6 space-y-4 text-sm text-gray-600"
      role="list"
      aria-label={`Features included in ${plan.name} plan`}
    >
      {plan.features.map((feature, index) => (
        <li
          key={index}
          className="flex items-center"
          role="listitem"
        >
          <svg
            className="h-5 w-5 text-primary-500"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="ml-3">{feature}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <Card
      className={cardClasses}
      hoverable={!isSelected}
      aria-selected={isSelected}
      role="radio"
    >
      {/* Requirement: Design System Specifications (7.1.1) */}
      {/* Plan header with consistent typography */}
      <div className="flex-1">
        <h3 className="text-2xl font-semibold text-gray-900">
          {plan.name}
        </h3>
        <p className="mt-2 text-base text-gray-500">
          {plan.description}
        </p>
        <p className="mt-4">
          <span className="text-4xl font-bold text-gray-900">
            ${plan.price}
          </span>
          <span className="text-base text-gray-500">/month</span>
        </p>

        {renderFeatures()}
      </div>

      {/* Requirement: Accessibility Requirements (7.1.4) */}
      {/* Action button with proper ARIA attributes */}
      <Button
        className="mt-8 w-full"
        variant={isSelected ? 'secondary' : 'primary'}
        size="lg"
        onClick={handleSelect}
        disabled={isSelected || isLoading}
        isLoading={isLoading}
        ariaLabel={`${isSelected ? 'Current plan:' : 'Select'} ${plan.name}`}
      >
        {isSelected ? 'Current Plan' : 'Select Plan'}
      </Button>

      {/* Requirement: Accessibility Requirements (7.1.4) */}
      {/* Visual indicator for selected plan */}
      {isSelected && (
        <div
          className="absolute -top-2 -right-2 rounded-full bg-primary-500 p-1"
          aria-hidden="true"
        >
          <svg
            className="h-4 w-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </Card>
  )
}

export default PlanCard