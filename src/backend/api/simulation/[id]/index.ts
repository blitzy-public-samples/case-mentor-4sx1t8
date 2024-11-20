/**
 * API endpoint handler for managing individual simulation instances
 * Human Tasks:
 * 1. Configure rate limiting for API endpoints
 * 2. Set up monitoring for API performance metrics
 * 3. Configure caching headers for GET responses
 */

import { NextRequest, NextResponse } from 'next/server'; // v13.0.0
import { 
  SimulationState,
  Species,
  EnvironmentParameter
} from '../../../../types/simulation';
import { 
  getSimulationById,
  updateSimulationState,
  deleteSimulation
} from '../../../../lib/database/queries/simulations';
import { withAuth } from '../../../../lib/auth/middleware';

/**
 * GET handler for retrieving simulation state
 * Requirements addressed:
 * - McKinsey Simulation: Complex data analysis
 * - System Performance: <200ms API response time
 */
export const GET = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    // Validate simulation ID
    if (!params.id || typeof params.id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid simulation ID' },
        { status: 400 }
      );
    }

    // Get authenticated user ID from request context
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Retrieve simulation state
    const simulation = await getSimulationById(params.id);
    
    // Verify user has access to this simulation
    if (simulation.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Return simulation state with cache headers
    return new NextResponse(JSON.stringify(simulation), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=10' // Cache for 10 seconds
      }
    });

  } catch (error) {
    console.error('Error retrieving simulation:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve simulation' },
      { status: 500 }
    );
  }
});

/**
 * PUT handler for updating simulation state
 * Requirements addressed:
 * - McKinsey Simulation: Time-pressured scenarios
 * - System Performance: Optimized database operations
 */
export const PUT = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    // Validate simulation ID
    if (!params.id || typeof params.id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid simulation ID' },
        { status: 400 }
      );
    }

    // Get authenticated user ID
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const updateData: SimulationState = await req.json();
    
    // Validate required fields
    if (!validateSimulationUpdate(updateData)) {
      return NextResponse.json(
        { error: 'Invalid update payload' },
        { status: 400 }
      );
    }

    // Verify user owns the simulation
    const existingSimulation = await getSimulationById(params.id);
    if (existingSimulation.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update simulation state
    const updatedSimulation = await updateSimulationState(
      params.id,
      updateData
    );

    return NextResponse.json(updatedSimulation, { status: 200 });

  } catch (error) {
    console.error('Error updating simulation:', error);
    return NextResponse.json(
      { error: 'Failed to update simulation' },
      { status: 500 }
    );
  }
});

/**
 * DELETE handler for removing simulations
 * Requirements addressed:
 * - System Performance: Optimized database operations
 */
export const DELETE = withAuth(async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    // Validate simulation ID
    if (!params.id || typeof params.id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid simulation ID' },
        { status: 400 }
      );
    }

    // Get authenticated user ID
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Delete simulation
    await deleteSimulation(params.id, userId);

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Error deleting simulation:', error);
    return NextResponse.json(
      { error: 'Failed to delete simulation' },
      { status: 500 }
    );
  }
});

/**
 * Validates simulation update payload
 * Requirements addressed:
 * - McKinsey Simulation: Complex data analysis
 */
function validateSimulationUpdate(data: SimulationState): boolean {
  // Validate required fields
  if (!data.id || !data.userId || !Array.isArray(data.selectedSpecies)) {
    return false;
  }

  // Validate selected species
  if (!data.selectedSpecies.every(validateSpecies)) {
    return false;
  }

  // Validate environment parameters
  if (!validateEnvironment(data.environment)) {
    return false;
  }

  return true;
}

/**
 * Validates species configuration
 */
function validateSpecies(species: Species): boolean {
  return (
    typeof species.id === 'string' &&
    typeof species.type === 'string' &&
    typeof species.populationSize === 'number' &&
    species.populationSize >= 0
  );
}

/**
 * Validates environment parameters
 */
function validateEnvironment(env: EnvironmentParameter): boolean {
  return (
    typeof env.temperature === 'number' &&
    typeof env.depth === 'number' &&
    typeof env.salinity === 'number' &&
    typeof env.lightLevel === 'number'
  );
}