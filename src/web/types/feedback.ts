import { APIResponse } from './api';
import { DrillType, DrillFeedback } from './drills';

// Requirement: AI Evaluation - Feedback type classification
export enum FeedbackType {
  AI_EVALUATION = 'AI_EVALUATION',
  SYSTEM_GENERATED = 'SYSTEM_GENERATED',
  PERFORMANCE_SUMMARY = 'PERFORMANCE_SUMMARY'
}

// Requirement: AI Evaluation - Skill-based feedback categorization
export enum FeedbackCategory {
  STRUCTURE = 'STRUCTURE',
  ANALYSIS = 'ANALYSIS',
  CALCULATION = 'CALCULATION',
  COMMUNICATION = 'COMMUNICATION',
  SYNTHESIS = 'SYNTHESIS'
}

// Requirement: AI Evaluation - Feedback prioritization system
export enum FeedbackSeverity {
  CRITICAL = 'CRITICAL',
  IMPORTANT = 'IMPORTANT',
  SUGGESTION = 'SUGGESTION'
}

// Requirement: AI Evaluation - Structured feedback point format
export interface FeedbackPoint {
  id: string;
  category: FeedbackCategory;
  severity: FeedbackSeverity;
  message: string;
  suggestion: string;
}

// Requirement: AI Evaluation - Comprehensive AI-generated feedback structure
export interface AIFeedback {
  id: string;
  drillType: DrillType;
  attemptId: string;
  overallScore: number;
  feedbackPoints: FeedbackPoint[];
  strengths: string[];
  improvements: string[];
  createdAt: Date;
}

// Requirement: Progress Tracking - Historical performance aggregation
export interface FeedbackHistory {
  userId: string;
  drillType: DrillType;
  feedbackList: AIFeedback[];
  averageScore: number;
  commonStrengths: string[];
  commonImprovements: string[];
}

// Requirement: AI Evaluation - API response wrapper for feedback endpoints
export type FeedbackResponse = APIResponse<AIFeedback>;