// React v18.0.0
import { useState, useEffect, useCallback } from 'react';
import { DrillTemplate, DrillAttempt } from '../../types/drills';

// Human Tasks:
// 1. Verify browser compatibility for Date object and timer precision
// 2. Test timer accuracy across different browser tab states
// 3. Consider implementing Web Workers for more precise timing in background tabs

interface DrillTimerProps {
  drill: DrillTemplate;
  attempt: DrillAttempt;
  onTimeUp: () => void;
  isPaused: boolean;
}

interface TimerState {
  remainingSeconds: number;
  isWarning: boolean;
  isCritical: boolean;
}

// Requirement: Practice Drills - Manage timing for different drill types
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Requirement: System Performance - Ensure accurate timing
const calculateRemainingTime = (startTime: Date, timeLimit: number): number => {
  const currentTime = new Date();
  const elapsedSeconds = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
  return Math.max(0, timeLimit - elapsedSeconds);
};

export const DrillTimer: React.FC<DrillTimerProps> = ({ 
  drill, 
  attempt, 
  onTimeUp, 
  isPaused 
}) => {
  const [timerState, setTimerState] = useState<TimerState>({
    remainingSeconds: drill.timeLimit,
    isWarning: false,
    isCritical: false
  });

  const [timerInterval, setTimerInterval] = useState<NodeJS.Timer | null>(null);

  // Requirement: System Performance - Proper cleanup and state management
  const stopTimer = useCallback(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [timerInterval]);

  const updateTimerState = useCallback(() => {
    const remainingTime = calculateRemainingTime(attempt.startedAt, drill.timeLimit);
    const warningThreshold = Math.floor(drill.timeLimit * 0.3);
    const criticalThreshold = Math.floor(drill.timeLimit * 0.1);

    setTimerState(prevState => ({
      remainingSeconds: remainingTime,
      isWarning: remainingTime <= warningThreshold && remainingTime > criticalThreshold,
      isCritical: remainingTime <= criticalThreshold
    }));

    if (remainingTime === 0) {
      stopTimer();
      onTimeUp();
    }
  }, [attempt.startedAt, drill.timeLimit, onTimeUp, stopTimer]);

  const startTimer = useCallback(() => {
    stopTimer();
    updateTimerState();
    const interval = setInterval(updateTimerState, 1000);
    setTimerInterval(interval);
  }, [stopTimer, updateTimerState]);

  // Requirement: System Performance - Handle timer intervals
  useEffect(() => {
    if (attempt.status === 'IN_PROGRESS' && !isPaused) {
      startTimer();
    } else {
      stopTimer();
    }

    return () => {
      stopTimer();
    };
  }, [attempt.status, isPaused, startTimer, stopTimer]);

  const timerClassName = `drill-timer ${timerState.isWarning ? 'warning' : ''} ${
    timerState.isCritical ? 'critical' : ''
  }`;

  return (
    <div className={timerClassName}>
      <span className="timer-display" role="timer" aria-live="polite">
        {formatTime(timerState.remainingSeconds)}
      </span>
      {isPaused && <span className="timer-status">Paused</span>}
    </div>
  );
};

export default DrillTimer;