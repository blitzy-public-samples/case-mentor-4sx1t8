// @package react ^18.0.0
// @package @headlessui/react ^1.7.0
// @package framer-motion ^10.0.0

// Human Tasks:
// 1. Verify modal focus management with screen readers
// 2. Test modal animations on low-performance devices
// 3. Validate color contrast ratios in dark mode
// 4. Test modal behavior with dynamic content heights

import React from 'react';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Button, type ButtonProps } from './button';
import { formatError } from '../../lib/utils';

export interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  className?: string;
  initialFocus?: React.RefObject<HTMLElement>;
}

// Requirement: Design System Specifications - Consistent modal styling
const BASE_CLASSES = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50';

// Requirement: Design System Specifications - Consistent spacing scale
const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl'
};

// Animation variants for modal transitions
const ANIMATION_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant modal component
export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      children,
      isOpen,
      onClose,
      title,
      size = 'md',
      showCloseButton = true,
      className = '',
      initialFocus
    },
    ref
  ) => {
    // Handle Escape key press for closing modal
    const handleEscapeKeydown = React.useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      },
      [onClose]
    );

    // Add event listener for Escape key
    React.useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleEscapeKeydown);
        return () => {
          document.removeEventListener('keydown', handleEscapeKeydown);
        };
      }
    }, [isOpen, handleEscapeKeydown]);

    return (
      <Dialog
        as={motion.div}
        ref={ref}
        open={isOpen}
        onClose={onClose}
        className={BASE_CLASSES}
        initialFocus={initialFocus}
        // Requirement: Accessibility Requirements - Focus management
        static
      >
        {/* Animated backdrop */}
        <Dialog.Overlay
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50"
          aria-hidden="true"
        />

        {/* Modal content */}
        <motion.div
          className={`relative w-full ${SIZE_CLASSES[size]} bg-white dark:bg-gray-800 rounded-lg shadow-xl ${className}`}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={ANIMATION_VARIANTS}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              // Requirement: Accessibility Requirements - ARIA attributes
              id="modal-title"
            >
              {title}
            </Dialog.Title>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <Dialog.Description className="text-gray-700 dark:text-gray-300">
              {children}
            </Dialog.Description>
          </div>
        </motion.div>
      </Dialog>
    );
  }
);

Modal.displayName = 'Modal';