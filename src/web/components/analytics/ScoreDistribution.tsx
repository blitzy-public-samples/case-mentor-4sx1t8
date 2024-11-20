// react v18.0.0
import * as React from 'react';
// recharts v2.0.0
import {
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
} from 'recharts';

// Internal imports
import Card from '../shared/Card';
import { useDrill } from '../../hooks/useDrill';
import { DrillType, DrillProgress } from '../../types/drills';

// Human Tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards for chart elements
// 2. Test chart responsiveness across all breakpoints
// 3. Validate screen reader compatibility with chart data

interface ScoreDistributionProps {
  drillType: DrillType;
  className?: string;
}

interface ScoreData {
  range: string;
  frequency: number;
  percentage: number;
}

interface Statistics {
  mean: number;
  median: number;
  mode: number;
}

// Requirement: User Management - Implements progress tracking and performance analytics
const ScoreDistribution: React.FC<ScoreDistributionProps> = ({ drillType, className }) => {
  const { progress, loading, error } = useDrill(drillType);
  const [scoreData, setScoreData] = React.useState<ScoreData[]>([]);
  const [statistics, setStatistics] = React.useState<Statistics>({
    mean: 0,
    median: 0,
    mode: 0,
  });

  // Process drill attempt data into score distribution format
  const processScoreData = (progress: DrillProgress): ScoreData[] => {
    // Create score buckets (0-20, 21-40, etc.)
    const buckets: { [key: string]: number } = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    // Count frequency for each bucket
    const scores = progress.attemptsCount > 0 ? [progress.averageScore, progress.bestScore] : [];
    scores.forEach(score => {
      if (score <= 20) buckets['0-20']++;
      else if (score <= 40) buckets['21-40']++;
      else if (score <= 60) buckets['41-60']++;
      else if (score <= 80) buckets['61-80']++;
      else buckets['81-100']++;
    });

    // Calculate percentages and format data for recharts
    const total = scores.length;
    return Object.entries(buckets).map(([range, frequency]) => ({
      range,
      frequency,
      percentage: total > 0 ? (frequency / total) * 100 : 0,
    }));
  };

  // Calculate statistical measures from score data
  const calculateStatistics = (scores: number[]): Statistics => {
    if (scores.length === 0) {
      return { mean: 0, median: 0, mode: 0 };
    }

    // Calculate mean
    const mean = scores.reduce((acc, score) => acc + score, 0) / scores.length;

    // Calculate median
    const sortedScores = [...scores].sort((a, b) => a - b);
    const median =
      scores.length % 2 === 0
        ? (sortedScores[scores.length / 2 - 1] + sortedScores[scores.length / 2]) / 2
        : sortedScores[Math.floor(scores.length / 2)];

    // Calculate mode
    const frequency: { [key: number]: number } = {};
    scores.forEach(score => {
      frequency[score] = (frequency[score] || 0) + 1;
    });
    const mode = Number(
      Object.entries(frequency).reduce(
        (a, b) => (b[1] > a[1] ? b : a),
        [0, 0]
      )[0]
    );

    return { mean, median, mode };
  };

  // Process data when progress changes
  React.useEffect(() => {
    if (progress) {
      const processedData = processScoreData(progress);
      setScoreData(processedData);

      const scores = progress.attemptsCount > 0 ? [progress.averageScore, progress.bestScore] : [];
      setStatistics(calculateStatistics(scores));
    }
  }, [progress]);

  // Requirement: System Performance - Contributes to user engagement tracking
  if (loading) {
    return (
      <Card className={className} padding="lg">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className} padding="lg">
        <div className="text-error text-center p-4">
          Failed to load score distribution data
        </div>
      </Card>
    );
  }

  return (
    <Card className={className} padding="lg">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">
          Score Distribution - {DrillType[drillType]}
        </h3>
        
        {/* Chart container with accessibility support */}
        <div className="h-64" role="img" aria-label="Score distribution chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="range"
                label={{ value: 'Score Range', position: 'bottom' }}
              />
              <YAxis
                label={{ value: 'Frequency', angle: -90, position: 'left' }}
              />
              <Tooltip
                formatter={(value: number) => [`${value}`, 'Frequency']}
                labelFormatter={(label: string) => `Score Range: ${label}`}
              />
              <Bar
                dataKey="frequency"
                fill="#3B82F6"
                aria-label="Score frequency"
                role="graphics-symbol"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Statistical summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-600">Mean Score</div>
            <div className="text-lg font-semibold">{statistics.mean.toFixed(1)}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-600">Median Score</div>
            <div className="text-lg font-semibold">{statistics.median.toFixed(1)}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-600">Mode Score</div>
            <div className="text-lg font-semibold">{statistics.mode.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ScoreDistribution;