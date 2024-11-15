/**
 * Human Tasks:
 * 1. Configure performance monitoring for chart rendering
 * 2. Set up error boundaries for chart component failures
 * 3. Implement data export functionality for chart results
 * 4. Configure proper data caching strategy for chart updates
 */

// react version: ^18.0.0
import React, { useMemo } from 'react';
// recharts version: ^2.0.0
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { SimulationConfig, Species, EnvironmentParameter } from '../../types/simulation';
import { useSimulation } from '../../hooks/use-simulation';

interface ResultsChartProps {
  simulationId: string;
  config: SimulationConfig;
  showLegend?: boolean;
  className?: string;
}

interface ChartDataPoint {
  timeStep: number;
  populations: Record<string, number>;
  environment: EnvironmentParameter;
}

/**
 * @requirement McKinsey Simulation
 * React component that visualizes ecosystem simulation results using Recharts
 */
const ResultsChart: React.FC<ResultsChartProps> = React.memo(({ 
  simulationId,
  config,
  showLegend = true,
  className = ''
}) => {
  const { simulationState } = useSimulation(simulationId);
  
  /**
   * @requirement Simulation Engine
   * Formats raw simulation data into chart-compatible format
   */
  const formatChartData = (config: SimulationConfig, rawData: any): ChartDataPoint[] => {
    if (!rawData || !Array.isArray(rawData)) {
      return [];
    }

    return rawData.map((dataPoint, index) => {
      const populations: Record<string, number> = {};
      
      // Extract population data for each species
      config.selectedSpecies.forEach((species) => {
        populations[species.name] = dataPoint.populations[species.id] || 0;
      });

      return {
        timeStep: index,
        populations,
        environment: dataPoint.environment
      };
    });
  };

  /**
   * @requirement McKinsey Simulation
   * Memoized chart data to prevent unnecessary recalculations
   */
  const chartData = useMemo(() => {
    return formatChartData(config, simulationState.simulationData);
  }, [config, simulationState.simulationData]);

  /**
   * @requirement McKinsey Simulation
   * Generate unique colors for each species based on their type
   */
  const getSpeciesColor = (species: Species): string => {
    const colorMap = {
      PRODUCER: '#2ecc71',
      CONSUMER: '#e74c3c',
      DECOMPOSER: '#f39c12'
    };
    return colorMap[species.type];
  };

  return (
    <div className={`results-chart-container ${className}`}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timeStep"
            label={{ value: 'Time Steps', position: 'bottom' }}
          />
          <YAxis
            label={{ value: 'Population', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="custom-tooltip bg-white p-3 shadow-lg rounded">
                    <p className="font-bold">Time Step: {label}</p>
                    {payload.map((entry: any) => (
                      <p key={entry.name} style={{ color: entry.color }}>
                        {entry.name}: {entry.value.toFixed(2)}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
            />
          )}
          
          {/* Render population lines for each species */}
          {config.selectedSpecies.map((species) => (
            <Line
              key={species.id}
              type="monotone"
              dataKey={`populations.${species.name}`}
              name={species.name}
              stroke={getSpeciesColor(species)}
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

ResultsChart.displayName = 'ResultsChart';

export default ResultsChart;