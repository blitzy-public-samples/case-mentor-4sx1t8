// react version: ^18.0.0
// class-variance-authority version: ^0.7.0
// framer-motion version: ^10.0.0

import React, { useEffect } from 'react';
import { cn } from 'class-variance-authority';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastType, showToast, hideToast } from '../../hooks/use-toast';
import { formatError } from '../../lib/utils';

/**
 * Human Tasks:
 * 1. Verify toast animations perform well on low-end devices
 * 2. Test screen reader announcements for all toast types
 * 3. Validate color contrast ratios meet WCAG 2.1 AA standards
 * 4. Confirm toast positioning works across all breakpoints
 */

// Toast variant styles using class-variance-authority
const toastVariants = cn(
  'fixed flex items-center w-full max-w-sm rounded-lg shadow-lg p-4 text-white',
  {
    variants: {
      type: {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-yellow-600',
      },
    },
  }
);

// Animation variants for toast notifications
const toastAnimation = {
  initial: { opacity: 0, y: 50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
};

/**
 * @requirement Accessibility Requirements
 * Returns the appropriate icon component based on toast type with proper ARIA labels
 */
const getToastIcon = (type: ToastType): JSX.Element => {
  const iconSize = 24;
  const baseIconProps = {
    width: iconSize,
    height: iconSize,
    className: "mr-3 flex-shrink-0",
  };

  switch (type) {
    case ToastType.SUCCESS:
      return (
        <svg
          {...baseIconProps}
          aria-label="Success"
          role="img"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.3 5.3l-11 11-5.3-5.3-1.4 1.4 6.7 6.7 12.4-12.4z" />
        </svg>
      );

    case ToastType.ERROR:
      return (
        <svg
          {...baseIconProps}
          aria-label="Error"
          role="img"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      );

    case ToastType.INFO:
      return (
        <svg
          {...baseIconProps}
          aria-label="Information"
          role="img"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
      );

    case ToastType.WARNING:
      return (
        <svg
          {...baseIconProps}
          aria-label="Warning"
          role="img"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
      );
  }
};

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
}

/**
 * @requirement User Interface Design
 * Individual toast notification component with accessibility support
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <motion.div
      className={toastVariants({ type })}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={toastAnimation}
      role={type === ToastType.ERROR ? 'alert' : 'status'}
      aria-live={type === ToastType.ERROR ? 'assertive' : 'polite'}
    >
      {getToastIcon(type)}
      <div className="ml-3 flex-1 mr-4">{message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 rounded-lg p-1 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close notification"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </motion.div>
  );
};

/**
 * @requirement User Satisfaction
 * Container component for managing multiple toast notifications
 */
export const ToastContainer: React.FC = () => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed z-50 top-4 right-4 flex flex-col items-end gap-4"
    >
      <AnimatePresence mode="sync">
        {/* Toast notifications will be rendered here by the useToast hook */}
      </AnimatePresence>
    </div>
  );
};