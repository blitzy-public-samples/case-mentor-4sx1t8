// @package react ^18.0.0
// @package class-variance-authority ^0.7.0

// Human Tasks:
// 1. Verify WCAG 2.1 AA compliance for filter controls and drill cards
// 2. Test keyboard navigation flow between drill cards
// 3. Validate screen reader announcements for filter changes
// 4. Review loading state animations and transitions

import React, { useState, useCallback } from 'react';
import { cn } from 'class-variance-authority';
import { DrillCard, type DrillCardProps } from './drill-card';
import { DrillFilters } from './drill-filters';
import LoadingSpinner from '../common/loading-spinner';
import { useDrills } from '../../hooks/use-drills';
import type { DrillType, DrillDifficulty } from '../../types/drills';

// Constants for error and empty state messages
const EMPTY_STATE_MESSAGE = 'No drills found matching your filters. Try adjusting your selection.';
const ERROR_MESSAGE = 'Failed to load drills. Please try again later.';

// Interface for component props
export interface DrillListProps {
  className?: string;
}

/**
 * DrillList - A filterable list of case interview practice drills
 * 
 * @requirement Practice Drills - Displays and manages access to various drill types
 * @requirement User Management - Shows progress tracking and performance analytics
 * @requirement User Interface Design - Implements accessible design system components
 */
export const DrillList: React.FC<DrillListProps> = ({ className }) => {
  // Filter state management
  const [drillType, setDrillType] = useState<DrillType | null>(null);
  const [difficulty, setDifficulty] = useState<DrillDifficulty | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Fetch drills data using the custom hook
  const {
    drills,
    userAttempts,
    loading,
    error,
    startDrill
  } = useDrills({
    type: drillType,
    difficulty: difficulty
  });

  // Handle filter changes with proper ARIA announcements
  const handleFilterChange = useCallback((
    type: DrillType | null,
    newDifficulty: DrillDifficulty | null,
    completed: boolean
  ) => {
    setDrillType(type);
    setDifficulty(newDifficulty);
    setShowCompleted(completed);

    // Update ARIA live region for screen readers
    const liveRegion = document.getElementById('drill-list-live-region');
    if (liveRegion) {
      const changes = [];
      if (type !== drillType) changes.push(`type: ${type || 'all'}`);
      if (newDifficulty !== difficulty) changes.push(`difficulty: ${newDifficulty || 'all'}`);
      if (completed !== showCompleted) changes.push(`${completed ? 'showing' : 'hiding'} completed drills`);
      
      liveRegion.textContent = `Filters updated - ${changes.join(', ')}`;
    }
  }, [drillType, difficulty, showCompleted]);

  // Get drill status and score from user attempts
  const getDrillStatus = useCallback((drillId: string) => {
    const attempt = userAttempts.find(a => a.drillId === drillId);
    return {
      status: attempt?.status || 'NOT_STARTED',
      score: attempt?.score || null
    };
  }, [userAttempts]);

  // Filter drills based on completion status
  const filteredDrills = drills.filter(drill => {
    if (!showCompleted) {
      const { status } = getDrillStatus(drill.id);
      return status !== 'COMPLETED' && status !== 'EVALUATED';
    }
    return true;
  });

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]" role="status">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div 
        className="text-center text-red-600 p-4 rounded-md bg-red-50"
        role="alert"
      >
        {ERROR_MESSAGE}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* ARIA live region for filter updates */}
      <div
        id="drill-list-live-region"
        className="sr-only"
        role="status"
        aria-live="polite"
      />

      {/* Drill filters section */}
      <DrillFilters
        selectedType={drillType}
        selectedDifficulty={difficulty}
        showCompleted={showCompleted}
        onTypeChange={(type) => handleFilterChange(type, difficulty, showCompleted)}
        onDifficultyChange={(newDifficulty) => handleFilterChange(drillType, newDifficulty, showCompleted)}
        onShowCompletedChange={(completed) => handleFilterChange(drillType, difficulty, completed)}
      />

      {/* Drills grid layout */}
      {filteredDrills.length > 0 ? (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-label="Available drills"
        >
          {filteredDrills.map((drill) => {
            const { status, score } = getDrillStatus(drill.id);
            
            return (
              <div 
                key={drill.id}
                role="listitem"
                className="focus-within:ring-2 focus-within:ring-blue-500 rounded-lg"
              >
                <DrillCard
                  drill={drill}
                  status={status}
                  score={score}
                  onStart={() => startDrill(drill.id)}
                  onResume={() => startDrill(drill.id)}
                  className="h-full"
                />
              </div>
            );
          })}
        </div>
      ) : (
        // Empty state message
        <div 
          className="text-center text-gray-600 p-8 bg-gray-50 rounded-lg"
          role="status"
        >
          {EMPTY_STATE_MESSAGE}
        </div>
      )}
    </div>
  );
};