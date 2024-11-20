// react version: ^18.0.0
// next version: ^13.0.0

/**
 * Human Tasks:
 * 1. Configure performance monitoring for simulation results page
 * 2. Set up error boundaries for chart component failures
 * 3. Implement data export functionality for simulation results
 * 4. Configure proper data caching strategy for API responses
 */

import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ResultsChart, { ResultsChartProps } from '@/components/simulation/results-chart';
import { SimulationControls } from '@/components/simulation/simulation-controls';
import { apiClient } from '@/lib/api-client';

interface SimulationResultsPageProps {
  params: {
    id: string;
  };
}

interface SimulationConfig {
  selectedSpecies: Array<{
    id: string;
    name: string;
    type: 'PRODUCER' | 'CONSUMER' | 'DECOMPOSER';
  }>;
  environment: {
    temperature: number;
    depth: number;
    salinity: number;
    lightLevel: number;
  };
}

interface SimulationMetrics {
  populationTrends: Record<string, number[]>;
  environmentalImpact: {
    biodiversityIndex: number;
    stabilityScore: number;
    sustainabilityRating: number;
  };
  performance: {
    responseTime: number;
    iterationCount: number;
    convergenceRate: number;
  };
}

interface SimulationResult {
  id: string;
  config: SimulationConfig;
  metrics: SimulationMetrics;
  timestamp: Date;
}

/**
 * @requirement McKinsey Simulation
 * Generates metadata for the simulation results page for SEO optimization
 */
export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Simulation Results #${params.id} | Case Interview Practice Platform`,
    description: 'Detailed analysis of ecosystem simulation results including population trends and environmental impacts',
    openGraph: {
      title: `Simulation Results #${params.id}`,
      description: 'McKinsey ecosystem simulation analysis and performance metrics',
      type: 'article'
    }
  };
}

/**
 * @requirement McKinsey Simulation
 * Fetches simulation results data from the API with caching and error handling
 */
async function fetchSimulationResults(id: string): Promise<SimulationResult> {
  try {
    const response = await apiClient.get<SimulationResult>(
      `/api/simulations/${id}/results`,
      undefined,
      {
        cache: true,
        retry: true,
        validateRequest: true
      }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch simulation results');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching simulation results:', error);
    throw error;
  }
}

/**
 * @requirement McKinsey Simulation, System Performance
 * Main page component for displaying simulation results with interactive charts and controls
 */
async function SimulationResultsPage({ params }: SimulationResultsPageProps) {
  const simulationData = await fetchSimulationResults(params.id);

  if (!simulationData) {
    notFound();
  }

  const { config, metrics } = simulationData;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Ecosystem Simulation Results
      </h1>

      {/* Results Overview Section */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Biodiversity Index</h2>
          <p className="text-4xl font-bold text-blue-600">
            {metrics.environmentalImpact.biodiversityIndex.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Stability Score</h2>
          <p className="text-4xl font-bold text-green-600">
            {metrics.environmentalImpact.stabilityScore.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Sustainability Rating</h2>
          <p className="text-4xl font-bold text-purple-600">
            {metrics.environmentalImpact.sustainabilityRating.toFixed(2)}
          </p>
        </div>
      </section>

      {/* Population Trends Chart */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Population Trends</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading chart...</div>}>
            <ResultsChart
              simulationId={params.id}
              config={config}
              showLegend={true}
              className="w-full"
            />
          </Suspense>
        </div>
      </section>

      {/* Environmental Impact Analysis */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Environmental Parameters</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Configuration</h3>
              <ul className="space-y-2">
                <li>Temperature: {config.environment.temperature}°C</li>
                <li>Depth: {config.environment.depth}m</li>
                <li>Salinity: {config.environment.salinity}</li>
                <li>Light Level: {config.environment.lightLevel}%</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <ul className="space-y-2">
                <li>Response Time: {metrics.performance.responseTime}ms</li>
                <li>Iterations: {metrics.performance.iterationCount}</li>
                <li>Convergence Rate: {metrics.performance.convergenceRate}%</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Simulation Controls */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Simulation Controls</h2>
        <SimulationControls
          simulationId={params.id}
          className="bg-white rounded-lg shadow-md"
          onComplete={() => {
            // Handle simulation completion
            console.log('Simulation completed');
          }}
        />
      </section>
    </main>
  );
}

export default SimulationResultsPage;