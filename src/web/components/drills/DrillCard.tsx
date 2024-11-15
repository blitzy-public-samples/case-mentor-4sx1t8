/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards for difficulty level indicators
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate subscription tier checks with backend team
 */

// react ^18.0.0
import * as React from 'react';
// class-variance-authority ^0.7.0
import { cn } from 'class-variance-authority';
// lucide-react ^0.284.0
import { Timer, Brain, Target } from 'lucide-react';

// Internal imports
import { DrillType, DrillPrompt, DrillProgress, DrillDifficulty } from '../../types/drills';
import Card, { cardVariants } from '../shared/Card';
import { useDrill } from '../../hooks/useDrill';

// Requirement: Practice Drills - Component props interface
interface DrillCardProps {
  drill: DrillPrompt;
  progress: DrillProgress;
  onStart: (drill: DrillPrompt) => void;
  className?: string;
}

// Requirement: User Interface Design - Difficulty level styling
const difficultyStyles = {
  [DrillDifficulty.BEGINNER]: 'bg-green-100 text-green-800',
  [DrillDifficulty.INTERMEDIATE]: 'bg-yellow-100 text-yellow-800',
  [DrillDifficulty.ADVANCED]: 'bg-red-100 text-red-800',
};

// Requirement: Practice Drills - Drill type icons
const drillTypeIcons = {
  [DrillType.CASE_PROMPT]: Brain,
  [DrillType.CALCULATION]: Timer,
  [DrillType.CASE_MATH]: Timer,
  [DrillType.BRAINSTORMING]: Brain,
  [DrillType.MARKET_SIZING]: Target,
  [DrillType.SYNTHESIZING]: Brain,
};

// Requirement: Practice Drills, User Interface Design, Accessibility Requirements
const DrillCard: React.FC<DrillCardProps> = ({
  drill,
  progress,
  onStart,
  className,
}) => {
  // Get the appropriate icon for the drill type
  const DrillIcon = drillTypeIcons[drill.type] || Brain;

  // Requirement: Accessibility Requirements - Handle keyboard interaction
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onStart(drill);
    }
  };

  return (
    <Card
      className={cn(
        'relative flex flex-col gap-4 transition-all hover:shadow-lg',
        className
      )}
      // Requirement: Accessibility Requirements - Interactive card
      role="button"
      tabIndex={0}
      onClick={() => onStart(drill)}
      onKeyDown={handleKeyPress}
      aria-label={`Start ${drill.title} drill - ${drill.difficulty} difficulty`}
    >
      {/* Requirement: Practice Drills - Drill header with type and difficulty */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DrillIcon className="h-5 w-5 text-gray-600" aria-hidden="true" />
          <span className="font-medium text-gray-900">{drill.type}</span>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-1 text-xs font-medium',
            difficultyStyles[drill.difficulty]
          )}
        >
          {drill.difficulty}
        </span>
      </div>

      {/* Requirement: Practice Drills - Drill title and description */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900">{drill.title}</h3>
        <p className="text-sm text-gray-600">{drill.description}</p>
      </div>

      {/* Requirement: Practice Drills - Industry and time limit */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{drill.industry}</span>
        <div className="flex items-center gap-1">
          <Timer className="h-4 w-4" aria-hidden="true" />
          <span>{drill.timeLimit} min</span>
        </div>
      </div>

      {/* Requirement: User Management - Progress indicator */}
      {progress && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">
              {Math.round(progress.averageScore)}%
            </span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress.averageScore}%` }}
              role="progressbar"
              aria-valuenow={progress.averageScore}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Requirement: Practice Drills - Subscription tier indicator */}
      {drill.requiredTier && (
        <div
          className="absolute right-2 top-2 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
          aria-label={`Requires ${drill.requiredTier} subscription`}
        >
          {drill.requiredTier}
        </div>
      )}
    </Card>
  );
};

// Set display name for debugging
DrillCard.displayName = 'DrillCard';

export default DrillCard;