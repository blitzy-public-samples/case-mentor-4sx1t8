// react v18.0.0
import { useState, useCallback, useEffect } from 'react';

// Human Tasks:
// 1. Ensure the default toast duration in your application configuration aligns with UX requirements
// 2. Verify the toast z-index in your CSS/styling system doesn't conflict with other overlays
// 3. Consider adding toast sound effects for accessibility (optional)

/**
 * @requirement User Interface Design - Feedback Components
 * Enum defining available toast notification types following the design system color palette
 */
export enum ToastType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  INFO = 'INFO',
  WARNING = 'WARNING'
}

/**
 * @requirement User Interface Design - Feedback Components
 * Interface defining toast notification configuration options
 */
export interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
}

/**
 * Interface defining the internal toast state structure
 */
interface ToastState {
  visible: boolean;
  options: ToastOptions | null;
}

/**
 * Default duration for toast messages in milliseconds if not specified
 */
const DEFAULT_DURATION = 5000;

/**
 * @requirement User Interface Design - Feedback Components
 * @requirement Error Handling Display
 * Custom hook that provides methods to show and hide toast notifications using local state
 * with automatic dismissal
 */
export const useToast = () => {
  // Initialize local state for toast visibility and options
  const [state, setState] = useState<ToastState>({
    visible: false,
    options: null
  });

  /**
   * Memoized show method that updates visibility and options
   */
  const show = useCallback((options: ToastOptions) => {
    setState({
      visible: true,
      options: {
        ...options,
        duration: options.duration || DEFAULT_DURATION
      }
    });
  }, []);

  /**
   * Memoized hide method that resets visibility and options
   */
  const hide = useCallback(() => {
    setState({
      visible: false,
      options: null
    });
  }, []);

  /**
   * Effect to handle automatic toast dismissal based on duration
   */
  useEffect(() => {
    if (state.visible && state.options) {
      const timer = setTimeout(() => {
        hide();
      }, state.options.duration || DEFAULT_DURATION);

      // Cleanup timer on unmount or when toast changes
      return () => {
        clearTimeout(timer);
      };
    }
  }, [state.visible, state.options, hide]);

  return {
    show,
    hide,
    visible: state.visible,
    options: state.options
  };
};