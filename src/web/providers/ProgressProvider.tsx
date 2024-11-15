// react ^18.0.0
import React, { createContext, useContext, useEffect, ReactNode } from 'react';

// Internal imports
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../hooks/useAuth';
import { UserProgress } from '../types/user';

/**
 * Human Tasks:
 * 1. Configure SWR revalidation strategy in production environment
 * 2. Set up monitoring for progress update performance
 * 3. Implement error tracking for failed progress updates
 */

// Progress data revalidation interval (5 minutes)
const PROGRESS_UPDATE_INTERVAL = 300000;

// Progress context value type definition
interface ProgressContextValue {
  progress: UserProgress | null;
  isLoading: boolean;
  error: Error | null;
  updateProgress: () => Promise<void>;
}

// Create progress context
const ProgressContext = createContext<ProgressContextValue | null>(null);

/**
 * Progress Provider Component
 * 
 * Requirement: User Management - Progress tracking and performance analytics
 * for user practice activities
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  // Get authenticated user state
  const { state: authState } = useAuth();
  
  // Initialize progress hook with user ID
  const {
    progress,
    isLoading,
    error,
    mutate
  } = useProgress(authState.user?.id || '');

  // Set up automatic progress revalidation
  useEffect(() => {
    if (!authState.user?.id) return;

    const intervalId = setInterval(() => {
      // Requirement: System Performance - Track and maintain >80% completion rate
      mutate();
    }, PROGRESS_UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [authState.user?.id, mutate]);

  // Force progress update function
  const updateProgress = async (): Promise<void> => {
    try {
      await mutate();
    } catch (err) {
      console.error('Failed to update progress:', err);
      throw err;
    }
  };

  // Provide progress context value
  const contextValue: ProgressContextValue = {
    progress,
    isLoading,
    error,
    updateProgress
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
}

/**
 * Custom hook to access progress context
 * 
 * Requirement: User Management - Progress tracking and performance analytics
 * for user practice activities
 */
export function useProgressContext(): ProgressContextValue {
  const context = useContext(ProgressContext);
  
  if (!context) {
    throw new Error('useProgressContext must be used within a ProgressProvider');
  }
  
  return context;
}