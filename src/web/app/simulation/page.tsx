'use client';

// @package react ^18.0.0
// @package class-variance-authority ^0.7.0

// Human Tasks:
// 1. Verify simulation performance under maximum load conditions
// 2. Test responsive layout across different screen sizes
// 3. Validate accessibility compliance for simulation controls
// 4. Configure analytics tracking for simulation interactions

import React, { useCallback, useEffect } from 'react';
import { cn } from 'class-variance-authority';
import { EcosystemCanvas } from '../../components/simulation/ecosystem-canvas';
import { SpeciesSelector, handleSpeciesSelect, validateSelection } from '../../components/simulation/species-selector';
import { SimulationControls } from '../../components/simulation/simulation-controls';
import { useSimulation } from '../../hooks/use-simulation';

/**
 * @requirement McKinsey Simulation
 * Canvas dimensions for ecosystem visualization
 */
const CANVAS_DIMENSIONS = {
  width: 800,
  height: 600
} as const;

/**
 * @requirement McKinsey Simulation
 * Duration of simulation in seconds
 */
const SIMULATION_DURATION = 1800;

/**
 * @requirement McKinsey Simulation
 * Main page component for the ecosystem simulation interface
 */
const SimulationPage = () => {
  const {
    simulationState,
    updateSpecies,
    initializeSimulation,
    updateEnvironment
  } = useSimulation();

  /**
   * @requirement McKinsey Simulation
   * Handles simulation completion and results submission
   */
  const handleSimulationComplete = useCallback(async () => {
    try {
      // Validate final ecosystem state
      const isValid = validateSelection(simulationState.selectedSpeciesIds);
      if (!isValid) {
        throw new Error('Invalid ecosystem state at completion');
      }

      // Calculate simulation success metrics
      const speciesBalance = simulationState.selectedSpeciesIds.reduce((acc, id) => {
        const type = id.split('-')[0];
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Initialize new simulation with validated state
      const simulationId = await initializeSimulation({
        selectedSpecies: simulationState.selectedSpeciesIds.map(id => ({
          id,
          populationSize: 100 // Default initial population
        })),
        duration: {
          minutes: Math.floor(SIMULATION_DURATION / 60),
          seconds: SIMULATION_DURATION % 60
        },
        environment: {
          temperature: 20, // Default temperature
          depth: 50, // Default depth
          salinity: 35, // Default salinity
          lightLevel: 100 // Default light level
        }
      });

      // Update environment parameters based on species balance
      await updateEnvironment({
        temperature: 20 + (speciesBalance.PRODUCER || 0),
        depth: 50 + (speciesBalance.CONSUMER || 0) * 2,
        salinity: 35 + (speciesBalance.DECOMPOSER || 0),
        lightLevel: 100
      });

    } catch (error) {
      console.error('Simulation completion failed:', error);
      throw error;
    }
  }, [simulationState.selectedSpeciesIds, initializeSimulation, updateEnvironment]);

  /**
   * @requirement User Interface Design
   * Initialize simulation parameters on component mount
   */
  useEffect(() => {
    const setupSimulation = async () => {
      try {
        await initializeSimulation({
          selectedSpecies: [],
          duration: {
            minutes: Math.floor(SIMULATION_DURATION / 60),
            seconds: SIMULATION_DURATION % 60
          },
          environment: {
            temperature: 20,
            depth: 50,
            salinity: 35,
            lightLevel: 100
          }
        });
      } catch (error) {
        console.error('Failed to setup simulation:', error);
      }
    };

    setupSimulation();
  }, [initializeSimulation]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Species Selection */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold mb-6">Species Selection</h2>
          <SpeciesSelector
            disabled={!simulationState.isSelecting}
          />
        </div>

        {/* Center Column: Ecosystem Visualization */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Ecosystem Visualization</h2>
          <div className={cn(
            'relative rounded-lg overflow-hidden',
            'bg-slate-900 shadow-lg'
          )}>
            <EcosystemCanvas
              species={simulationState.selectedSpeciesIds.map(id => ({
                id,
                name: id.split('-').join(' '),
                type: id.split('-')[0] as any,
                populationSize: 100
              }))}
              parameters={{
                temperature: 20,
                depth: 50,
                salinity: 35,
                lightLevel: 100
              }}
              width={CANVAS_DIMENSIONS.width}
              height={CANVAS_DIMENSIONS.height}
              isRunning={simulationState.isSelecting}
            />
          </div>

          {/* Simulation Controls */}
          <div className="mt-8">
            <SimulationControls
              simulationId={simulationState.selectedSpeciesIds.join(',')}
              onComplete={handleSimulationComplete}
              className="bg-white shadow-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationPage;