// react ^18.0.0
import React, { useState, useEffect, useCallback } from 'react';
// class-variance-authority ^0.7.0
import { cn } from 'class-variance-authority';

// Internal imports
import { DrillTimer } from './DrillTimer';
import Input from '../shared/Input';
import { useDrill } from '../../hooks/useDrill';

/**
 * Human Tasks:
 * 1. Verify calculation validation thresholds across different numerical ranges
 * 2. Test input behavior with international number formats
 * 3. Validate WCAG compliance for error states and feedback
 */

// Constants for drill configuration
const CALCULATION_TIME_LIMIT = 300; // 5 minutes in seconds
const ACCEPTABLE_ERROR_MARGIN = 0.05; // 5% margin of error

interface CalculationDrillProps {
  drillId: string;
  prompt: DrillPrompt;
  onComplete: () => void;
}

// Requirement: Case Math Drills - Validates user calculations within acceptable margin
const validateCalculation = (input: string, expectedAnswer: number): boolean => {
  try {
    const numericInput = parseFloat(input.replace(/,/g, ''));
    if (isNaN(numericInput)) return false;

    const absoluteDifference = Math.abs(numericInput - expectedAnswer);
    const relativeDifference = absoluteDifference / expectedAnswer;

    return relativeDifference <= ACCEPTABLE_ERROR_MARGIN;
  } catch (error) {
    return false;
  }
};

// Requirement: Case Math Drills - Implements calculation drills for quantitative analysis
export const CalculationDrill: React.FC<CalculationDrillProps> = ({
  drillId,
  prompt,
  onComplete
}) => {
  const [calculationInput, setCalculationInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [timeSpent, setTimeSpent] = useState<number>(0);

  const { submitAttempt } = useDrill('calculation');

  // Requirement: System Performance - Ensures <200ms response time for validation
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Only allow numbers, decimal point, and commas
    if (!/^[\d,]*\.?\d*$/.test(value) && value !== '') return;
    
    setCalculationInput(value);
    setError('');
    
    // Validate input if it's not empty
    if (value) {
      const valid = validateCalculation(value, prompt.expectedAnswer);
      setIsCorrect(valid);
      if (!valid) {
        setError('The calculation appears incorrect. Please check your work.');
      }
    } else {
      setIsCorrect(false);
    }
  }, [prompt.expectedAnswer]);

  // Requirement: User Engagement - Track time spent and handle completion
  const handleTimeUp = useCallback(async () => {
    if (!calculationInput) {
      setError('Time is up! Please provide an answer.');
      return;
    }

    await submitAttempt(drillId, calculationInput, timeSpent);
    onComplete();
  }, [drillId, calculationInput, timeSpent, submitAttempt, onComplete]);

  // Update time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle successful completion
  useEffect(() => {
    if (isCorrect) {
      const submitDrill = async () => {
        await submitAttempt(drillId, calculationInput, timeSpent);
        onComplete();
      };
      submitDrill();
    }
  }, [isCorrect, drillId, calculationInput, timeSpent, submitAttempt, onComplete]);

  return (
    <div className="space-y-6">
      <DrillTimer
        duration={CALCULATION_TIME_LIMIT}
        drillId={drillId}
        onTimeUp={handleTimeUp}
        autoStart={true}
      />

      <div className={cn(
        "p-4 rounded-lg",
        "bg-gray-50 dark:bg-gray-800",
        "border border-gray-200 dark:border-gray-700"
      )}>
        <p className="text-lg font-medium mb-4">{prompt.question}</p>
        
        <Input
          type="text"
          value={calculationInput}
          onChange={handleInputChange}
          error={error}
          label="Your calculation"
          hint="Enter your answer using numbers only (commas allowed for thousands)"
          aria-label="Calculation input"
          className={cn(
            "font-mono text-lg",
            isCorrect && "border-green-500 focus:ring-green-500",
            error && "border-red-500 focus:ring-red-500"
          )}
          autoFocus
        />

        {isCorrect && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400" role="alert">
            Correct! Well done on completing the calculation.
          </p>
        )}
      </div>
    </div>
  );
};