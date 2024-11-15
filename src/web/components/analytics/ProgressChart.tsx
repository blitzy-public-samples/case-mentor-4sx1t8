// react ^18.0.0
import React, { useMemo } from 'react';
// recharts ^2.0.0
import {
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import { useProgress } from '../../hooks/useProgress';
import { UserProgress } from '../../types/user';
import { formatScore, formatDate } from '../../lib/utils';

/**
 * Human Tasks:
 * 1. Configure chart colors in theme system for consistent branding
 * 2. Set up monitoring for chart rendering performance
 * 3. Implement chart data export functionality if needed
 */

interface ProgressChartProps {
  userId: string;
  height?: string;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  drillsRate: number;
  simulationsRate: number;
}

const ProgressChart: React.FC<ProgressChartProps> = ({
  userId,
  height = '400px',
  className = ''
}) => {
  // Requirement: User Management - Progress tracking and performance analytics
  const { progress, isLoading, error } = useProgress(userId);

  // Format data for chart display
  const chartData = useMemo(() => {
    if (!progress) return [];

    // Create data point for current progress
    const currentData: ChartDataPoint = {
      date: formatDate(progress.lastUpdated, 'MMM d, yyyy'),
      drillsRate: progress.drillsSuccessRate,
      simulationsRate: progress.simulationsSuccessRate
    };

    // For demo purposes, we'll create some historical data points
    // In production, this would come from the API
    const historicalData: ChartDataPoint[] = [
      {
        date: formatDate(new Date(progress.lastUpdated.getTime() - 7 * 24 * 60 * 60 * 1000), 'MMM d, yyyy'),
        drillsRate: progress.drillsSuccessRate * 0.9,
        simulationsRate: progress.simulationsSuccessRate * 0.85
      },
      {
        date: formatDate(new Date(progress.lastUpdated.getTime() - 14 * 24 * 60 * 60 * 1000), 'MMM d, yyyy'),
        drillsRate: progress.drillsSuccessRate * 0.8,
        simulationsRate: progress.simulationsSuccessRate * 0.75
      }
    ];

    return [...historicalData, currentData];
  }, [progress]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center text-red-500 ${className}`} style={{ height }}>
        Error loading progress data: {error.message}
      </div>
    );
  }

  if (!progress) {
    return (
      <div className={`flex items-center justify-center text-gray-500 ${className}`} style={{ height }}>
        No progress data available
      </div>
    );
  }

  // Requirement: System Performance - Track and maintain >80% completion rate
  const isPerformanceAlert = progress.drillsSuccessRate < 0.8;

  return (
    <div className={className}>
      {isPerformanceAlert && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          Warning: Drill success rate is below the 80% target threshold
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <Line
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDate(value, 'MMM d')}
          />
          <YAxis
            tickFormatter={(value) => formatScore(value)}
            domain={[0, 1]}
          />
          <Tooltip
            formatter={(value: number) => formatScore(value)}
            labelFormatter={(label) => formatDate(label, 'MMM d, yyyy')}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="drillsRate"
            name="Drills Success Rate"
            stroke="#3B82F6"
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="simulationsRate"
            name="Simulations Success Rate"
            stroke="#22C55E"
            activeDot={{ r: 8 }}
          />
        </Line>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;