/**
 * NextJS Edge Function API endpoint for creating new McKinsey ecosystem simulation instances
 * 
 * Human Tasks:
 * 1. Configure rate limiting for the API endpoint
 * 2. Set up monitoring for simulation creation performance metrics
 * 3. Configure error tracking for validation failures
 */

import { NextResponse, NextRequest } from 'next/server'; // v13.0.0
import { z } from 'zod'; // ^3.22.0
import { Species, SimulationState, EnvironmentParameter, SpeciesType } from '../../types/simulation';
import { withAuth } from '../../lib/auth/middleware';
import { Ecosystem } from '../../lib/simulation/ecosystem';
import { createSimulation } from '../../lib/database/queries/simulations';

// Global constants from specification
const MIN_SPECIES_COUNT = 3;
const MAX_SPECIES_COUNT = 8;

// Environment parameter validation schema
const environmentSchema = z.object({
  temperature: z.number().min(0).max(100),
  depth: z.number().min(0).max(1000),
  salinity: z.number().min(0).max(100),
  lightLevel: z.number().min(0).max(100)
});

// Species validation schema
const speciesSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['PRODUCER', 'CONSUMER', 'DECOMPOSER']),
  populationSize: z.number().int().positive(),
  preySpecies: z.array(z.string().uuid()).optional(),
  energyConsumption: z.number().positive(),
  reproductionRate: z.number().positive()
});

/**
 * Validates the simulation creation request payload
 * Requirement: McKinsey Simulation - Ecosystem game replication
 */
function validateSimulationRequest(requestBody: any): boolean {
  try {
    // Validate environment parameters
    environmentSchema.parse(requestBody.environment);

    // Validate species array
    const speciesArray = z.array(speciesSchema)
      .min(MIN_SPECIES_COUNT)
      .max(MAX_SPECIES_COUNT)
      .parse(requestBody.selectedSpecies);

    // Check for required species types
    const speciesTypes = new Set(speciesArray.map(s => s.type));
    if (!speciesTypes.has('PRODUCER') || !speciesTypes.has('CONSUMER')) {
      throw new Error('Simulation must include at least one PRODUCER and one CONSUMER');
    }

    // Validate prey species references
    const speciesIds = new Set(speciesArray.map(s => s.id));
    for (const species of speciesArray) {
      if (species.preySpecies) {
        for (const preyId of species.preySpecies) {
          if (!speciesIds.has(preyId)) {
            throw new Error(`Invalid prey species reference: ${preyId}`);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Simulation validation failed:', error);
    return false;
  }
}

/**
 * POST handler for creating new simulation instances
 * Requirements:
 * - McKinsey Simulation: Ecosystem game replication
 * - System Performance: API response time <200ms
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    // Parse request body
    const requestBody = await request.json();

    // Get authenticated user ID
    const userId = request.auth?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate request payload
    if (!validateSimulationRequest(requestBody)) {
      return NextResponse.json(
        { error: 'Invalid simulation configuration' },
        { status: 400 }
      );
    }

    // Create ecosystem instance
    const ecosystem = new Ecosystem(requestBody.environment);

    // Add and validate species
    for (const species of requestBody.selectedSpecies) {
      const success = await ecosystem.addSpecies(species);
      if (!success) {
        return NextResponse.json(
          { error: `Failed to add species: ${species.name}` },
          { status: 400 }
        );
      }
    }

    // Create simulation record in database
    const simulationState = await createSimulation(
      userId,
      requestBody.selectedSpecies,
      requestBody.environment
    );

    // Return success response
    return NextResponse.json(simulationState, { 
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Failed to create simulation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});