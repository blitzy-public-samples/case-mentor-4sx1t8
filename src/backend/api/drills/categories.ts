/**
 * API module for drill category management and metadata
 * 
 * Human Tasks:
 * - Verify time limits for each drill category align with user testing feedback
 * - Review skills targeted for each category with subject matter experts
 * - Ensure category metadata aligns with frontend display requirements
 */

import { DrillType } from '../../types/drills';

/**
 * Interface defining metadata structure for drill categories
 * Requirement: Practice Drills - Define and manage different drill types
 */
interface DrillCategoryMetadata {
  title: string;
  description: string;
  timeLimit: number;
  skillsTargeted: string[];
}

/**
 * Comprehensive mapping of drill categories to their metadata
 * Requirement: Practice Drills - Define and manage Case Prompt, Calculations,
 * Case Math, Brainstorming, Market Sizing, and Synthesizing Drills
 */
export const DRILL_CATEGORIES: Record<DrillType, DrillCategoryMetadata> = {
  CASE_PROMPT: {
    title: 'Case Prompt Drills',
    description: 'Practice analyzing and structuring complex business cases',
    timeLimit: 900, // 15 minutes
    skillsTargeted: ['Problem Structuring', 'Business Acumen', 'Communication']
  },
  CALCULATIONS: {
    title: 'Calculation Drills',
    description: 'Improve speed and accuracy in business calculations',
    timeLimit: 600, // 10 minutes
    skillsTargeted: ['Numerical Agility', 'Mental Math', 'Accuracy']
  },
  CASE_MATH: {
    title: 'Case Math Drills',
    description: 'Master complex mathematical scenarios in business context',
    timeLimit: 720, // 12 minutes
    skillsTargeted: ['Business Math', 'Problem Solving', 'Estimation']
  },
  BRAINSTORMING: {
    title: 'Brainstorming Drills',
    description: 'Develop creative problem-solving abilities',
    timeLimit: 480, // 8 minutes
    skillsTargeted: ['Creativity', 'Idea Generation', 'Innovation']
  },
  MARKET_SIZING: {
    title: 'Market Sizing Drills',
    description: 'Practice estimating market sizes and opportunities',
    timeLimit: 600, // 10 minutes
    skillsTargeted: ['Estimation', 'Market Analysis', 'Logic']
  },
  SYNTHESIZING: {
    title: 'Synthesizing Drills',
    description: 'Learn to combine insights and form recommendations',
    timeLimit: 540, // 9 minutes
    skillsTargeted: ['Analysis', 'Communication', 'Decision Making']
  }
};

/**
 * Retrieves metadata for a specific drill category
 * Requirement: System Performance - Support <200ms API response time
 * @param type The drill type to retrieve metadata for
 * @returns The metadata for the specified drill category
 */
export function getDrillCategoryMetadata(type: DrillType): DrillCategoryMetadata {
  if (!DRILL_CATEGORIES[type]) {
    throw new Error(`Invalid drill type: ${type}`);
  }
  return DRILL_CATEGORIES[type];
}

/**
 * Returns all available drill categories with their metadata
 * Requirement: System Performance - Support <200ms API response time
 * @returns Complete mapping of all drill categories to their metadata
 */
export function getAllDrillCategories(): Record<DrillType, DrillCategoryMetadata> {
  return DRILL_CATEGORIES;
}

/**
 * Validates if a given string is a valid drill type
 * Requirement: Practice Drills - Ensure type safety in drill management
 * @param type The string to validate as a drill type
 * @returns Boolean indicating whether the type is valid
 */
export function validateDrillType(type: string): type is DrillType {
  return type in DRILL_CATEGORIES;
}