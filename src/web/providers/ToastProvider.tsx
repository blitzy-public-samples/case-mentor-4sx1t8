// react v18.0.0
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import Toast from '../components/shared/Toast';
import { ToastType, type ToastOptions } from '../hooks/useToast';

// Human Tasks:
// 1. Verify toast z-index in your application's CSS stack to ensure proper layering
// 2. Test screen reader announcements for different toast types
// 3. Validate toast animations performance on lower-end devices
// 4. Consider configuring default toast duration based on UX requirements

/**
 * @requirement User Interface Design - Feedback Components
 * Interface defining the shape of the toast context value
 */
interface ToastContextType {
  show: (options: ToastOptions) => void;
  hide: () => void;
  visible: boolean;
  options: ToastOptions | null;
}

/**
 * Props interface for the ToastProvider component
 */
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * @requirement User Interface Design - Feedback Components
 * Create the toast context with undefined default value
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * @requirement User Interface Design - Feedback Components
 * @requirement Error Handling Display
 * React component that provides global toast notification context with WCAG compliance
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  // State for managing toast visibility and options
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ToastOptions | null>(null);

  /**
   * @requirement Error Handling Display
   * Memoized method to show a toast notification
   */
  const show = useCallback((toastOptions: ToastOptions) => {
    setOptions({
      ...toastOptions,
      duration: toastOptions.duration || 5000 // Default 5 seconds if not specified
    });
    setVisible(true);
  }, []);

  /**
   * Memoized method to hide the current toast notification
   */
  const hide = useCallback(() => {
    setVisible(false);
    setOptions(null);
  }, []);

  // Create the context value object with show/hide methods and current state
  const contextValue: ToastContextType = {
    show,
    hide,
    visible,
    options
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast
        visible={visible}
        options={options}
        onClose={hide}
      />
    </ToastContext.Provider>
  );
};

/**
 * @requirement User Interface Design - Feedback Components
 * Custom hook to access the toast context throughout the application
 * @throws {Error} If used outside of ToastProvider
 */
export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  
  return context;
};

export default ToastProvider;