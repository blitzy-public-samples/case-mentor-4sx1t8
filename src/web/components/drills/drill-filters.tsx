// React version: ^18.0.0
// class-variance-authority version: ^0.7.0

import React from 'react';
import { cn } from 'class-variance-authority';
import { Dropdown, handleOptionSelect } from '../common/dropdown';
import { DrillType, DrillDifficulty } from '../../types/drills';

/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 AA compliance with accessibility team
 * 2. Test keyboard navigation patterns across all supported browsers
 * 3. Validate color contrast ratios for filter controls
 */

// Requirement: Practice Drills - Define filter options for different drill types
const DRILL_TYPE_OPTIONS = [
  { value: 'CASE_PROMPT', label: 'Case Prompt' },
  { value: 'CALCULATIONS', label: 'Calculations' },
  { value: 'CASE_MATH', label: 'Case Math' },
  { value: 'BRAINSTORMING', label: 'Brainstorming' },
  { value: 'MARKET_SIZING', label: 'Market Sizing' },
  { value: 'SYNTHESIZING', label: 'Synthesizing' }
];

// Requirement: Practice Drills - Support progressive skill development
const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' }
];

interface DrillFiltersProps {
  selectedType: DrillType | null;
  selectedDifficulty: DrillDifficulty | null;
  showCompleted: boolean;
  onTypeChange: (type: DrillType | null) => void;
  onDifficultyChange: (difficulty: DrillDifficulty | null) => void;
  onShowCompletedChange: (show: boolean) => void;
}

/**
 * @requirement Practice Drills - Enable filtering and organization of different drill types
 * @requirement User Interface Design - Implement consistent design system components with accessibility support
 */
export const DrillFilters: React.FC<DrillFiltersProps> = ({
  selectedType,
  selectedDifficulty,
  showCompleted,
  onTypeChange,
  onDifficultyChange,
  onShowCompletedChange
}) => {
  // Handle drill type filter changes
  const handleTypeChange = (value: string | null) => {
    const newType = value as DrillType | null;
    onTypeChange(newType);

    // Update ARIA live region for screen readers
    const liveRegion = document.getElementById('drill-filters-live-region');
    if (liveRegion) {
      liveRegion.textContent = `Drill type filter ${newType ? `set to ${DRILL_TYPE_OPTIONS.find(opt => opt.value === newType)?.label}` : 'cleared'}`;
    }
  };

  // Handle difficulty level filter changes
  const handleDifficultyChange = (value: string | null) => {
    const newDifficulty = value as DrillDifficulty | null;
    onDifficultyChange(newDifficulty);

    // Update ARIA live region for screen readers
    const liveRegion = document.getElementById('drill-filters-live-region');
    if (liveRegion) {
      liveRegion.textContent = `Difficulty filter ${newDifficulty ? `set to ${DIFFICULTY_OPTIONS.find(opt => opt.value === newDifficulty)?.label}` : 'cleared'}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* ARIA live region for filter changes */}
      <div
        id="drill-filters-live-region"
        className="sr-only"
        role="status"
        aria-live="polite"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Drill Type Filter */}
        <Dropdown
          id="drill-type-filter"
          name="drillType"
          label="Drill Type"
          options={DRILL_TYPE_OPTIONS}
          value={selectedType || ''}
          placeholder="All Types"
          onChange={handleTypeChange}
          isSearchable
        />

        {/* Difficulty Level Filter */}
        <Dropdown
          id="difficulty-filter"
          name="difficulty"
          label="Difficulty Level"
          options={DIFFICULTY_OPTIONS}
          value={selectedDifficulty || ''}
          placeholder="All Levels"
          onChange={handleDifficultyChange}
        />

        {/* Show Completed Toggle */}
        <div className="flex items-end">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className={cn(
                'h-4 w-4 rounded border-gray-300',
                'focus:ring-2 focus:ring-blue-500',
                'text-blue-600 transition-colors'
              )}
              checked={showCompleted}
              onChange={(e) => {
                onShowCompletedChange(e.target.checked);
                // Update ARIA live region
                const liveRegion = document.getElementById('drill-filters-live-region');
                if (liveRegion) {
                  liveRegion.textContent = `${e.target.checked ? 'Showing' : 'Hiding'} completed drills`;
                }
              }}
              aria-label="Show completed drills"
            />
            <span>Show Completed</span>
          </label>
        </div>
      </div>
    </div>
  );
};