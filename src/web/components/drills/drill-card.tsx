// @package react ^18.0.0
// @package classnames ^2.3.0

// Human Tasks:
// 1. Verify color contrast ratios for status badges and difficulty indicators
// 2. Test keyboard navigation and screen reader announcements
// 3. Validate touch target sizes on mobile devices
// 4. Review loading states and transitions

import React from 'react';
import cn from 'classnames';
import { Card, type CardProps } from '../common/card';
import { Button, type ButtonProps } from '../common/button';
import { 
  type DrillTemplate, 
  type DrillStatus,
  type DrillDifficulty 
} from '../../types/drills';

// Requirement: User Management - Visual status indicators with WCAG 2.1 AA compliant colors
const STATUS_BADGE_CLASSES: Record<DrillStatus, string> = {
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  COMPLETED: 'bg-green-100 text-green-800 border border-green-200',
  EVALUATED: 'bg-blue-100 text-blue-800 border border-blue-200',
  ABANDONED: 'bg-gray-100 text-gray-800 border border-gray-200'
};

// Requirement: Practice Drills - Visual difficulty indicators
const DIFFICULTY_COLORS: Record<DrillDifficulty, string> = {
  BEGINNER: 'text-green-600',
  INTERMEDIATE: 'text-yellow-600',
  ADVANCED: 'text-orange-600',
  EXPERT: 'text-red-600'
};

// Requirement: Practice Drills - Component props interface
export interface DrillCardProps {
  drill: DrillTemplate;
  status: DrillStatus;
  score: number | null;
  onStart: () => void;
  onResume: () => void;
  className?: string;
}

// Requirement: Practice Drills - Card component for drill display
export const DrillCard: React.FC<DrillCardProps> = ({
  drill,
  status,
  score,
  onStart,
  onResume,
  className
}) => {
  // Base styles for consistent card appearance
  const baseStyles = 'relative overflow-hidden transition-all duration-200';

  // Get status badge classes with proper contrast ratios
  const getStatusBadgeClasses = (status: DrillStatus): string => {
    return cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium',
      STATUS_BADGE_CLASSES[status]
    );
  };

  // Render appropriate action button based on drill status
  const renderActionButton = (status: DrillStatus): JSX.Element => {
    const buttonProps: Partial<ButtonProps> = {
      fullWidth: true,
      size: 'md',
      className: 'mt-4'
    };

    switch (status) {
      case 'IN_PROGRESS':
        return (
          <Button
            {...buttonProps}
            variant="secondary"
            onClick={onResume}
            ariaLabel={`Resume ${drill.title} drill`}
          >
            Resume Drill
          </Button>
        );
      default:
        return (
          <Button
            {...buttonProps}
            variant="primary"
            onClick={onStart}
            ariaLabel={`Start ${drill.title} drill`}
          >
            Start Drill
          </Button>
        );
    }
  };

  return (
    <Card
      variant="bordered"
      padding="medium"
      className={cn(baseStyles, className)}
    >
      {/* Drill Type and Status Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">
          {drill.type.replace('_', ' ')}
        </span>
        <span 
          className={getStatusBadgeClasses(status)}
          role="status"
          aria-label={`Drill status: ${status.toLowerCase().replace('_', ' ')}`}
        >
          {status.replace('_', ' ')}
        </span>
      </div>

      {/* Drill Title and Description */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {drill.title}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {drill.description}
      </p>

      {/* Drill Metadata */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <span 
            className={cn(
              'text-sm font-medium',
              DIFFICULTY_COLORS[drill.difficulty]
            )}
            aria-label={`Difficulty: ${drill.difficulty.toLowerCase()}`}
          >
            {drill.difficulty}
          </span>
          {score !== null && (
            <span 
              className="text-sm font-medium text-gray-600"
              aria-label={`Score: ${score}`}
            >
              Score: {score}%
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {drill.timeLimit} minutes
        </span>
      </div>

      {/* Action Button */}
      {renderActionButton(status)}
    </Card>
  );
};