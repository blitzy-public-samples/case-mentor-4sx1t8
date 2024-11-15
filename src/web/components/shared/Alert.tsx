// react ^18.0.0
import * as React from 'react';
// lucide-react ^0.294.0
import { AlertCircle, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import { classNames } from '../../lib/utils';
import { buttonVariants } from './Button';

// Requirement: Design System Specifications (7.1.1)
// Interface for Alert component props
interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// Requirement: Design System Specifications (7.1.1)
// Function to get the appropriate icon based on alert variant
const getAlertIcon = (variant: AlertProps['variant'] = 'info'): React.ElementType => {
  const icons = {
    info: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle
  };
  return icons[variant];
};

// Requirement: User Feedback (2. SYSTEM OVERVIEW/Success Criteria)
// Alert component for displaying system feedback and notifications
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  action,
  className
}) => {
  // Requirement: Design System Specifications (7.1.1)
  // Base styles following design system's color palette and spacing
  const baseStyles = 'rounded-lg p-4 mb-4 flex items-start gap-3';
  
  // Variant-specific styles
  const variantStyles = {
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
    success: 'bg-green-50 text-green-800 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
    error: 'bg-red-50 text-red-800 border border-red-200'
  };

  // Icon color styles based on variant
  const iconColors = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  };

  const Icon = getAlertIcon(variant);

  // Requirement: Accessibility Requirements (7.1.4)
  // WCAG 2.1 AA compliant implementation with proper ARIA roles
  return (
    <div
      className={classNames(
        baseStyles,
        variantStyles[variant],
        className
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon className={classNames('h-5 w-5', iconColors[variant])} aria-hidden="true" />
      
      <div className="flex-1">
        {title && (
          <h3 className="font-semibold mb-1">
            {title}
          </h3>
        )}
        <div className="text-sm">
          {children}
        </div>
        {action && (
          <div className="mt-3">
            <button
              onClick={action.onClick}
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
                className: iconColors[variant]
              })}
              aria-label={action.label}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={classNames(
            'p-1 rounded-md hover:bg-opacity-10 hover:bg-current',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'focus:ring-current transition-colors'
          )}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

Alert.displayName = 'Alert';