// react version: ^18.0.0
// recharts version: ^2.0.0

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

import { DrillTemplate, DrillType, DrillAttempt, DrillMetrics } from '../../types/drills';
import { useDrills } from '../../hooks/use-drills';
import { Card } from '../common/card';

// Human Tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards
// 2. Test with screen readers for proper ARIA label announcements
// 3. Validate chart interactions with keyboard navigation
// 4. Configure monitoring for performance metrics visualization

interface DrillProgressProps {
  className?: string;
  showDetailed?: boolean;
}

interface DrillProgressStats {
  type: DrillType;
  completed: number;
  total: number;
  averageScore: number;
  performanceMetrics: DrillMetrics;
}

// Requirement: User Management - Progress tracking and performance analytics
const calculateProgressStats = (
  drills: DrillTemplate[],
  attempts: DrillAttempt[]
): DrillProgressStats[] => {
  const drillsByType = drills.reduce((acc, drill) => {
    if (!acc[drill.type]) {
      acc[drill.type] = [];
    }
    acc[drill.type].push(drill);
    return acc;
  }, {} as Record<DrillType, DrillTemplate[]>);

  return Object.entries(drillsByType).map(([type, typedrills]) => {
    const typeAttempts = attempts.filter(attempt => 
      typedrills.some(drill => drill.id === attempt.drillId)
    );

    const completed = typeAttempts.filter(
      attempt => attempt.status === 'COMPLETED' || attempt.status === 'EVALUATED'
    ).length;

    const scores = typeAttempts
      .filter(attempt => attempt.score !== null)
      .map(attempt => attempt.score as number);

    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    // Aggregate performance metrics
    const aggregateMetrics: DrillMetrics = {
      timeSpent: typeAttempts.reduce((sum, attempt) => sum + attempt.performanceMetrics.timeSpent, 0),
      attemptsCount: typeAttempts.length,
      averageScore,
      completionRate: typedrills.length > 0 ? (completed / typedrills.length) * 100 : 0,
      strengthAreas: [],
      improvementAreas: []
    };

    return {
      type: type as DrillType,
      completed,
      total: typedrills.length,
      averageScore,
      performanceMetrics: aggregateMetrics
    };
  });
};

// Requirement: Design System Specifications - Core design system tokens
const CHART_COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  background: '#f8fafc',
  grid: '#e2e8f0'
};

export const DrillProgress: React.FC<DrillProgressProps> = ({
  className,
  showDetailed = false
}) => {
  const { drills, userAttempts } = useDrills({
    type: null,
    difficulty: null
  });

  const progressStats = useMemo(() => 
    calculateProgressStats(drills, userAttempts),
    [drills, userAttempts]
  );

  // Requirement: User Management - Performance analytics visualization
  return (
    <div className={className}>
      <Card variant="elevated" padding="large">
        <h2 className="text-xl font-semibold mb-6">Practice Progress Overview</h2>
        
        {/* Radar Chart for Overall Progress */}
        <div className="h-[400px] mb-8" role="img" aria-label="Drill progress radar chart">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={progressStats}>
              <PolarGrid stroke={CHART_COLORS.grid} />
              <PolarAngleAxis
                dataKey="type"
                tick={{ fill: CHART_COLORS.secondary }}
                axisLine={{ stroke: CHART_COLORS.grid }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                axisLine={{ stroke: CHART_COLORS.grid }}
              />
              <Radar
                name="Completion Rate"
                dataKey="performanceMetrics.completionRate"
                stroke={CHART_COLORS.primary}
                fill={CHART_COLORS.primary}
                fillOpacity={0.6}
              />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                labelFormatter={(label: string) => `Drill Type: ${label}`}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {showDetailed && (
          <>
            {/* Detailed Performance Bar Chart */}
            <div className="h-[400px]" role="img" aria-label="Detailed performance metrics">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="type"
                    tick={{ fill: CHART_COLORS.secondary }}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                  />
                  <YAxis
                    tick={{ fill: CHART_COLORS.secondary }}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                  />
                  <Tooltip
                    formatter={(value: number) => value.toFixed(1)}
                    labelFormatter={(label: string) => `Drill Type: ${label}`}
                  />
                  <Legend />
                  <Bar
                    name="Average Score"
                    dataKey="averageScore"
                    fill={CHART_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    name="Completion Rate"
                    dataKey="performanceMetrics.completionRate"
                    fill={CHART_COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Statistics */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progressStats.map((stat) => (
                <Card
                  key={stat.type}
                  variant="bordered"
                  padding="medium"
                  className="flex flex-col"
                >
                  <h3 className="font-semibold mb-2">{stat.type}</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-600">Completed</dt>
                      <dd className="font-medium">
                        {stat.completed} of {stat.total}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Average Score</dt>
                      <dd className="font-medium">{stat.averageScore.toFixed(1)}%</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Time Spent</dt>
                      <dd className="font-medium">
                        {Math.round(stat.performanceMetrics.timeSpent / 60)} minutes
                      </dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export type { DrillProgressProps };