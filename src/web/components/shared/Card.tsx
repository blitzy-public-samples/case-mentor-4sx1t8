/**
 * Human Tasks:
 * 1. Verify that @shadcn/ui is installed and configured in the project
 * 2. Ensure all color contrast ratios meet WCAG 2.1 AA standards (4.5:1 minimum)
 * 3. Test focus states with keyboard navigation
 */

// react v18.0.0
import * as React from 'react'
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority'
import { shadows, spacing } from '../../config/theme'

// Requirement: Design System Specifications (7.1.1)
// Interface for card style variants using design system tokens
interface CardVariantsProps {
  shadow?: 'sm' | 'md' | 'lg'
  padding?: 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

// Requirement: Design System Specifications (7.1.1)
// Maps padding sizes to theme spacing values
const paddingMap = {
  sm: spacing[1], // 8px
  md: spacing[2], // 12px
  lg: spacing[3]  // 16px
}

// Requirement: Component Library (7.1.2)
// Generates consistent class variants for card styling
export const cardVariants = ({
  shadow = 'md',
  padding = 'md',
  hoverable = false
}: CardVariantsProps = {}) => {
  return cn(
    // Base styles
    'rounded-lg bg-white',
    // Shadow variants from theme
    {
      [shadows.sm]: shadow === 'sm',
      [shadows.md]: shadow === 'md',
      [shadows.lg]: shadow === 'lg'
    },
    // Padding variants from theme
    {
      [`p-${paddingMap[padding]}`]: padding
    },
    // Hover state with smooth transition
    {
      'transition-shadow duration-200': hoverable,
      'hover:shadow-lg': hoverable
    }
  )
}

// Requirement: Component Library (7.1.2)
// Props interface for Card component
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  shadow?: 'sm' | 'md' | 'lg'
  padding?: 'sm' | 'md' | 'lg'
}

// Requirement: Component Library (7.1.2), Accessibility Requirements (7.1.4)
// Core card component with WCAG 2.1 AA compliance
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      hoverable = false,
      shadow = 'md',
      padding = 'md',
      ...props
    },
    ref
  ) => {
    // Requirement: Accessibility Requirements (7.1.4)
    // Add interactive attributes for hoverable cards
    const interactiveProps = hoverable
      ? {
          role: 'button',
          tabIndex: 0,
          'aria-pressed': undefined,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              props.onClick?.(e as any)
            }
          }
        }
      : { role: 'article' }

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ shadow, padding, hoverable }),
          className
        )}
        {...interactiveProps}
        {...props}
      >
        {children}
      </div>
    )
  }
)

// Requirement: Accessibility Requirements (7.1.4)
// Set display name for React DevTools and debugging
Card.displayName = 'Card'

export default Card