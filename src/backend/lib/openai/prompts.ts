// @ts-check
import { DrillType } from '../../types/drills';
import { DrillEvaluationCriteria } from '../drills/types';
import { openaiConfig } from '../../config/openai';

/**
 * Human Tasks:
 * 1. Review and validate drill-specific prompt templates for accuracy
 * 2. Ensure evaluation criteria weights are properly calibrated
 * 3. Monitor and adjust temperature settings based on response quality
 * 4. Set up tracking for prompt token usage and optimization
 */

/**
 * @fileoverview Manages system prompts and templates for OpenAI interactions
 * Requirements addressed:
 * - AI Evaluation (2. SYSTEM OVERVIEW/Core Services)
 * - Practice Drills (3. SCOPE/Core Features/Practice Drills)
 */

// Base system prompt for all evaluations
export const SYSTEM_PROMPT_BASE = 'You are an expert consulting case interview evaluator with extensive experience at top firms like McKinsey, Bain, and BCG.';

// Maximum allowed prompt length to prevent token overflow
export const MAX_PROMPT_LENGTH = 4096;

// Temperature settings optimized for each drill type
export const TEMPERATURE_BY_DRILL_TYPE: Record<DrillType, number> = {
    [DrillType.CASE_PROMPT]: 0.7,
    [DrillType.CALCULATION]: 0.3,
    [DrillType.CASE_MATH]: 0.3,
    [DrillType.BRAINSTORMING]: 0.8,
    [DrillType.MARKET_SIZING]: 0.5,
    [DrillType.SYNTHESIZING]: 0.7
};

// Pre-defined prompt templates for each drill type
export const DRILL_PROMPTS = {
    // @requirement: Practice Drills - Case Prompt evaluation
    CASE_PROMPT: `${SYSTEM_PROMPT_BASE}
Evaluate the candidate's case prompt response considering:
1. Problem structuring and framework development
2. Key question identification
3. Initial hypothesis formation
4. Clarity of communication`,

    // @requirement: Practice Drills - Calculations evaluation
    CALCULATIONS: `${SYSTEM_PROMPT_BASE}
Evaluate the candidate's calculation approach considering:
1. Mathematical accuracy
2. Logical step progression
3. Assumption clarity
4. Unit handling and conversions`,

    // @requirement: Practice Drills - Market Sizing evaluation
    MARKET_SIZING: `${SYSTEM_PROMPT_BASE}
Evaluate the candidate's market sizing methodology considering:
1. Segmentation approach
2. Assumption quality
3. Calculation accuracy
4. Logic flow`,

    // @requirement: Practice Drills - Brainstorming evaluation
    BRAINSTORMING: `${SYSTEM_PROMPT_BASE}
Evaluate the candidate's brainstorming capabilities considering:
1. Idea diversity and creativity
2. Structured thinking
3. Practicality of solutions
4. Comprehensiveness`,

    // @requirement: Practice Drills - Synthesizing evaluation
    SYNTHESIZING: `${SYSTEM_PROMPT_BASE}
Evaluate the candidate's synthesis capabilities considering:
1. Key insight identification
2. Prioritization of findings
3. Recommendation clarity
4. Supporting evidence usage`
};

/**
 * Generates a customized evaluation prompt for a specific drill type
 * @requirement: AI Evaluation - Consistent evaluation methodology
 */
export function generateDrillPrompt(drillType: DrillType, criteria: DrillEvaluationCriteria): string {
    // Validate drill type
    if (!Object.values(DrillType).includes(drillType)) {
        throw new Error(`Invalid drill type: ${drillType}`);
    }

    // Get base prompt for drill type
    const basePrompt = DRILL_PROMPTS[drillType] || DRILL_PROMPTS.CASE_PROMPT;

    // Construct evaluation criteria section
    const criteriaPrompt = criteria.rubric.criteria
        .map((criterion, index) => {
            const weight = criteria.weights[criterion] || 0;
            return `${index + 1}. ${criterion} (Weight: ${weight}%)\n${criteria.rubric.scoringGuide[criterion] || ''}`;
        })
        .join('\n\n');

    // Combine prompts with evaluation instructions
    const fullPrompt = `${basePrompt}

Evaluation Criteria:
${criteriaPrompt}

Instructions:
1. Evaluate the response against each criterion
2. Provide a score (0-${criteria.rubric.maxScore}) for each criterion
3. Weight the scores according to the specified weights
4. Provide specific examples and justification for each score
5. Include actionable improvement suggestions

Response Format:
{
    "scores": { [criterion: string]: number },
    "weightedTotal": number,
    "justification": { [criterion: string]: string },
    "improvements": string[]
}`;

    // Validate prompt length
    if (fullPrompt.length > MAX_PROMPT_LENGTH) {
        throw new Error('Generated prompt exceeds maximum length');
    }

    return fullPrompt;
}

/**
 * Generates a feedback prompt based on evaluation results
 * @requirement: AI Evaluation - Detailed feedback generation
 */
export function generateFeedbackPrompt(evaluation: any): string {
    const feedbackPrompt = `${SYSTEM_PROMPT_BASE}

Based on the following evaluation results:
${JSON.stringify(evaluation, null, 2)}

Generate detailed feedback following these guidelines:
1. Highlight 2-3 key strengths with specific examples
2. Identify 2-3 priority areas for improvement
3. Provide actionable recommendations for each improvement area
4. Include specific examples from the response
5. Maintain a constructive and encouraging tone

Response Format:
{
    "strengths": string[],
    "improvements": string[],
    "recommendations": { [area: string]: string },
    "summary": string
}`;

    // Validate prompt length
    if (feedbackPrompt.length > MAX_PROMPT_LENGTH) {
        throw new Error('Generated feedback prompt exceeds maximum length');
    }

    return feedbackPrompt;
}