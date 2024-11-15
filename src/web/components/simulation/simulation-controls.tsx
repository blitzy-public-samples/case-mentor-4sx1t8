// @package react ^18.0.0
// @package classnames ^2.3.0

// Human Tasks:
// 1. Verify environment parameter ranges match production ecosystem requirements
// 2. Test species balance validation with domain experts
// 3. Validate simulation performance under maximum species load
// 4. Configure proper error tracking for validation failures

import React from 'react';
import cn from 'classnames';
import { SimulationConfig, Species, EnvironmentParameter } from '../../types/simulation';
import { useSimulation } from '../../hooks/use-simulation';
import { Button } from '../common/button';

/**
 * @requirement McKinsey Simulation
 * Validation rules for species selection and ecosystem balance
 */
const VALIDATION_RULES = {
  MIN_PRODUCERS: 3,
  MIN_CONSUMERS: 5,
  MAX_TOTAL_SPECIES: 8
};

/**
 * @requirement McKinsey Simulation
 * Environment parameter constraints for ecosystem stability
 */
const ENVIRONMENT_LIMITS = {
  TEMPERATURE: { MIN: 15, MAX: 25 },
  DEPTH: { MIN: 30, MAX: 70 },
  SALINITY: { MIN: 30, MAX: 40 }
};

interface SimulationControlsProps {
  simulationId: string;
  className?: string;
  onComplete: () => void;
}

/**
 * @requirement McKinsey Simulation
 * Component for managing simulation controls and ecosystem parameters
 */
export const SimulationControls = React.memo<SimulationControlsProps>(({
  simulationId,
  className,
  onComplete
}) => {
  const {
    simulationState,
    updateSpecies,
    updateEnvironment
  } = useSimulation(simulationId);

  const baseClasses = 'flex flex-col space-y-6 p-4 rounded-lg border border-gray-200';

  /**
   * @requirement McKinsey Simulation
   * Validates and updates species selection with ecosystem balance rules
   */
  const handleSpeciesUpdate = async (selectedSpeciesIds: string[]) => {
    try {
      const selectedSpecies = simulationState.selectedSpeciesIds;
      const producerCount = selectedSpecies.filter(id => id.startsWith('PRODUCER')).length;
      const consumerCount = selectedSpecies.filter(id => id.startsWith('CONSUMER')).length;

      // Validate minimum species requirements
      if (producerCount < VALIDATION_RULES.MIN_PRODUCERS) {
        throw new Error(`Minimum ${VALIDATION_RULES.MIN_PRODUCERS} producer species required`);
      }

      if (consumerCount < VALIDATION_RULES.MIN_CONSUMERS) {
        throw new Error(`Minimum ${VALIDATION_RULES.MIN_CONSUMERS} consumer species required`);
      }

      // Validate total species count
      if (selectedSpeciesIds.length > VALIDATION_RULES.MAX_TOTAL_SPECIES) {
        throw new Error(`Maximum ${VALIDATION_RULES.MAX_TOTAL_SPECIES} species allowed`);
      }

      await updateSpecies(selectedSpeciesIds);
    } catch (error) {
      console.error('Species validation failed:', error);
      throw error;
    }
  };

  /**
   * @requirement McKinsey Simulation
   * Validates and updates environment parameters within defined limits
   */
  const handleEnvironmentUpdate = async (params: EnvironmentParameter) => {
    try {
      // Validate temperature range
      if (params.temperature < ENVIRONMENT_LIMITS.TEMPERATURE.MIN || 
          params.temperature > ENVIRONMENT_LIMITS.TEMPERATURE.MAX) {
        throw new Error(`Temperature must be between ${ENVIRONMENT_LIMITS.TEMPERATURE.MIN}°C and ${ENVIRONMENT_LIMITS.TEMPERATURE.MAX}°C`);
      }

      // Validate depth range
      if (params.depth < ENVIRONMENT_LIMITS.DEPTH.MIN || 
          params.depth > ENVIRONMENT_LIMITS.DEPTH.MAX) {
        throw new Error(`Depth must be between ${ENVIRONMENT_LIMITS.DEPTH.MIN}m and ${ENVIRONMENT_LIMITS.DEPTH.MAX}m`);
      }

      // Validate salinity range
      if (params.salinity < ENVIRONMENT_LIMITS.SALINITY.MIN || 
          params.salinity > ENVIRONMENT_LIMITS.SALINITY.MAX) {
        throw new Error(`Salinity must be between ${ENVIRONMENT_LIMITS.SALINITY.MIN} and ${ENVIRONMENT_LIMITS.SALINITY.MAX}`);
      }

      await updateEnvironment(params);
    } catch (error) {
      console.error('Environment validation failed:', error);
      throw error;
    }
  };

  /**
   * @requirement McKinsey Simulation
   * Initiates simulation after validating complete configuration
   */
  const handleSimulationStart = async () => {
    try {
      // Validate complete species configuration
      if (!simulationState.selectedSpeciesIds.length) {
        throw new Error('No species selected');
      }

      // Validate environment parameters are set
      if (!simulationState.timeRemaining.minutes && !simulationState.timeRemaining.seconds) {
        throw new Error('Simulation duration not set');
      }

      onComplete();
    } catch (error) {
      console.error('Simulation start failed:', error);
      throw error;
    }
  };

  return (
    <div className={cn(baseClasses, className)}>
      {/* Species Selection Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Species Selection</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Available Species</h4>
            {simulationState.selectedSpeciesIds.map(id => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                onClick={() => handleSpeciesUpdate(
                  simulationState.selectedSpeciesIds.filter(speciesId => speciesId !== id)
                )}
              >
                {id}
              </Button>
            ))}
          </div>
          <div>
            <h4 className="font-medium">Selected ({simulationState.selectedSpeciesIds.length}/{VALIDATION_RULES.MAX_TOTAL_SPECIES})</h4>
            <p className="text-sm text-gray-500">
              Min. Producers: {VALIDATION_RULES.MIN_PRODUCERS}, Min. Consumers: {VALIDATION_RULES.MIN_CONSUMERS}
            </p>
          </div>
        </div>
      </div>

      {/* Environment Controls Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Environment Parameters</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Temperature (°C)</label>
            <input
              type="range"
              min={ENVIRONMENT_LIMITS.TEMPERATURE.MIN}
              max={ENVIRONMENT_LIMITS.TEMPERATURE.MAX}
              step="0.1"
              className="w-full"
              onChange={(e) => handleEnvironmentUpdate({
                ...simulationState.environment,
                temperature: parseFloat(e.target.value)
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Depth (m)</label>
            <input
              type="range"
              min={ENVIRONMENT_LIMITS.DEPTH.MIN}
              max={ENVIRONMENT_LIMITS.DEPTH.MAX}
              step="1"
              className="w-full"
              onChange={(e) => handleEnvironmentUpdate({
                ...simulationState.environment,
                depth: parseFloat(e.target.value)
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Salinity</label>
            <input
              type="range"
              min={ENVIRONMENT_LIMITS.SALINITY.MIN}
              max={ENVIRONMENT_LIMITS.SALINITY.MAX}
              step="0.1"
              className="w-full"
              onChange={(e) => handleEnvironmentUpdate({
                ...simulationState.environment,
                salinity: parseFloat(e.target.value)
              })}
            />
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => {
            handleSpeciesUpdate([]);
            handleEnvironmentUpdate({
              temperature: 20,
              depth: 50,
              salinity: 35,
              lightLevel: 100
            });
          }}
        >
          Reset
        </Button>
        <Button
          variant="primary"
          onClick={handleSimulationStart}
          disabled={!simulationState.selectedSpeciesIds.length}
        >
          Start Simulation
        </Button>
      </div>
    </div>
  );
});

SimulationControls.displayName = 'SimulationControls';