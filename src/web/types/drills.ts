// Import subscription tier for access control
import { UserSubscriptionTier } from './user';

/**
 * Human Tasks:
 * 1. Ensure drill evaluation criteria are properly configured in the backend
 * 2. Set up proper date serialization for drill attempts and progress tracking
 * 3. Configure proper validation rules for drill responses in frontend forms
 * 4. Verify time limit enforcement mechanisms are in place
 */

// Requirement: Practice Drills - Comprehensive drill type system
export enum DrillType {
  CASE_PROMPT = 'CASE_PROMPT',
  CALCULATION = 'CALCULATION',
  CASE_MATH = 'CASE_MATH',
  BRAINSTORMING = 'BRAINSTORMING',
  MARKET_SIZING = 'MARKET_SIZING',
  SYNTHESIZING = 'SYNTHESIZING'
}

// Requirement: Practice Drills - Progressive learning path with difficulty levels
export enum DrillDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

// Requirement: Practice Drills - Structured feedback system
export interface DrillFeedback {
  score: number;
  comments: string[];
  strengths: string[];
  improvements: string[];
}

// Requirement: Practice Drills - Subscription-gated drill content
export interface DrillPrompt {
  id: string;
  type: DrillType;
  difficulty: DrillDifficulty;
  title: string;
  description: string;
  timeLimit: number; // in minutes
  industry: string;
  requiredTier: UserSubscriptionTier;
}

// Requirement: User Management - Tracking drill attempts and performance
export interface DrillAttempt {
  id: string;
  promptId: string;
  userId: string;
  response: string;
  timeSpent: number; // in seconds
  score: number;
  feedback: DrillFeedback;
  createdAt: Date;
}

// Requirement: User Management - Progress tracking per drill type
export interface DrillProgress {
  drillType: DrillType;
  attemptsCount: number;
  averageScore: number;
  bestScore: number;
  lastAttemptDate: Date;
}

// Requirement: Practice Drills - API response wrapper with error handling
export interface DrillResponse {
  success: boolean;
  data: DrillPrompt | DrillAttempt | DrillProgress | null;
  error: string | null;
}