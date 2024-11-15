/**
 * API endpoint handler for submitting and evaluating McKinsey ecosystem simulation attempts
 * 
 * Requirements addressed:
 * - McKinsey Simulation: Ecosystem game replication with time-pressured scenarios and complex data analysis
 * - System Performance: <200ms API response time for 95% of requests
 */

// next/server v13.0.0
import { NextResponse, NextRequest } from 'next/server';
// zod v3.22.0
import { z } from 'zod';

import { SimulationState, Species, SpeciesType } from '../../../types/simulation';
import { SimulationEvaluator } from '../../../lib/simulation/evaluator';
import { withAuth } from '../../../lib/auth/middleware';

/**
 * Human Tasks:
 * 1. Configure monitoring for attempt timeouts
 * 2. Set up alerts for high error rates
 * 3. Review and adjust MAX_SPECIES_COUNT based on performance testing
 */

// Global constants
const ATTEMPT_TIMEOUT_MS = 1800000; // 30 minutes
const MAX_SPECIES_COUNT = 8;

// Validation schema for attempt request
const environmentSchema = z.object({
  temperature: z.number().min(-10).max(50),
  depth: z.number().min(0).max(1000),
  salinity: z.number().min(0).max(100),
  lightLevel: z.number().min(0).max(100)
});

const speciesSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['PRODUCER', 'CONSUMER', 'DECOMPOSER']),
  populationSize: z.number().min(1).max(1000),
  preySpecies: z.array(z.string()),
  energyConsumption: z.number().min(0).max(100),
  reproductionRate: z.number().min(0).max(1)
});

const attemptRequestSchema = z.object({
  selectedSpecies: z.array(speciesSchema).min(2).max(MAX_SPECIES_COUNT),
  environment: environmentSchema
});

/**
 * Validates the simulation attempt request payload
 * Requirement: McKinsey Simulation - Complex data analysis
 */
function validateAttemptRequest(requestBody: any): boolean {
  try {
    const validatedData = attemptRequestSchema.parse(requestBody);
    
    // Check for required species types
    const speciesTypes = new Set(validatedData.selectedSpecies.map(s => s.type));
    if (!speciesTypes.has('PRODUCER') || !speciesTypes.has('CONSUMER')) {
      return false;
    }

    // Validate prey relationships
    const speciesIds = new Set(validatedData.selectedSpecies.map(s => s.id));
    const validPreyRelations = validatedData.selectedSpecies
      .filter(s => s.type === 'CONSUMER')
      .every(consumer => 
        consumer.preySpecies.length > 0 && 
        consumer.preySpecies.every(preyId => speciesIds.has(preyId))
      );

    return validPreyRelations;
  } catch (error) {
    return false;
  }
}

/**
 * Handles simulation attempt submission and evaluation
 * Requirements:
 * - McKinsey Simulation: Time-pressured scenarios
 * - System Performance: <200ms response time
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    // Extract simulation ID from URL
    const simulationId = request.url.split('/simulation/')[1].split('/attempt')[0];

    // Parse and validate request body
    const requestBody = await request.json();
    if (!validateAttemptRequest(requestBody)) {
      return NextResponse.json(
        { error: 'Invalid simulation attempt data' },
        { status: 400 }
      );
    }

    // Create simulation state
    const simulationState: SimulationState = {
      id: simulationId,
      selectedSpecies: requestBody.selectedSpecies,
      environment: requestBody.environment,
      timeRemaining: { minutes: 30, seconds: 0 }, // Default duration
      score: {
        speciesBalance: 0,
        survivalRate: 0,
        ecosystemStability: 0,
        totalScore: 0
      }
    };

    // Create evaluator instance
    const evaluator = new SimulationEvaluator(simulationState);

    // Process simulation with timeout
    const evaluationPromise = evaluator.evaluateSimulation();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Simulation timeout')), ATTEMPT_TIMEOUT_MS);
    });

    // Wait for evaluation or timeout
    const result = await Promise.race([evaluationPromise, timeoutPromise]);

    // Generate feedback
    const feedback = evaluator.generateFeedback(result.score);

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        feedback
      }
    });

  } catch (error) {
    if (error.message === 'Simulation timeout') {
      return NextResponse.json(
        { error: 'Simulation evaluation timed out' },
        { status: 408 }
      );
    }

    if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    console.error('Simulation attempt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, {
  requiredPermissions: ['SIMULATION_ATTEMPT']
});