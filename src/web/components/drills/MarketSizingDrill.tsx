// react ^18.0.0
import React, { useState, useCallback } from 'react';
// class-variance-authority ^0.7.0
import { cn } from 'class-variance-authority';

// Internal imports
import { DrillType, DrillPrompt, DrillAttempt } from '../../types/drills';
import { useDrill } from '../../hooks/useDrill';
import Input from '../shared/Input';
import { DrillTimer } from './DrillTimer';

/**
 * Human Tasks:
 * 1. Verify market sizing validation rules are properly configured
 * 2. Test calculation accuracy with edge cases
 * 3. Ensure proper numeric input formatting across browsers
 */

// Constants for market sizing assumptions and validation
const DEFAULT_ASSUMPTIONS = {
  population: 0,
  penetration: 0,
  frequency: 0,
  price: 0
};

const ASSUMPTION_LABELS = {
  population: 'Total Population',
  penetration: 'Market Penetration (%)',
  frequency: 'Purchase Frequency (per year)',
  price: 'Average Price ($)'
};

const ASSUMPTION_HINTS = {
  population: 'Enter total addressable population',
  penetration: 'Enter market penetration rate (0-100)',
  frequency: 'Enter average purchases per year',
  price: 'Enter average price per purchase'
};

const VALIDATION_RULES = {
  population: { min: 1000, max: 1000000000 },
  penetration: { min: 0, max: 100 },
  frequency: { min: 0.1, max: 365 },
  price: { min: 0.01, max: 1000000 }
};

interface MarketSizingDrillProps {
  prompt: DrillPrompt;
  onComplete: () => void;
}

// Requirement: Practice Drills - Market Sizing Drills component for practicing structured market size estimation
export const MarketSizingDrill: React.FC<MarketSizingDrillProps> = ({
  prompt,
  onComplete
}) => {
  // Initialize state for assumptions and validation
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Get drill management functionality from hook
  const { submitAttempt } = useDrill(DrillType.MARKET_SIZING);

  // Requirement: Practice Drills - Validates user's market sizing assumptions
  const validateAssumption = (name: keyof typeof DEFAULT_ASSUMPTIONS, value: number): string => {
    const rules = VALIDATION_RULES[name];
    if (isNaN(value)) {
      return 'Please enter a valid number';
    }
    if (value < rules.min) {
      return `Value must be at least ${rules.min}`;
    }
    if (value > rules.max) {
      return `Value must be less than ${rules.max}`;
    }
    return '';
  };

  // Requirement: Practice Drills - Handles assumption input changes with validation
  const handleAssumptionChange = useCallback((name: keyof typeof DEFAULT_ASSUMPTIONS, value: string) => {
    const numericValue = parseFloat(value);
    const error = validateAssumption(name, numericValue);
    
    setAssumptions(prev => ({
      ...prev,
      [name]: isNaN(numericValue) ? 0 : numericValue
    }));
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  // Requirement: Practice Drills - Calculates final market size from assumptions
  const calculateMarketSize = useCallback((): number => {
    const { population, penetration, frequency, price } = assumptions;
    return population * (penetration / 100) * frequency * price;
  }, [assumptions]);

  // Requirement: Practice Drills - Handles drill completion and submission
  const handleComplete = useCallback(async () => {
    setIsCalculating(true);
    try {
      const marketSize = calculateMarketSize();
      const response = {
        assumptions: JSON.stringify(assumptions),
        marketSize: marketSize.toFixed(2),
        workings: `Market Size = Population (${assumptions.population.toLocaleString()}) × `
          + `Penetration (${assumptions.penetration}%) × `
          + `Frequency (${assumptions.frequency}/year) × `
          + `Price ($${assumptions.price})`
      };

      await submitAttempt(prompt.id, JSON.stringify(response), prompt.timeLimit * 60);
      onComplete();
    } catch (error) {
      console.error('Failed to submit market sizing attempt:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [assumptions, calculateMarketSize, onComplete, prompt.id, prompt.timeLimit, submitAttempt]);

  // Requirement: User Management - Tracks user progress and performance
  const handleTimeUp = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Check if all assumptions are valid
  const isValid = useCallback(() => {
    return Object.values(errors).every(error => !error) &&
           Object.values(assumptions).every(value => value > 0);
  }, [errors, assumptions]);

  return (
    <div className="space-y-6 p-4">
      {/* Timer component for tracking drill duration */}
      <DrillTimer
        duration={prompt.timeLimit * 60}
        drillId={prompt.id}
        onTimeUp={handleTimeUp}
        autoStart={true}
      />

      {/* Market sizing input form */}
      <div className="space-y-4">
        {Object.entries(ASSUMPTION_LABELS).map(([key, label]) => (
          <Input
            key={key}
            label={label}
            type="number"
            value={assumptions[key as keyof typeof assumptions] || ''}
            onChange={(e) => handleAssumptionChange(
              key as keyof typeof assumptions,
              e.target.value
            )}
            error={errors[key]}
            hint={ASSUMPTION_HINTS[key as keyof typeof ASSUMPTION_HINTS]}
            min={VALIDATION_RULES[key as keyof typeof VALIDATION_RULES].min}
            max={VALIDATION_RULES[key as keyof typeof VALIDATION_RULES].max}
            step="any"
            className="w-full"
          />
        ))}
      </div>

      {/* Market size calculation result */}
      {isValid() && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Calculated Market Size</h3>
          <p className="text-2xl font-mono">
            ${calculateMarketSize().toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleComplete}
        disabled={!isValid() || isCalculating}
        className={cn(
          "w-full py-2 px-4 rounded-lg font-medium",
          isValid() && !isCalculating
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        )}
      >
        {isCalculating ? 'Submitting...' : 'Submit Market Sizing'}
      </button>
    </div>
  );
};