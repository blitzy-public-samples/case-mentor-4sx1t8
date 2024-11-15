// Third-party imports
import { z } from 'zod'; // ^3.22.0

// Internal imports
import {
  SimulationExecutionContext,
  EcosystemState,
  SimulationMetrics,
  SimulationValidationError,
  SpeciesInteraction,
  InteractionType
} from './types';
import { OpenAIService } from '../openai';
import { SimulationAttempt } from '../../models/SimulationAttempt';

/**
 * Human Tasks:
 * 1. Monitor stability threshold values and adjust based on simulation data
 * 2. Configure OpenAI API rate limits and quotas
 * 3. Set up monitoring for evaluation performance metrics
 * 4. Review and calibrate scoring weights periodically
 */

// Global configuration constants
const STABILITY_THRESHOLD = 0.75;
const MIN_SPECIES_DIVERSITY = 3;
const MAX_ENVIRONMENTAL_STRESS = 0.8;

// Scoring weights for different evaluation aspects
const WEIGHTS = {
  stability: 0.4,
  diversity: 0.3,
  efficiency: 0.2,
  complexity: 0.1
};

/**
 * Evaluates the stability of the ecosystem based on species interactions and environmental factors
 * @requirement McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
export function evaluateEcosystemStability(state: EcosystemState): number {
  // Calculate species diversity score
  const diversityScore = state.species.length / MIN_SPECIES_DIVERSITY;
  
  // Evaluate trophic relationships
  const trophicScore = state.interactions.reduce((score, interaction) => {
    const baseScore = interaction.strength;
    switch (interaction.interactionType) {
      case InteractionType.PREDATION:
        return score + (baseScore * 1.2); // Predation weighted higher for stability
      case InteractionType.SYMBIOSIS:
        return score + (baseScore * 1.1); // Symbiosis promotes stability
      case InteractionType.COMPETITION:
        return score + (baseScore * 0.8); // Competition slightly reduces stability
      default:
        return score + baseScore;
    }
  }, 0) / state.interactions.length;

  // Assess environmental stress factors
  const stressScore = 1 - (state.environment.stressLevel || 0) / MAX_ENVIRONMENTAL_STRESS;

  // Compute overall stability score
  const rawScore = (diversityScore * 0.3) + (trophicScore * 0.4) + (stressScore * 0.3);

  // Return normalized stability value between 0 and 1
  return Math.min(Math.max(rawScore, 0), 1);
}

/**
 * Validates the selected species configuration for ecological viability
 * @requirement AI Evaluation - Core Services: AI evaluation for providing consistent, objective feedback
 */
export async function validateSpeciesConfiguration(
  species: Species[],
  environment: Environment
): Promise<SimulationValidationError | null> {
  // Check minimum species diversity
  if (species.length < MIN_SPECIES_DIVERSITY) {
    return {
      code: 'INSUFFICIENT_DIVERSITY',
      message: `Minimum of ${MIN_SPECIES_DIVERSITY} species required`,
      details: { current: species.length, required: MIN_SPECIES_DIVERSITY }
    };
  }

  // Validate producer-consumer ratios
  const producers = species.filter(s => s.trophicLevel === 1);
  const consumers = species.filter(s => s.trophicLevel > 1);
  if (producers.length === 0 || consumers.length === 0) {
    return {
      code: 'INVALID_TROPHIC_BALANCE',
      message: 'Ecosystem must contain both producers and consumers',
      details: { producers: producers.length, consumers: consumers.length }
    };
  }

  // Verify environmental compatibility
  const incompatibleSpecies = species.filter(s => 
    !s.environmentalRequirements.every(req => 
      environment[req.factor] >= req.minValue && 
      environment[req.factor] <= req.maxValue
    )
  );
  if (incompatibleSpecies.length > 0) {
    return {
      code: 'ENVIRONMENTAL_INCOMPATIBILITY',
      message: 'Some species are incompatible with the environment',
      details: { incompatibleSpecies: incompatibleSpecies.map(s => s.id) }
    };
  }

  // Assess interaction network completeness
  const interactionPairs = new Set(
    species.flatMap(s1 => 
      species.filter(s2 => s1.id !== s2.id)
        .map(s2 => [s1.id, s2.id].sort().join(':'))
    )
  );
  if (interactionPairs.size < (species.length * (species.length - 1)) / 2) {
    return {
      code: 'INCOMPLETE_INTERACTIONS',
      message: 'Interaction network is incomplete',
      details: { 
        current: interactionPairs.size,
        required: (species.length * (species.length - 1)) / 2
      }
    };
  }

  return null;
}

/**
 * Generates detailed AI-powered feedback on simulation performance
 * @requirement AI Evaluation - Core Services: AI evaluation for providing consistent, objective feedback
 */
@retryOnFailure({ maxRetries: 3, retryDelay: 1000 })
async function generateSimulationFeedback(
  metrics: SimulationMetrics,
  finalState: EcosystemState
): Promise<string> {
  const openAIService = new OpenAIService();

  // Analyze stability trends
  const stabilityTrend = metrics.stabilityHistory.slice(-3);
  const trendDirection = stabilityTrend[2] - stabilityTrend[0];

  // Identify critical interactions
  const criticalInteractions = finalState.interactions
    .filter(i => i.strength > 0.7)
    .map(i => ({
      type: i.interactionType,
      species: [i.sourceSpecies, i.targetSpecies]
    }));

  // Generate feedback prompt
  const prompt = `
    Analyze ecosystem simulation results:
    - Species Diversity: ${metrics.speciesDiversity}
    - Trophic Efficiency: ${metrics.trophicEfficiency}
    - Environmental Stress: ${metrics.environmentalStress}
    - Stability Trend: ${trendDirection > 0 ? 'Improving' : 'Declining'}
    - Critical Interactions: ${JSON.stringify(criticalInteractions)}
    
    Provide detailed feedback on:
    1. Ecosystem balance and stability
    2. Species interaction effectiveness
    3. Environmental adaptation
    4. Specific improvement recommendations
  `;

  // Get AI-generated feedback
  const response = await openAIService.sendRequest(prompt, {
    temperature: 0.7,
    maxTokens: 1000
  });

  return response.feedback;
}

/**
 * Core evaluator class for assessing ecosystem simulation performance
 * @requirement McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
export class SimulationEvaluator {
  private openAIService: OpenAIService;
  private context: SimulationExecutionContext;

  constructor(context: SimulationExecutionContext) {
    this.openAIService = new OpenAIService();
    this.context = context;
  }

  /**
   * Evaluates a complete simulation attempt and generates comprehensive feedback
   */
  async evaluateAttempt(
    attempt: SimulationAttempt,
    metrics: SimulationMetrics
  ): Promise<SimulationResult> {
    // Validate final ecosystem state
    const finalState = attempt.getCurrentState();
    const validationError = await validateSpeciesConfiguration(
      finalState.species,
      finalState.environment
    );

    if (validationError) {
      throw new Error(`Invalid final state: ${validationError.message}`);
    }

    // Calculate performance metrics
    const score = this.calculateScore(metrics, finalState);
    
    // Generate AI feedback
    const feedback = await generateSimulationFeedback(metrics, finalState);

    // Compile evaluation results
    const result: SimulationResult = {
      score,
      ecosystemStability: finalState.stabilityScore,
      speciesBalance: metrics.speciesDiversity,
      feedback,
      completedAt: new Date().toISOString()
    };

    // Update attempt record
    await attempt.complete(result);

    return result;
  }

  /**
   * Calculates the final score for a simulation attempt
   */
  calculateScore(metrics: SimulationMetrics, finalState: EcosystemState): number {
    // Weight stability metrics
    const stabilityComponent = finalState.stabilityScore * WEIGHTS.stability;

    // Factor in species diversity
    const diversityComponent = (metrics.speciesDiversity / 100) * WEIGHTS.diversity;

    // Consider time efficiency
    const timeEfficiency = Math.max(0, this.context.timeLimit - metrics.stabilityHistory.length) / this.context.timeLimit;
    const efficiencyComponent = timeEfficiency * WEIGHTS.efficiency;

    // Apply complexity multiplier
    const complexityFactor = Math.log10(finalState.species.length) / Math.log10(MIN_SPECIES_DIVERSITY);
    const complexityComponent = complexityFactor * WEIGHTS.complexity;

    // Calculate final weighted score
    const rawScore = (
      stabilityComponent +
      diversityComponent +
      efficiencyComponent +
      complexityComponent
    ) * 100;

    // Return normalized score between 0 and 100
    return Math.round(Math.min(Math.max(rawScore, 0), 100));
  }
}