// @package react ^18.0.0
// @package classnames ^2.3.0

// Human Tasks:
// 1. Verify simulation performance metrics with production load
// 2. Test error boundary behavior with different failure scenarios
// 3. Validate loading states across different network conditions
// 4. Configure analytics tracking for simulation completion events

import React from 'react';
import { Metadata } from 'next';
import cn from 'classnames';
import { EcosystemCanvas } from '@/components/simulation/ecosystem-canvas';
import { SimulationControls } from '@/components/simulation/simulation-controls';
import { useSimulation } from '@/hooks/use-simulation';

/**
 * @requirement McKinsey Simulation
 * Default canvas dimensions for ecosystem visualization
 */
const CANVAS_DIMENSIONS = {
  width: 800,
  height: 600
} as const;

interface SimulationPageProps {
  params: {
    id: string;
  };
}

/**
 * @requirement McKinsey Simulation
 * Generates metadata for the simulation page with dynamic title and description
 */
export async function generateMetadata({ params }: SimulationPageProps): Promise<Metadata> {
  return {
    title: `Ecosystem Simulation #${params.id} | McKinsey Game`,
    description: 'Interactive ecosystem simulation with real-time species dynamics and environmental parameter management',
    openGraph: {
      title: `McKinsey Ecosystem Simulation #${params.id}`,
      description: 'Complex ecosystem simulation with time-pressured scenarios',
      type: 'game',
    },
    robots: {
      index: false,
      follow: false,
    }
  };
}

/**
 * @requirement McKinsey Simulation
 * Main simulation page component integrating canvas visualization and controls
 */
export default async function SimulationPage({ params }: SimulationPageProps) {
  const {
    simulationState,
    updateSpecies,
    updateEnvironment,
    timeRemaining
  } = useSimulation(params.id);

  /**
   * @requirement User Interface Design
   * Handle simulation completion and navigate to results
   */
  const handleSimulationComplete = async () => {
    try {
      // Validate final simulation state
      if (simulationState.selectedSpeciesIds.length === 0) {
        throw new Error('No species selected for simulation');
      }

      // Navigate to results page
      window.location.href = `/simulation/${params.id}/results`;
    } catch (error) {
      console.error('Simulation completion failed:', error);
      // Handle error state
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Ecosystem Simulation #{params.id}
            </h1>
            <p className="text-slate-600">
              Time Remaining: {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')}
            </p>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulation Canvas */}
          <div className={cn(
            "lg:col-span-2",
            "bg-white rounded-lg shadow-sm overflow-hidden"
          )}>
            <EcosystemCanvas
              species={simulationState.selectedSpeciesIds.map(id => ({
                id,
                name: id.toLowerCase(),
                type: id.split('_')[0],
                populationSize: 100 // Initial population size
              }))}
              parameters={{
                temperature: 20,
                depth: 50,
                salinity: 35,
                lightLevel: 100
              }}
              width={CANVAS_DIMENSIONS.width}
              height={CANVAS_DIMENSIONS.height}
              isRunning={timeRemaining.minutes > 0 || timeRemaining.seconds > 0}
            />
          </div>

          {/* Simulation Controls */}
          <div className="lg:col-span-1">
            <SimulationControls
              simulationId={params.id}
              className="bg-white shadow-sm"
              onComplete={handleSimulationComplete}
            />
          </div>
        </div>

        {/* Status Messages */}
        <div className="fixed bottom-6 right-6 space-y-2">
          {simulationState.isSelecting && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg shadow-sm">
              Select species to begin simulation
            </div>
          )}
          {timeRemaining.minutes === 0 && timeRemaining.seconds === 0 && (
            <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg shadow-sm">
              Simulation time expired
            </div>
          )}
        </div>
      </div>
    </main>
  );
}