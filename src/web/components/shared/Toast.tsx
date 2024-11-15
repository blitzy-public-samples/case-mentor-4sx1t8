// react v18.0.0
import React, { useEffect, useRef } from 'react';
// framer-motion v10.0.0
import { motion } from 'framer-motion';
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority';
import { ToastType, type ToastOptions } from '../../hooks/useToast';
import { theme } from '../../config/theme';

// Human Tasks:
// 1. Verify screen reader behavior with your specific screen reader software
// 2. Test keyboard navigation and focus management in your application context
// 3. Validate color contrast ratios in different color modes if dark mode is supported
// 4. Consider configuring toast position (top/bottom) based on UX requirements

interface ToastProps {
  visible: boolean;
  options: ToastOptions | null;
  onClose: () => void;
}

/**
 * @requirement User Interface Design - Feedback Components
 * Generates WCAG compliant toast variant styles based on type
 */
const getToastStyles = (type: ToastType) => {
  const styles: Record<string, string> = {
    base: cn(
      'fixed top-4 right-4 z-50',
      'min-w-[320px] max-w-[420px] p-4 rounded-lg',
      'flex items-center justify-between gap-3',
      'shadow-lg backdrop-blur-sm'
    )
  };

  switch (type) {
    case ToastType.SUCCESS:
      return {
        ...styles,
        background: `${theme.colors.accent.base}CC`, // 80% opacity
        border: `1px solid ${theme.colors.accent.base}`,
        color: '#FFFFFF'
      };
    case ToastType.ERROR:
      return {
        ...styles,
        background: `${theme.colors.error.base}CC`,
        border: `1px solid ${theme.colors.error.base}`,
        color: '#FFFFFF'
      };
    case ToastType.WARNING:
      return {
        ...styles,
        background: `${theme.colors.warning.base}CC`,
        border: `1px solid ${theme.colors.warning.base}`,
        color: '#000000'
      };
    case ToastType.INFO:
    default:
      return {
        ...styles,
        background: `${theme.colors.secondary.base}CC`,
        border: `1px solid ${theme.colors.secondary.base}`,
        color: '#FFFFFF'
      };
  }
};

/**
 * @requirement User Interface Design - Feedback Components
 * @requirement Error Handling Display
 * @requirement Accessibility Requirements
 * Toast component for displaying accessible notifications with animations
 */
export const Toast: React.FC<ToastProps> = ({ visible, options, onClose }) => {
  const toastRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (visible && toastRef.current) {
      toastRef.current.focus();
    }
  }, [visible]);

  if (!visible || !options) {
    return null;
  }

  const styles = getToastStyles(options.type);

  return (
    <motion.div
      ref={toastRef}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={0}
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={styles}
      className={styles.base}
    >
      <div className="flex-1">
        <p className="m-0 text-base font-medium">{options.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={cn(
          'p-1 rounded-full opacity-80 hover:opacity-100',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'focus:ring-white transition-opacity'
        )}
        aria-label="Close notification"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

export default Toast;