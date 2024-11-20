/**
 * Human Tasks:
 * 1. Verify that all required dependencies are installed in package.json with correct versions:
 *    - react ^18.0.0
 *    - class-variance-authority ^0.7.0
 *    - @radix-ui/react-slot ^1.0.0
 * 2. Ensure tailwind.config.js includes the theme configuration
 * 3. Test color contrast ratios using automated accessibility tools
 */

import * as React from 'react' // ^18.0.0
import { cn } from 'class-variance-authority' // ^0.7.0
import { Slot } from '@radix-ui/react-slot' // ^1.0.0
import { colors, shadows } from '../../config/theme'

// Requirement: Design System Implementation (7.1.1)
// Interface defining button component props with comprehensive type safety
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  asChild?: boolean
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}

// Requirement: Design System Implementation (7.1.1)
// Generates button variant classes using theme tokens
export const buttonVariants = ({
  variant = 'default',
  size = 'md',
  className = ''
}: {
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
} = {}) => {
  // Base styles with focus and disabled states
  const baseStyles = `
    inline-flex items-center justify-center
    rounded-md font-medium
    transition-colors duration-200
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-offset-2 focus-visible:ring-${colors.primary.base}
    disabled:pointer-events-none disabled:opacity-50
  `

  // Requirement: Accessibility Requirements (7.1.4)
  // Variant-specific styles with WCAG compliant colors
  const variantStyles = {
    default: `
      bg-white text-${colors.primary.base}
      border border-${colors.primary.base}
      hover:bg-gray-50 active:bg-gray-100
      ${shadows.sm}
    `,
    primary: `
      bg-${colors.primary.base} text-white
      hover:bg-${colors.primary.hover}
      active:bg-${colors.primary.active}
      ${shadows.md}
    `,
    secondary: `
      bg-${colors.secondary.base} text-white
      hover:bg-${colors.secondary.hover}
      active:bg-${colors.secondary.active}
      ${shadows.sm}
    `,
    ghost: `
      bg-transparent text-${colors.primary.base}
      hover:bg-gray-50 active:bg-gray-100
      shadow-none
    `,
    link: `
      bg-transparent text-${colors.primary.base}
      underline-offset-4 hover:underline
      shadow-none
    `
  }

  // Size-specific styles using theme spacing
  const sizeStyles = {
    xs: 'h-8 px-3 text-xs',
    sm: 'h-9 px-4 text-sm',
    md: 'h-10 px-5 text-base',
    lg: 'h-11 px-6 text-lg'
  }

  return cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className
  )
}

// Requirement: Component Library (7.1.2)
// Main button component implementing shadcn/ui patterns
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'default',
      size = 'md',
      asChild = false,
      isLoading = false,
      disabled = false,
      onClick,
      type = 'button',
      ariaLabel,
      ...props
    },
    ref
  ) => {
    // Handle component polymorphism
    const Comp = asChild ? Slot : 'button'
    
    // Requirement: Accessibility Requirements (7.1.4)
    // Implement keyboard navigation and ARIA attributes
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onClick?.()
      }
    }

    return (
      <Comp
        ref={ref}
        type={type}
        className={buttonVariants({
          variant,
          size,
          className
        })}
        disabled={isLoading || disabled}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-disabled={disabled || isLoading}
        role="button"
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        {isLoading ? (
          // Requirement: Accessibility Requirements (7.1.4)
          // Loading indicator with proper ARIA attributes
          <span
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : null}
        {children}
      </Comp>
    )
  }
)

Button.displayName = 'Button'