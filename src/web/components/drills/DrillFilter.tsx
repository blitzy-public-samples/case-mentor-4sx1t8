/**
 * Human Tasks:
 * 1. Verify react ^18.0.0 is installed in package.json
 */

// react ^18.0.0
import React from 'react';
import { DrillType, DrillDifficulty } from '../../types/drills';
import { Select } from '../shared/Select';

// Requirement: Practice Drills - Filter interface for accessing different types of drills
interface DrillFilterProps {
  selectedType: DrillType | null;
  selectedDifficulty: DrillDifficulty | null;
  selectedIndustry: string | null;
  onTypeChange: (type: DrillType | null) => void;
  onDifficultyChange: (difficulty: DrillDifficulty | null) => void;
  onIndustryChange: (industry: string | null) => void;
  industries: string[];
}

// Requirement: User Interface Design - Filter component following design system specifications
const filterContainerStyles = 'flex flex-col md:flex-row gap-4 w-full';

// Requirement: Practice Drills - Filter interface implementation
export function DrillFilter({
  selectedType,
  selectedDifficulty,
  selectedIndustry,
  onTypeChange,
  onDifficultyChange,
  onIndustryChange,
  industries,
}: DrillFilterProps): JSX.Element {
  // Convert DrillType enum values to SelectOption format
  const typeOptions = Object.values(DrillType).map((type) => ({
    value: type,
    label: type.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  }));

  // Convert DrillDifficulty enum values to SelectOption format
  const difficultyOptions = Object.values(DrillDifficulty).map((difficulty) => ({
    value: difficulty,
    label: difficulty.charAt(0) + difficulty.slice(1).toLowerCase(),
  }));

  // Convert industries array to SelectOption format
  const industryOptions = industries.map((industry) => ({
    value: industry,
    label: industry,
  }));

  // Requirement: User Interface Design - WCAG 2.1 AA compliant controls
  return (
    <div className={filterContainerStyles}>
      <Select
        value={selectedType || ''}
        options={typeOptions}
        onChange={(value) => onTypeChange(value ? value as DrillType : null)}
        placeholder="Select Drill Type"
      />
      
      <Select
        value={selectedDifficulty || ''}
        options={difficultyOptions}
        onChange={(value) => onDifficultyChange(value ? value as DrillDifficulty : null)}
        placeholder="Select Difficulty"
      />
      
      <Select
        value={selectedIndustry || ''}
        options={industryOptions}
        onChange={(value) => onIndustryChange(value || null)}
        placeholder="Select Industry"
      />
    </div>
  );
}

export type { DrillFilterProps };