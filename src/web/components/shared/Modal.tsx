/**
 * Human Tasks:
 * 1. Verify that all required dependencies are installed in package.json with correct versions:
 *    - react ^18.0.0
 * 2. Ensure Dialog component is properly configured with ARIA attributes
 * 3. Test modal interactions with screen readers
 * 4. Verify keyboard navigation and focus management
 */

import * as React from 'react' // ^18.0.0
import { Dialog } from './Dialog'
import { buttonVariants } from './Button'
import { cn } from 'class-variance-authority' // ^0.7.0

// Requirement: Design System Implementation (7.1.1)
// Interface defining modal component props with comprehensive type safety
interface ModalProps {
  children: React.ReactNode
  className?: string
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  modal?: boolean
}

// Requirement: Component Library (7.1.2)
// Core modal component used throughout the application
const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({
    children,
    className,
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    showCloseButton = true,
    modal = true,
    ...props
  }, ref) => {
    // Requirement: Design System Implementation (7.1.1)
    // Size-specific classes using design system tokens
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl'
    }

    // Requirement: Accessibility Requirements (7.1.4)
    // Handle keyboard interactions for accessibility
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    return (
      <Dialog.Root
        open={isOpen}
        onOpenChange={onClose}
        modal={modal}
      >
        <Dialog.Content
          ref={ref}
          className={cn(
            // Base modal styling
            'fixed left-[50%] top-[50%] z-50',
            'w-full translate-x-[-50%] translate-y-[-50%]',
            // Size-specific classes
            sizeClasses[size],
            // Animation classes
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
            'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]',
            className
          )}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {/* Requirement: Design System Implementation (7.1.1) */}
          {/* Title with design system typography */}
          {title && (
            <div className="mb-4 text-lg font-semibold leading-none tracking-tight text-gray-900">
              {title}
            </div>
          )}

          {/* Requirement: Design System Implementation (7.1.1) */}
          {/* Description with design system typography */}
          {description && (
            <div className="mb-5 text-sm text-gray-600">
              {description}
            </div>
          )}

          {/* Modal content */}
          {children}

          {/* Requirement: Accessibility Requirements (7.1.4) */}
          {/* Close button with ARIA attributes */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'absolute right-4 top-4',
                'rounded-sm opacity-70 ring-offset-white',
                'transition-opacity hover:opacity-100',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                'focus:ring-offset-2 disabled:pointer-events-none'
              )}
              aria-label="Close modal"
            >
              <span className="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </Dialog.Content>
      </Dialog.Root>
    )
  }
)

// Set display name for debugging
Modal.displayName = 'Modal'

export { Modal, type ModalProps }