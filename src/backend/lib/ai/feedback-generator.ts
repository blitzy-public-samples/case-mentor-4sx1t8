/**
 * Specialized module for generating structured, actionable feedback for case interview practice attempts
 * 
 * Human Tasks Required:
 * 1. Configure OpenAI API key in environment variables
 * 2. Monitor feedback generation response times to ensure <200ms target
 * 3. Review and tune feedback templates for each drill type
 * 4. Set up error monitoring for feedback generation failures
 */

import { OpenAI } from 'openai'; // v4.0.0
import { DrillEvaluator } from './evaluator';
import { getPromptTemplate, generatePrompt } from './prompt-templates';
import { DrillAttempt, DrillFeedback } from '../../types/drills';

/**
 * Configuration options for feedback generation
 * Requirement: AI evaluation - Structured evaluation results
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export interface FeedbackOptions {
  detailed: boolean;
  includeExamples: boolean;
  maxSuggestions: number;
}

/**
 * Context information for feedback generation
 * Requirement: Practice Drills - Drill-specific feedback
 * Location: 3. SCOPE/Core Features/Practice Drills
 */
interface FeedbackContext {
  drillType: string;
  criteriaScores: Record<string, number>;
  evaluationResult: Record<string, any>;
}

/**
 * Core class for generating structured feedback from AI evaluations
 * Requirement: AI evaluation - Feedback generation
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export class FeedbackGenerator {
  private readonly openaiClient: OpenAI;
  private readonly evaluator: DrillEvaluator;
  private readonly defaultTimeout = 200; // 200ms target response time

  constructor(openaiClient: OpenAI, evaluator: DrillEvaluator) {
    this.openaiClient = openaiClient;
    this.evaluator = evaluator;
  }

  /**
   * Generates comprehensive feedback for a drill attempt
   * Requirement: Practice Drills - Comprehensive feedback
   * Location: 3. SCOPE/Core Features/Practice Drills
   */
  public async generateFeedback(
    attempt: DrillAttempt,
    context: FeedbackContext,
    options: FeedbackOptions = { detailed: true, includeExamples: true, maxSuggestions: 3 }
  ): Promise<DrillFeedback> {
    try {
      // Get feedback prompt template for drill type
      const promptTemplate = getPromptTemplate(context.drillType);

      // Generate feedback prompt with context
      const feedbackPrompt = generatePrompt(promptTemplate, {
        response: JSON.stringify(attempt.response),
        scores: JSON.stringify(context.criteriaScores),
        evaluation: JSON.stringify(context.evaluationResult),
        detailed: options.detailed.toString(),
        maxSuggestions: options.maxSuggestions.toString()
      });

      // Generate feedback using OpenAI
      const completion = await Promise.race([
        this.openaiClient.chat.completions.create({
          messages: [
            { role: 'system', content: feedbackPrompt }
          ],
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 1000,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Feedback generation timeout')), this.defaultTimeout)
        )
      ]);

      // Parse and format feedback
      const rawFeedback = this.parseAIResponse(completion);
      return this.formatFeedback(rawFeedback, attempt.id);

    } catch (error) {
      throw new Error(`Failed to generate feedback: ${error.message}`);
    }
  }

  /**
   * Formats raw AI feedback into structured DrillFeedback object
   * Requirement: Practice Drills - Structured feedback format
   * Location: 3. SCOPE/Core Features/Practice Drills
   */
  private formatFeedback(
    rawFeedback: Record<string, any>,
    attemptId: string
  ): DrillFeedback {
    // Validate required feedback components
    if (!rawFeedback.overall || !rawFeedback.criteria || 
        !rawFeedback.improvements || !rawFeedback.strengths) {
      throw new Error('Invalid feedback format from AI');
    }

    // Format into DrillFeedback structure
    const feedback: DrillFeedback = {
      attemptId,
      overallFeedback: rawFeedback.overall,
      criteriaFeedback: rawFeedback.criteria,
      improvementAreas: Array.isArray(rawFeedback.improvements) 
        ? rawFeedback.improvements 
        : [rawFeedback.improvements],
      strengths: Array.isArray(rawFeedback.strengths)
        ? rawFeedback.strengths
        : [rawFeedback.strengths]
    };

    return feedback;
  }

  /**
   * Parses and validates AI response
   */
  private parseAIResponse(completion: any): Record<string, any> {
    try {
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Invalid AI response format');
      }
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse AI feedback: ${error.message}`);
    }
  }
}