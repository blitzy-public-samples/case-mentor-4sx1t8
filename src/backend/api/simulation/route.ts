// Third-party imports
import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { z } from 'zod'; // ^3.22.0

// Internal imports
import { SimulationService } from '../../services/SimulationService';
import { withAuth, requireSubscription } from '../../lib/auth/middleware';
import {
  SimulationExecutionContext,
  Species,
  Environment,
  SimulationState,
  SimulationResult
} from '../../lib/simulation/types';

/**
 * Human Tasks:
 * 1. Configure rate limiting for simulation endpoints
 * 2. Set up monitoring for simulation performance metrics
 * 3. Configure error tracking and alerting for simulation failures
 * 4. Review and adjust request validation thresholds
 */

// Initialize simulation service
const simulationService = new SimulationService();

// Request validation schemas
const startSimulationSchema = z.object({
  action: z.literal('start'),
  context: z.object({
    timeLimit: z.number().min(300).max(3600),
    config: z.record(z.any())
  })
});

const updateSpeciesSchema = z.object({
  action: z.literal('updateSpecies'),
  simulationId: z.string().uuid(),
  species: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string()
  }))
});

const updateEnvironmentSchema = z.object({
  action: z.literal('updateEnvironment'),
  simulationId: z.string().uuid(),
  environment: z.object({
    temperature: z.number(),
    depth: z.number(),
    salinity: z.number(),
    lightLevel: z.number()
  })
});

/**
 * POST handler for simulation initialization and updates
 * @requirement McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 * @requirement API Response Times - <200ms API response time for 95% of requests
 */
export const POST = withAuth(
  requireSubscription(['PREMIUM'])(
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const body = await req.json();
        const { action } = body;

        switch (action) {
          case 'start': {
            const { context } = startSimulationSchema.parse(body);
            const result = await simulationService.startSimulation(
              req.user.id,
              context as SimulationExecutionContext
            );
            return NextResponse.json(result);
          }

          case 'updateSpecies': {
            const { simulationId, species } = updateSpeciesSchema.parse(body);
            const result = await simulationService.updateSpecies(
              simulationId,
              species as Species[]
            );
            return NextResponse.json(result);
          }

          case 'updateEnvironment': {
            const { simulationId, environment } = updateEnvironmentSchema.parse(body);
            const result = await simulationService.updateEnvironment(
              simulationId,
              environment as Environment
            );
            return NextResponse.json(result);
          }

          default:
            return NextResponse.json(
              { error: 'Invalid action' },
              { status: 400 }
            );
        }
      } catch (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
  )
);

/**
 * PUT handler for executing simulation time steps
 * @requirement McKinsey Simulation - Time-pressured scenarios
 */
export const PUT = withAuth(
  requireSubscription(['PREMIUM'])(
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { simulationId } = await req.json();
        if (!simulationId) {
          return NextResponse.json(
            { error: 'Simulation ID required' },
            { status: 400 }
          );
        }

        const result = await simulationService.executeTimeStep(simulationId);
        return NextResponse.json(result);
      } catch (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
  )
);

/**
 * GET handler for retrieving current simulation state
 * @requirement API Response Times - <200ms API response time
 */
export const GET = withAuth(
  requireSubscription(['PREMIUM'])(
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const simulationId = req.nextUrl.searchParams.get('simulationId');
        if (!simulationId) {
          return NextResponse.json(
            { error: 'Simulation ID required' },
            { status: 400 }
          );
        }

        const state = await simulationService.executeTimeStep(simulationId);
        return NextResponse.json(state);
      } catch (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
  )
);

/**
 * DELETE handler for completing simulation
 * @requirement McKinsey Simulation - Complex data analysis
 */
export const DELETE = withAuth(
  requireSubscription(['PREMIUM'])(
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const simulationId = req.nextUrl.searchParams.get('simulationId');
        if (!simulationId) {
          return NextResponse.json(
            { error: 'Simulation ID required' },
            { status: 400 }
          );
        }

        const result = await simulationService.completeSimulation(simulationId);
        return NextResponse.json(result);
      } catch (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
  )
);