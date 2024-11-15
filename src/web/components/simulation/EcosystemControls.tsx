/**
 * Human Tasks:
 * 1. Verify all environment parameter ranges match backend validation
 * 2. Test keyboard navigation flows with screen readers
 * 3. Validate color contrast ratios for parameter labels
 */

// react ^18.0.0
import React from 'react';

// Internal imports
import { EnvironmentParameters, SimulationStatus } from '../../types/simulation';
import { useSimulation } from '../../hooks/useSimulation';
import Select from '../shared/Select';
import Button from '../shared/Button';

// Environment parameter options with ARIA-compliant labels
const TEMPERATURE_OPTIONS = [
  { value: '15', label: '15°C' },
  { value: '20', label: '20°C' },
  { value: '25', label: '25°C' }
];

const DEPTH_OPTIONS = [
  { value: '30', label: '30m' },
  { value: '50', label: '50m' },
  { value: '70', label: '70m' }
];

const SALINITY_OPTIONS = [
  { value: '30', label: '30cm/s' },
  { value: '35', label: '35cm/s' },
  { value: '40', label: '40cm/s' }
];

const LIGHT_LEVEL_OPTIONS = [
  { value: '50', label: '50%' },
  { value: '75', label: '75%' },
  { value: '100', label: '100%' }
];

interface EcosystemControlsProps {
  className?: string;
}

/**
 * EcosystemControls component providing WCAG 2.1 AA compliant interface for simulation management
 * Requirements addressed:
 * - McKinsey Simulation: Ecosystem game replication with time-pressured scenarios
 * - Simulation Engine: Handles ecosystem game logic and state management
 * - Accessibility Requirements: WCAG 2.1 AA compliant controls
 */
export default function EcosystemControls({ className }: EcosystemControlsProps): JSX.Element {
  const {
    simulationState,
    loading,
    updateEnvironment,
    startSimulation,
    stopSimulation,
    resetSimulation
  } = useSimulation();

  // Handle environment parameter changes with validation
  const handleEnvironmentChange = (
    paramName: keyof EnvironmentParameters,
    value: string
  ) => {
    if (!simulationState) return;

    const numericValue = Number(value);
    const updatedEnvironment: EnvironmentParameters = {
      ...simulationState.environment,
      [paramName]: numericValue
    };

    updateEnvironment(updatedEnvironment);
  };

  const isRunning = simulationState?.status === SimulationStatus.RUNNING;
  const isSetup = simulationState?.status === SimulationStatus.SETUP;

  return (
    <div 
      className={className}
      role="region"
      aria-label="Ecosystem Simulation Controls"
    >
      {/* Environment Parameters Section */}
      <div
        role="group"
        aria-label="Environment Parameters"
        className="space-y-4 mb-6"
      >
        <Select
          value={String(simulationState?.environment.temperature ?? '20')}
          options={TEMPERATURE_OPTIONS}
          onChange={(value) => handleEnvironmentChange('temperature', value)}
          placeholder="Select Temperature"
          disabled={isRunning || loading}
          aria-label="Temperature"
        />

        <Select
          value={String(simulationState?.environment.depth ?? '50')}
          options={DEPTH_OPTIONS}
          onChange={(value) => handleEnvironmentChange('depth', value)}
          placeholder="Select Depth"
          disabled={isRunning || loading}
          aria-label="Water Depth"
        />

        <Select
          value={String(simulationState?.environment.salinity ?? '35')}
          options={SALINITY_OPTIONS}
          onChange={(value) => handleEnvironmentChange('salinity', value)}
          placeholder="Select Salinity"
          disabled={isRunning || loading}
          aria-label="Water Salinity"
        />

        <Select
          value={String(simulationState?.environment.lightLevel ?? '75')}
          options={LIGHT_LEVEL_OPTIONS}
          onChange={(value) => handleEnvironmentChange('lightLevel', value)}
          placeholder="Select Light Level"
          disabled={isRunning || loading}
          aria-label="Light Level"
        />
      </div>

      {/* Simulation Control Buttons */}
      <div
        role="group"
        aria-label="Simulation Controls"
        className="flex flex-col space-y-3"
      >
        {isSetup && (
          <Button
            variant="primary"
            onClick={startSimulation}
            disabled={loading}
            isLoading={loading}
            aria-label="Start Simulation"
          >
            Start Simulation
          </Button>
        )}

        {isRunning && (
          <Button
            variant="secondary"
            onClick={stopSimulation}
            disabled={loading}
            isLoading={loading}
            aria-label="Stop Simulation"
          >
            Stop Simulation
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={resetSimulation}
          disabled={loading}
          aria-label="Reset Simulation"
        >
          Reset Simulation
        </Button>
      </div>
    </div>
  );
}