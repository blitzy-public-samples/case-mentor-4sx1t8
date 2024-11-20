/**
 * Core AI evaluation module for processing user drill responses
 * 
 * Human Tasks Required:
 * 1. Configure OpenAI API key in environment variables
 * 2. Monitor response times and adjust timeouts if needed
 * 3. Review and tune evaluation criteria weights
 * 4. Set up error monitoring for API failures
 */

import { OpenAI } from 'openai'; // v4.0.0
import { getPromptTemplate, generatePrompt, PromptTemplate } from './prompt-templates';
import { getModelConfig, ModelConfig } from '../../config/ai';
import { 
  DrillTemplate, 
  DrillAttempt, 
  DrillFeedback,
  DrillCategory
} from '../../types/drills';

/**
 * Requirement: AI evaluation - Structured evaluation results
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export interface EvaluationResult {
  overallScore: number;
  criteriaScores: Record<string, number>;
  feedback: string;
  improvementAreas: string[];
  strengths: string[];
}

/**
 * Requirement: AI evaluation - Evaluation configuration options
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export interface EvaluationOptions {
  detailed: boolean;
  streaming: boolean;
  timeout: number;
}

/**
 * Requirement: AI evaluation - Core evaluation class
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export class DrillEvaluator {
  private readonly openaiClient: OpenAI;
  private readonly maxRetries: number;
  private readonly defaultTimeout: number = 200; // 200ms target response time

  constructor(openaiClient: OpenAI, maxRetries: number = 3) {
    this.openaiClient = openaiClient;
    this.maxRetries = maxRetries;
  }

  /**
   * Requirement: Practice Drills - Evaluate user responses
   * Location: 3. SCOPE/Core Features/Practice Drills
   */
  public async evaluateResponse(
    template: DrillTemplate,
    attempt: DrillAttempt,
    options: EvaluationOptions = { detailed: true, streaming: false, timeout: this.defaultTimeout }
  ): Promise<EvaluationResult> {
    try {
      // Get drill-specific prompt template
      const promptTemplate = getPromptTemplate(template.type);
      
      // Get model configuration for the drill type
      const modelConfig = getModelConfig(template.type as DrillCategory);

      // Generate evaluation prompt
      const evaluationPrompt = generatePrompt(promptTemplate, {
        drillPrompt: template.description,
        response: JSON.stringify(attempt.response),
        criteria: template.evaluationCriteria.map(c => 
          `${c.category} (${c.weight}%)`).join('\n')
      });

      // Make API call with retry logic and timeout
      const completion = await this.makeOpenAIRequest(
        evaluationPrompt,
        modelConfig,
        options.timeout
      );

      // Parse AI response
      const aiResponse = this.parseAIResponse(completion);

      // Calculate scores
      const criteriaScores = this.calculateScores(template, aiResponse);
      const overallScore = this.calculateOverallScore(criteriaScores, template);

      // Generate structured feedback
      const feedback: EvaluationResult = {
        overallScore,
        criteriaScores,
        feedback: aiResponse.feedback,
        improvementAreas: aiResponse.improvementAreas || [],
        strengths: aiResponse.strengths || []
      };

      return feedback;

    } catch (error) {
      throw new Error(`Evaluation failed: ${error.message}`);
    }
  }

  /**
   * Makes OpenAI API request with retry logic and timeout
   */
  private async makeOpenAIRequest(
    prompt: string,
    modelConfig: ModelConfig,
    timeout: number
  ): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await Promise.race([
          this.openaiClient.chat.completions.create({
            messages: [
              { role: 'system', content: prompt }
            ],
            model: modelConfig.model,
            temperature: modelConfig.temperature,
            max_tokens: modelConfig.maxTokens,
            top_p: modelConfig.topP,
            presence_penalty: modelConfig.presencePenalty,
            frequency_penalty: modelConfig.frequencyPenalty
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);

        return response;

      } catch (error) {
        lastError = error;
        if (attempt === this.maxRetries) break;
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }

    throw new Error(`OpenAI request failed after ${this.maxRetries} attempts: ${lastError?.message}`);
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
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  /**
   * Requirement: Practice Drills - Score calculation
   * Location: 3. SCOPE/Core Features/Practice Drills
   */
  private calculateScores(
    template: DrillTemplate,
    aiResponse: Record<string, any>
  ): Record<string, number> {
    const scores: Record<string, number> = {};

    template.evaluationCriteria.forEach(criteria => {
      const score = aiResponse[criteria.category];
      if (typeof score !== 'number' || score < 0 || score > 100) {
        throw new Error(`Invalid score for criteria: ${criteria.category}`);
      }
      scores[criteria.category] = score;
    });

    return scores;
  }

  /**
   * Calculates weighted overall score
   */
  private calculateOverallScore(
    criteriaScores: Record<string, number>,
    template: DrillTemplate
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    template.evaluationCriteria.forEach(criteria => {
      const score = criteriaScores[criteria.category];
      totalScore += (score * criteria.weight);
      totalWeight += criteria.weight;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }
}