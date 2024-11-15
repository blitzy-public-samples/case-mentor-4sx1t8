/**
 * API endpoint for evaluating McKinsey ecosystem simulation attempts
 * 
 * Requirements addressed:
 * - McKinsey Simulation: Ecosystem game replication with time-pressured scenarios and complex data analysis
 * - AI Evaluation: AI evaluation and feedback for simulation performance
 */

// next/server v13.0.0
import { NextRequest, NextResponse } from 'next/server';

// Internal imports
import { SimulationEvaluator } from '../../../lib/simulation/evaluator';
import { SimulationState, SimulationResult } from '../../../types/simulation';
import { withAuth } from '../../../lib/auth/middleware';

// Human Tasks:
// 1. Set up monitoring for evaluation performance metrics
// 2. Configure error tracking for failed evaluations
// 3. Set up analytics for tracking common simulation patterns
// 4. Review and adjust evaluation thresholds based on user performance data

/**
 * Handles POST requests to evaluate a simulation attempt
 * Requirement: McKinsey Simulation - Complex data analysis
 */
export const POST = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    // Extract simulation ID from route parameters
    const simulationId = params.id;
    if (!simulationId) {
      return NextResponse.json(
        { error: 'Simulation ID is required' },
        { status: 400 }
      );
    }

    // Get auth context from middleware
    const auth = (req as any).auth;
    if (!auth?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Retrieve current simulation state from request body
    const simulationState: SimulationState = await req.json();

    // Validate simulation ownership
    if (simulationState.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Access denied to this simulation' },
        { status: 403 }
      );
    }

    // Validate simulation ID matches
    if (simulationState.id !== simulationId) {
      return NextResponse.json(
        { error: 'Simulation ID mismatch' },
        { status: 400 }
      );
    }

    // Initialize evaluator with validated state
    const evaluator = new SimulationEvaluator(simulationState);

    // Generate evaluation results
    const evaluationResult: SimulationResult = await evaluator.evaluateSimulation();

    // Return formatted response with complete evaluation data
    return NextResponse.json(
      {
        success: true,
        data: {
          simulationId: evaluationResult.simulationId,
          score: evaluationResult.score,
          survivingSpecies: evaluationResult.survivingSpecies,
          feedback: evaluationResult.feedback,
          ecosystemSurvived: evaluationResult.ecosystemSurvived,
          timeElapsedSeconds: evaluationResult.timeElapsedSeconds
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Simulation evaluation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to evaluate simulation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, {
  requiredPermissions: ['SIMULATION_EVALUATE']
});