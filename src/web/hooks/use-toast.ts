// react version: ^18.0.0
import { useState, useEffect } from 'react';
import { formatError } from '../lib/utils';

/**
 * Human Tasks:
 * 1. Verify toast notification styles meet brand guidelines
 * 2. Conduct accessibility testing with screen readers
 * 3. Validate toast positioning works across all supported viewport sizes
 */

// Maximum duration a toast can be displayed (ms)
const TOAST_DURATION = 5000;
// Maximum number of toasts shown simultaneously
const MAX_TOASTS = 3;

// Toast notification types
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning'
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  timerId?: NodeJS.Timeout;
  /**
   * @requirement Accessibility Requirements
   * ARIA role and live region attributes for screen readers
   */
  ariaRole: 'alert' | 'status';
  ariaLive: 'assertive' | 'polite';
}

/**
 * @requirement User Interface Design
 * Custom hook for managing toast notifications with accessibility support
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      toasts.forEach(toast => {
        if (toast.timerId) {
          clearTimeout(toast.timerId);
        }
      });
    };
  }, [toasts]);

  /**
   * @requirement User Satisfaction
   * Shows a new toast notification with proper ARIA attributes
   */
  const showToast = (
    message: string,
    type: ToastType,
    duration?: number
  ): void => {
    // Validate message
    if (!message || message.trim().length === 0) {
      return;
    }

    // Format error messages consistently
    const displayMessage = type === ToastType.ERROR 
      ? formatError(new Error(message))
      : message;

    // Generate unique ID
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Configure accessibility attributes based on toast type
    const ariaRole = type === ToastType.ERROR ? 'alert' : 'status';
    const ariaLive = type === ToastType.ERROR ? 'assertive' : 'polite';

    // Create new toast
    const newToast: Toast = {
      id,
      message: displayMessage,
      type,
      duration: duration || TOAST_DURATION,
      ariaRole,
      ariaLive
    };

    // Set auto-dismiss timer
    const timerId = setTimeout(() => {
      hideToast(id);
    }, newToast.duration);

    newToast.timerId = timerId;

    // Update toasts queue respecting MAX_TOASTS limit
    setToasts(currentToasts => {
      const updatedToasts = [...currentToasts, newToast];
      if (updatedToasts.length > MAX_TOASTS) {
        // Remove oldest toast and clear its timer
        const [oldestToast, ...remainingToasts] = updatedToasts;
        if (oldestToast.timerId) {
          clearTimeout(oldestToast.timerId);
        }
        return remainingToasts;
      }
      return updatedToasts;
    });
  };

  /**
   * @requirement User Interface Design
   * Hides a specific toast notification by ID
   */
  const hideToast = (id: string): void => {
    setToasts(currentToasts => {
      const toastToHide = currentToasts.find(t => t.id === id);
      if (toastToHide?.timerId) {
        clearTimeout(toastToHide.timerId);
      }
      return currentToasts.filter(t => t.id !== id);
    });
  };

  /**
   * @requirement User Interface Design
   * Removes all active toast notifications
   */
  const clearAllToasts = (): void => {
    // Clear all timers
    toasts.forEach(toast => {
      if (toast.timerId) {
        clearTimeout(toast.timerId);
      }
    });
    // Reset toasts state
    setToasts([]);
  };

  return {
    showToast,
    hideToast,
    clearAllToasts,
    toasts
  };
}