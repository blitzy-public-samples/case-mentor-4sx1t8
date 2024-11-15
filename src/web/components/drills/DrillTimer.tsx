// react ^18.0.0
import { useState, useEffect, useCallback } from 'react';
// class-variance-authority ^0.7.0
import { cn } from 'class-variance-authority';
import { Progress } from '../shared/Progress';
import { submitAttempt } from '../../hooks/useDrill';

/**
 * Human Tasks:
 * 1. Verify timer accuracy across different browsers and devices
 * 2. Test timer behavior during browser tab switching/background
 * 3. Validate WCAG color contrast for warning states
 */

// Constants for timer configuration
const TIMER_UPDATE_INTERVAL = 1000; // 1 second in milliseconds
const WARNING_THRESHOLD = 60; // Show warning when 60 seconds or less remain

interface DrillTimerProps {
  duration: number; // Duration in seconds
  drillId: string;
  onTimeUp: () => void;
  autoStart?: boolean;
}

// Requirement: Practice Drills - Implements time management functionality
const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Requirement: McKinsey Simulation - Supports time-pressured scenarios
export const DrillTimer = ({
  duration,
  drillId,
  onTimeUp,
  autoStart = true
}: DrillTimerProps): JSX.Element => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

  // Calculate progress percentage for visual indicator
  const progressPercentage = (timeRemaining / duration) * 100;
  
  // Determine if we're in warning state
  const isWarning = timeRemaining <= WARNING_THRESHOLD;

  // Handle timer completion
  const handleTimeUp = useCallback(async () => {
    setIsRunning(false);
    // Record attempt with time spent
    await submitAttempt(drillId, '', duration);
    onTimeUp();
  }, [drillId, duration, onTimeUp]);

  // Timer effect with cleanup
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      intervalId = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalId);
            handleTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, TIMER_UPDATE_INTERVAL);
    }

    // Cleanup interval on component unmount or when timer stops
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, timeRemaining, handleTimeUp]);

  // Requirement: User Experience - Visual timer following design system specifications
  return (
    <div className="flex flex-col gap-2">
      <div className={cn(
        "text-2xl font-mono text-center",
        isWarning && "text-red-600 animate-pulse"
      )}>
        {formatTime(timeRemaining)}
      </div>
      <Progress
        value={progressPercentage}
        max={100}
        variant={isWarning ? "accent" : "primary"}
        size="md"
        aria-label="Time remaining"
      />
    </div>
  );
};