// Third-party imports
import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { z } from 'zod'; // ^3.22.0

// Internal imports
import { SimulationService } from '../../../services/SimulationService';
import { withAuth, requireSubscription } from '../../../lib/auth/middleware';
import { handleError } from '../../../lib/errors/handlers';

/**
 * Human Tasks:
 * 1. Configure rate limiting for simulation endpoints
 * 2. Set up monitoring for simulation performance metrics
 * 3. Review and adjust request validation schemas
 * 4. Configure error tracking for simulation failures
 */

// Request validation schemas
const updateRequestSchema = z.object({
  type: z.enum(['species', 'environment']),
  data: z.record(z.any())
});

const actionRequestSchema = z.object({
  action: z.enum(['timeStep', 'complete'])
});

// Initialize simulation service
const simulationService = new SimulationService();

/**
 * GET handler for retrieving simulation state
 * @requirement McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 * @requirement System Performance - <200ms API response time for 95% of requests
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> => {
    try {
      const { id } = params;
      const state = await simulationService.executeTimeStep(id);
      
      return NextResponse.json({
        success: true,
        data: state,
        error: null,
        metadata: { simulationId: id }
      });
    } catch (error) {
      return handleError(error, request.headers.get('x-request-id') || '');
    }
  },
  { requireAuth: true }
);

/**
 * PUT handler for updating simulation parameters
 * @requirement McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 * @requirement System Performance - <200ms API response time for 95% of requests
 */
export const PUT = withAuth(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> => {
    try {
      const { id } = params;
      const body = await request.json();
      
      // Validate request body
      const { type, data } = updateRequestSchema.parse(body);
      
      // Update simulation based on type
      const updatedState = type === 'species'
        ? await simulationService.updateSpecies(id, data)
        : await simulationService.updateEnvironment(id, data);
      
      return NextResponse.json({
        success: true,
        data: updatedState,
        error: null,
        metadata: { simulationId: id, updateType: type }
      });
    } catch (error) {
      return handleError(error, request.headers.get('x-request-id') || '');
    }
  },
  { requireAuth: true }
);

/**
 * POST handler for simulation execution and completion
 * @requirement McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 * @requirement System Performance - <200ms API response time for 95% of requests
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> => {
    try {
      const { id } = params;
      const body = await request.json();
      
      // Validate request body
      const { action } = actionRequestSchema.parse(body);
      
      // Execute action based on type
      const result = action === 'timeStep'
        ? await simulationService.executeTimeStep(id)
        : await simulationService.completeSimulation(id);
      
      return NextResponse.json({
        success: true,
        data: result,
        error: null,
        metadata: { simulationId: id, action }
      });
    } catch (error) {
      return handleError(error, request.headers.get('x-request-id') || '');
    }
  },
  { requireAuth: true }
);

// Apply subscription tier requirement to all handlers
export const { GET: AuthenticatedGET } = { GET: requireSubscription(['BASIC', 'PREMIUM'])(GET) };
export const { PUT: AuthenticatedPUT } = { PUT: requireSubscription(['BASIC', 'PREMIUM'])(PUT) };
export const { POST: AuthenticatedPOST } = { POST: requireSubscription(['BASIC', 'PREMIUM'])(POST) };