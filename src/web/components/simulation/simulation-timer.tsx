/**
 * Human Tasks:
 * 1. Configure monitoring alerts for timer performance
 * 2. Set up error tracking for timer state updates
 * 3. Review warning/critical thresholds with product team
 */

// react version: ^18.0.0
import React, { useEffect, useMemo } from 'react';
// class-names version: ^2.3.0
import cn from 'class-names';

import { SimulationUIState } from '../../types/simulation';
import { useSimulation } from '../../hooks/use-simulation';
import { formatDuration } from '../../lib/utils';

interface SimulationTimerProps {
  simulationId: string;
  onTimeUp: () => void;
}

/**
 * @requirement McKinsey Simulation
 * Time thresholds for visual feedback (in seconds)
 */
const WARNING_THRESHOLD = 300; // 5 minutes
const CRITICAL_THRESHOLD = 120; // 2 minutes

/**
 * @requirement McKinsey Simulation
 * Component that displays and manages the countdown timer for the ecosystem simulation game
 */
const SimulationTimer: React.FC<SimulationTimerProps> = ({ simulationId, onTimeUp }) => {
  const { simulationState } = useSimulation(simulationId);

  /**
   * @requirement System Performance
   * Calculate time-based styling classes for visual feedback
   */
  const timerClasses = useMemo(() => {
    const totalSeconds = simulationState.timeRemaining.minutes * 60 + simulationState.timeRemaining.seconds;
    return cn(
      'font-mono text-2xl font-bold px-4 py-2 rounded-lg transition-colors duration-300',
      {
        'bg-gray-100 text-gray-900': totalSeconds > WARNING_THRESHOLD,
        'bg-yellow-100 text-yellow-900': totalSeconds <= WARNING_THRESHOLD && totalSeconds > CRITICAL_THRESHOLD,
        'bg-red-100 text-red-900 animate-pulse': totalSeconds <= CRITICAL_THRESHOLD && totalSeconds > 0,
        'bg-red-500 text-white': totalSeconds <= 0
      }
    );
  }, [simulationState.timeRemaining]);

  /**
   * @requirement McKinsey Simulation
   * Trigger onTimeUp callback when timer reaches zero
   */
  useEffect(() => {
    const { minutes, seconds } = simulationState.timeRemaining;
    if (minutes === 0 && seconds === 0) {
      onTimeUp();
    }
  }, [simulationState.timeRemaining, onTimeUp]);

  /**
   * @requirement System Performance
   * Format time display with leading zeros for consistent width
   */
  const formattedTime = useMemo(() => {
    const { minutes, seconds } = simulationState.timeRemaining;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [simulationState.timeRemaining]);

  return (
    <div 
      role="timer" 
      aria-label="Simulation time remaining"
      className="flex items-center justify-center"
    >
      <div className={timerClasses}>
        {formattedTime}
      </div>
    </div>
  );
};

export default SimulationTimer;