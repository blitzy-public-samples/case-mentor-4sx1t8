/**
 * Human Tasks:
 * 1. Verify @radix-ui/react-tooltip ^1.0.0 is installed in package.json
 * 2. Ensure class-variance-authority ^0.7.0 is installed in package.json
 * 3. Verify Inter and Roboto Mono fonts are properly loaded in the application
 */

// React ^18.0.0
import React, { useState, useEffect, useCallback } from 'react';
// @radix-ui/react-tooltip ^1.0.0
import * as RadixTooltip from '@radix-ui/react-tooltip';
// class-variance-authority ^0.7.0
import { cn } from 'class-variance-authority';
import { shadows, colors } from '../../config/theme';

// Requirement: Accessibility Requirements (7.1.4)
// Interface defining props with ARIA and WCAG compliance
export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  className?: string;
}

// Requirement: Design System Specifications (7.1.1)
// Utility function to calculate optimal tooltip position
const getTooltipPosition = (triggerRect: DOMRect, tooltipRect: DOMRect) => {
  const padding = 8; // Safe distance from viewport edges
  const offset = 4; // Offset from trigger element

  let top = triggerRect.top - tooltipRect.height - offset;
  let left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;

  // Ensure tooltip stays within viewport bounds
  if (top < padding) {
    top = triggerRect.bottom + offset; // Flip to bottom
  }
  if (left < padding) {
    left = padding;
  } else if (left + tooltipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width - padding;
  }

  return { top, left };
};

// Requirement: Accessibility Requirements (7.1.4) & Design System Specifications (7.1.1)
// Main tooltip component implementing WCAG 2.1 AA standards
export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 200,
  className
}) => {
  const [mounted, setMounted] = useState(false);

  // Handle SSR hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Requirement: Accessibility Requirements (7.1.4)
  // Handle keyboard interactions for accessibility
  const handleKeyboardInteraction = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      // Close tooltip on ESC key
      const trigger = document.activeElement as HTMLElement;
      trigger?.blur();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardInteraction);
    return () => {
      document.removeEventListener('keydown', handleKeyboardInteraction);
    };
  }, [handleKeyboardInteraction]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <RadixTooltip.Provider delayDuration={delay}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          {/* Requirement: Accessibility Requirements (7.1.4) */}
          {/* Wrap children with proper ARIA attributes */}
          <span
            role="button"
            tabIndex={0}
            aria-describedby="tooltip-content"
          >
            {children}
          </span>
        </RadixTooltip.Trigger>

        {/* Requirement: Design System Specifications (7.1.1) */}
        {/* Apply consistent design system tokens for styling */}
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={position}
            sideOffset={4}
            className={cn(
              // Base styles
              'z-50 overflow-hidden rounded-md',
              'bg-white dark:bg-gray-800',
              'px-3 py-2 text-sm',
              // Animation
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              // Shadow and border
              'shadow-sm',
              // Design system colors
              `text-${colors.primary.base} dark:text-white`,
              // Custom classes
              className
            )}
            style={{
              boxShadow: shadows.sm,
            }}
            id="tooltip-content"
          >
            {content}
            <RadixTooltip.Arrow 
              className="fill-white dark:fill-gray-800" 
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

// Set display name for debugging
Tooltip.displayName = 'Tooltip';