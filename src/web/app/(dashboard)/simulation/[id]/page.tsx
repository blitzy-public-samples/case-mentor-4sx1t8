/**
 * Human Tasks:
 * 1. Configure analytics tracking for simulation engagement metrics
 * 2. Verify WCAG 2.1 AA compliance with automated testing tools
 * 3. Test responsive layout across different device sizes
 */

// react ^18.0.0
'use client';
import React, { Suspense } from 'react';

// Internal imports
import EcosystemCanvas from '../../../components/simulation/EcosystemCanvas';
import EcosystemControls from '../../../components/simulation/EcosystemControls';
import SimulationResults from '../../../components/simulation/SimulationResults';
import { useSimulation } from '../../../hooks/useSimulation';

// Canvas dimensions from globals
const SIMULATION_CANVAS_WIDTH = 1024;
const SIMULATION_CANVAS_HEIGHT = 768;

/**
 * Loading component for simulation page
 * Requirement: WCAG 2.1 AA compliant interface with proper loading states
 */
const SimulationLoading = () => (
  <div 
    className="flex items-center justify-center min-h-screen"
    role="status"
    aria-label="Loading simulation"
  >
    <div className="animate-pulse space-y-4">
      <div className="h-48 w-96 bg-gray-200 rounded-lg" />
      <div className="h-8 w-64 mx-auto bg-gray-200 rounded" />
      <div className="space-y-2">
        <div className="h-4 w-48 mx-auto bg-gray-200 rounded" />
        <div className="h-4 w-36 mx-auto bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

/**
 * Error component for simulation failures
 * Requirement: WCAG 2.1 AA compliant interface with proper error handling
 */
const SimulationError = ({ message }: { message: string }) => (
  <div 
    className="flex flex-col items-center justify-center min-h-screen p-4"
    role="alert"
    aria-live="assertive"
  >
    <div className="text-red-600 text-xl font-semibold mb-2">
      Simulation Error
    </div>
    <p className="text-gray-600 text-center max-w-md">
      {message}
    </p>
  </div>
);

/**
 * Main simulation page component
 * Requirements addressed:
 * - McKinsey Simulation: Ecosystem game replication with time-pressured scenarios
 * - Simulation Engine: Handles ecosystem game logic and state management
 */
export default function SimulationPage({ params }: { params: { id: string } }): JSX.Element {
  const {
    simulationState,
    simulationResult,
    loading,
    error,
    resetSimulation
  } = useSimulation();

  // Handle simulation errors
  if (error) {
    return <SimulationError message={error} />;
  }

  return (
    <Suspense fallback={<SimulationLoading />}>
      <main 
        className="min-h-screen bg-gray-50 p-4 md:p-6"
        role="main"
        aria-label="Ecosystem Simulation Interface"
      >
        <div className="max-w-7xl mx-auto">
          {/* Simulation Header */}
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Ecosystem Simulation
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your ecosystem parameters and observe species interactions
            </p>
          </header>

          {/* Main Simulation Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Simulation Canvas */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-sm overflow-hidden">
              <EcosystemCanvas
                width={SIMULATION_CANVAS_WIDTH}
                height={SIMULATION_CANVAS_HEIGHT}
                className="w-full h-auto"
              />
            </div>

            {/* Simulation Controls */}
            <div className="lg:col-span-1">
              <EcosystemControls 
                className="bg-white rounded-lg shadow-sm p-4"
              />
            </div>
          </div>

          {/* Simulation Results */}
          {simulationResult && (
            <div className="mt-6">
              <SimulationResults
                result={simulationResult}
                onReset={resetSimulation}
              />
            </div>
          )}
        </div>
      </main>
    </Suspense>
  );
}