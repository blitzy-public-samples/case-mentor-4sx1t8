// react version: ^18.0.0
import React, { useState, useEffect, useMemo } from 'react';
// recharts version: ^2.0.0
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
// class-variance-authority version: ^1.0.0
import { cn } from 'class-variance-authority';

import type { DrillTemplate, DrillType, DrillDifficulty } from '../../types/drills';
import { useDrills } from '../../hooks/use-drills';
import { calculateProgress } from '../../lib/utils';

// Human Tasks:
// 1. Configure monitoring for chart render performance
// 2. Set up error tracking for data processing failures
// 3. Review color scheme for accessibility compliance

interface ProgressChartProps {
  className?: string;
  drillTypes: DrillType[];
  showLegend?: boolean;
}

interface ChartData {
  category: string;
  completed: number;
  score: number;
  total: number;
}

const CHART_COLORS = {
  completed: '#3B82F6', // blue-500
  score: '#22C55E', // green-500
};

const processChartData = (drills: DrillTemplate[], attempts: any[]): ChartData[] => {
  // Requirement: User Management - Progress tracking and performance analytics
  const drillsByType = drills.reduce((acc, drill) => {
    if (!acc[drill.type]) {
      acc[drill.type] = {
        total: 0,
        completed: 0,
        scores: [] as number[],
      };
    }
    acc[drill.type].total += 1;
    return acc;
  }, {} as Record<string, { total: number; completed: number; scores: number[] }>);

  // Process attempts and calculate metrics
  attempts.forEach(attempt => {
    const drill = drills.find(d => d.id === attempt.drillId);
    if (drill && attempt.status === 'COMPLETED') {
      drillsByType[drill.type].completed += 1;
      if (attempt.score !== null) {
        drillsByType[drill.type].scores.push(attempt.score);
      }
    }
  });

  // Format data for chart consumption
  return Object.entries(drillsByType).map(([type, data]) => ({
    category: type.replace(/_/g, ' '),
    completed: calculateProgress(data.completed, data.total),
    score: data.scores.length > 0
      ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
      : 0,
    total: data.total,
  }));
};

export default function ProgressChart({
  className,
  drillTypes,
  showLegend = true,
}: ProgressChartProps): JSX.Element {
  // Requirement: System Performance - Efficient data visualization
  const { drills, userAttempts, loading, error } = useDrills({
    type: null,
    difficulty: null,
  });

  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Memoize chart data processing for performance
  const processedData = useMemo(() => {
    if (!drills?.length || !userAttempts?.length) return [];
    const filteredDrills = drills.filter(drill => 
      drillTypes.includes(drill.type)
    );
    return processChartData(filteredDrills, userAttempts);
  }, [drills, userAttempts, drillTypes]);

  useEffect(() => {
    setChartData(processedData);
  }, [processedData]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="animate-pulse bg-gray-200 rounded-lg w-full h-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-red-500", className)}>
        <p>Error loading progress data</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-64", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
          />
          <YAxis
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value}%`,
              name === 'completed' ? 'Completion Rate' : 'Average Score'
            ]}
          />
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value: string) =>
                value === 'completed' ? 'Completion Rate' : 'Average Score'
              }
            />
          )}
          <Bar
            dataKey="completed"
            fill={CHART_COLORS.completed}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="score"
            fill={CHART_COLORS.score}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}