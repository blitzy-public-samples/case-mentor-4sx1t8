// @package react ^18.0.0
// @package class-variance-authority ^0.7.0

// Human Tasks:
// 1. Verify contrast ratios of card variants against different background colors
// 2. Test keyboard navigation and focus states for interactive cards
// 3. Validate card rendering performance with large content blocks

import React from 'react';
import { cn } from 'class-variance-authority';
import { shadows, spacing, colors } from '../../config/theme';

// Requirement: Design System Specifications - Core component props interface
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onClick?: () => void;
}

// Requirement: Design System Specifications - Consistent visual styling
const cardVariants = {
  default: 'bg-white rounded-lg',
  bordered: `bg-white rounded-lg border border-[${colors.gray[200]}]`,
  elevated: `bg-white rounded-lg ${shadows.md}`
};

// Requirement: Design System Specifications - Consistent spacing scale
const paddingVariants = {
  none: 'p-0',
  small: `p-[${spacing[4]}]`,
  medium: `p-[${spacing[6]}]`,
  large: `p-[${spacing[8]}]`
};

// Requirement: Design System Specifications & Accessibility Requirements
export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'medium',
  onClick
}) => {
  // Base styles that apply to all cards
  const baseStyles = 'transition-shadow duration-200';

  // Compose classes using class-variance-authority
  const cardClasses = cn(
    baseStyles,
    cardVariants[variant],
    paddingVariants[padding],
    // Add hover state for interactive cards
    onClick && 'cursor-pointer hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light',
    className
  );

  // Requirement: Accessibility Requirements - Semantic HTML and ARIA attributes
  const CardElement = onClick ? 'button' : 'div';
  const ariaProps = onClick ? {
    role: 'button',
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Space') {
        e.preventDefault();
        onClick();
      }
    }
  } : {};

  return (
    <CardElement
      className={cardClasses}
      onClick={onClick}
      {...ariaProps}
    >
      {children}
    </CardElement>
  );
};

export type { CardProps };