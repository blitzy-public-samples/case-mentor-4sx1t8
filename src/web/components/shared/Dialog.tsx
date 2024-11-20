/**
 * Human Tasks:
 * 1. Verify that all required dependencies are installed in package.json with correct versions:
 *    - react ^18.0.0
 *    - @radix-ui/react-dialog ^1.0.0
 *    - class-variance-authority ^0.7.0
 * 2. Ensure tailwind.config.js includes the theme configuration
 * 3. Test dialog interactions with screen readers
 * 4. Verify keyboard navigation and focus management
 */

import * as React from 'react' // ^18.0.0
import * as DialogPrimitive from '@radix-ui/react-dialog' // ^1.0.0
import { cn } from 'class-variance-authority' // ^0.7.0
import { buttonVariants } from './Button'

// Requirement: Design System Implementation (7.1.1)
// Define comprehensive type-safe props interfaces
interface DialogProps {
  children: React.ReactNode
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  showCloseButton?: boolean
}

// Requirement: Component Library (7.1.2)
// Root dialog component following shadcn/ui patterns
const Dialog = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Root>,
  DialogProps
>(({ children, open, onOpenChange, modal = true, ...props }, ref) => (
  <DialogPrimitive.Root
    ref={ref}
    open={open}
    onOpenChange={onOpenChange}
    modal={modal}
    {...props}
  >
    {children}
  </DialogPrimitive.Root>
))
Dialog.displayName = 'Dialog'

// Requirement: Accessibility Requirements (7.1.4)
// Accessible trigger component with proper ARIA attributes
const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>(({ children, ...props }, ref) => (
  <DialogPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center',
      'focus:outline-none focus-visible:ring-2',
      'focus-visible:ring-offset-2 focus-visible:ring-primary'
    )}
    {...props}
  >
    {children}
  </DialogPrimitive.Trigger>
))
DialogTrigger.displayName = 'DialogTrigger'

// Requirement: Design System Implementation (7.1.1)
// Overlay with design system colors and animations
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = 'DialogOverlay'

// Requirement: Component Library (7.1.2) & Accessibility Requirements (7.1.4)
// Main content component with WCAG compliant styling and interactions
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ children, className, title, description, showCloseButton = true, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Layout and positioning
        'fixed left-[50%] top-[50%] z-50',
        'w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
        // Visual styling
        'rounded-lg border bg-white p-6 shadow-lg',
        // Animations
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
        'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]',
        className
      )}
      {...props}
    >
      {title && (
        <DialogPrimitive.Title
          className={cn(
            'text-lg font-semibold leading-none tracking-tight',
            'mb-4 text-gray-900'
          )}
        >
          {title}
        </DialogPrimitive.Title>
      )}
      
      {description && (
        <DialogPrimitive.Description
          className={cn(
            'text-sm text-gray-600',
            'mb-5'
          )}
        >
          {description}
        </DialogPrimitive.Description>
      )}
      
      {children}
      
      {showCloseButton && (
        <DialogPrimitive.Close
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'absolute right-4 top-4',
            'rounded-sm opacity-70 ring-offset-white',
            'transition-opacity hover:opacity-100',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            'focus:ring-offset-2 disabled:pointer-events-none'
          )}
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
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = 'DialogContent'

// Requirement: Component Library (7.1.2)
// Close button component with design system styling
const DialogClose = DialogPrimitive.Close

// Export all dialog components
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  type DialogProps,
  type DialogContentProps,
}