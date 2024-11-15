/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 AA compliance with automated testing tools
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate color contrast ratios meet accessibility standards
 */

// react v18.0.0
'use client';
import * as React from 'react';
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority';

import SimulationCard from '../../components/simulation/SimulationCard';
import EcosystemCanvas from '../../components/simulation/EcosystemCanvas';
import SpeciesSelector from '../../components/simulation/SpeciesSelector';
import { useSimulation } from '../../hooks/useSimulation';

// Styles for responsive layout and proper color contrast
const pageStyles = {
  container: cn(
    'min-h-screen w-full p-6',
    'bg-slate-50 dark:bg-slate-900'
  ),
  header: cn(
    'mb-8 space-y-2'
  ),
  title: cn(
    'text-3xl font-bold tracking-tight',
    'text-slate-900 dark:text-slate-50'
  ),
  description: cn(
    'text-lg text-slate-600 dark:text-slate-400'
  ),
  grid: cn(
    'grid gap-6',
    'lg:grid-cols-[1fr_400px]'
  ),
  mainContent: cn(
    'space-y-6'
  ),
  controls: cn(
    'flex items-center justify-between',
    'p-4 rounded-lg',
    'bg-white dark:bg-slate-800',
    'shadow-sm'
  ),
  button: cn(
    'px-4 py-2 rounded-md font-medium',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transition-colors duration-200',
    {
      primary: [
        'bg-blue-600 text-white',
        'hover:bg-blue-700',
        'focus:ring-blue-500'
      ],
      secondary: [
        'bg-slate-200 text-slate-900',
        'hover:bg-slate-300',
        'focus:ring-slate-500',
        'dark:bg-slate-700 dark:text-slate-100'
      ]
    }
  )
};

/**
 * Main page component for the McKinsey ecosystem simulation interface
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
export default function SimulationPage() {
  const {
    simulationState,
    loading,
    startSimulation,
    stopSimulation,
    resetSimulation
  } = useSimulation();

  // Handle simulation start with validation
  const handleStartSimulation = async () => {
    if (!simulationState?.species.length) {
      return; // Show error toast about species selection
    }
    await startSimulation();
  };

  // Handle simulation stop and cleanup
  const handleStopSimulation = async () => {
    await stopSimulation();
  };

  return (
    <main className={pageStyles.container}>
      {/* Page Header */}
      <header className={pageStyles.header} role="banner">
        <h1 className={pageStyles.title}>
          Ecosystem Simulation
        </h1>
        <p className={pageStyles.description}>
          Configure and run ecosystem simulations to analyze species interactions and environmental impacts
        </p>
      </header>

      {/* Main Content Grid */}
      <div className={pageStyles.grid}>
        {/* Left Column - Visualization and Controls */}
        <div className={pageStyles.mainContent}>
          {/* Simulation Canvas */}
          <section 
            aria-label="Ecosystem Visualization"
            role="region"
          >
            <EcosystemCanvas 
              className="w-full rounded-lg overflow-hidden"
              width={800}
              height={600}
            />
          </section>

          {/* Simulation Controls */}
          <section 
            className={pageStyles.controls}
            role="region"
            aria-label="Simulation Controls"
          >
            <div className="flex gap-4">
              <button
                className={cn(
                  pageStyles.button.primary,
                  loading && 'opacity-50 cursor-not-allowed'
                )}
                onClick={handleStartSimulation}
                disabled={loading || !simulationState?.species.length}
                aria-busy={loading}
              >
                Start Simulation
              </button>
              <button
                className={pageStyles.button.secondary}
                onClick={handleStopSimulation}
                disabled={loading || !simulationState?.species.length}
              >
                Stop Simulation
              </button>
              <button
                className={pageStyles.button.secondary}
                onClick={resetSimulation}
                disabled={loading}
              >
                Reset
              </button>
            </div>
          </section>

          {/* Species Selection */}
          <section 
            aria-label="Species Configuration"
            role="region"
          >
            <SpeciesSelector 
              className="w-full"
            />
          </section>
        </div>

        {/* Right Column - Simulation Status and Info */}
        <aside>
          <SimulationCard
            simulation={simulationState!}
            loading={loading}
            className="sticky top-6"
          />
        </aside>
      </div>
    </main>
  );
}