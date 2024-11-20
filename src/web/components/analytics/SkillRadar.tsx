// react ^18.0.0
import React from 'react';
// recharts ^2.0.0
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Radar
} from 'recharts';

import { useProgress } from '../../hooks/useProgress';
import { UserProgress } from '../../types/user';
import { DrillType } from '../../types/drills';

/**
 * Human Tasks:
 * 1. Configure monitoring for chart rendering performance
 * 2. Set up error tracking for data transformation failures
 * 3. Verify accessibility compliance for chart interactions
 */

interface SkillRadarProps {
  userId: string;
  className?: string;
}

// Map drill types to readable display names
const DRILL_DISPLAY_NAMES: Record<DrillType, string> = {
  [DrillType.CASE_PROMPT]: 'Case Analysis',
  [DrillType.CALCULATION]: 'Calculations',
  [DrillType.CASE_MATH]: 'Case Math',
  [DrillType.BRAINSTORMING]: 'Brainstorming',
  [DrillType.MARKET_SIZING]: 'Market Sizing',
  [DrillType.SYNTHESIZING]: 'Synthesis'
};

// Format skill data for Recharts radar chart
const formatSkillData = (skillLevels: Record<string, number>) => {
  return Object.entries(skillLevels).map(([skill, level]) => ({
    subject: DRILL_DISPLAY_NAMES[skill as DrillType] || skill,
    score: Math.round(level * 100) // Convert to percentage
  }));
};

/**
 * Radar chart visualization of user's skill levels across different case interview competencies.
 * 
 * Requirement: User Management - Progress tracking and performance analytics visualization
 * for user practice activities
 * 
 * Requirement: System Performance - Visual representation of user performance metrics
 * contributing to >80% completion rate target
 */
const SkillRadar: React.FC<SkillRadarProps> = ({ userId, className = '' }) => {
  const { progress, isLoading, error } = useProgress(userId);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className={`flex items-center justify-center h-64 text-red-500 ${className}`}>
        <p>Failed to load skill data</p>
      </div>
    );
  }

  const skillData = formatSkillData(progress.skillLevels);

  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 10 }}
          />
          <Radar
            name="Skills"
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillRadar;