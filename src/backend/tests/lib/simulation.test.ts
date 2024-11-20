// Third-party imports
import { describe, it, expect, jest } from '@jest/globals'; // ^29.0.0

// Internal imports
import { EcosystemSimulation } from '../../lib/simulation';
import {
  SimulationExecutionContext,
  SpeciesInteraction,
  InteractionType,
  EcosystemState,
  SimulationMetrics,
  SimulationValidationError
} from '../../lib/simulation/types';
import {
  Species,
  Environment,
  SimulationConfig,
  SpeciesType,
  SimulationState,
  SimulationStatus
} from '../../types/simulation';

/**
 * Human Tasks:
 * 1. Ensure Jest is installed with correct version: npm install @jest/globals@^29.0.0
 * 2. Configure test environment for performance monitoring
 * 3. Set up test coverage reporting
 * 4. Review and adjust performance test thresholds based on production metrics
 */

// Test helper functions
async function setupTestSimulation(config?: Partial<SimulationConfig>): Promise<EcosystemSimulation> {
  const defaultConfig: SimulationConfig = {
    speciesCount: 10,
    timeLimit: 300,
    environmentParams: {
      temperature: 25,
      depth: 100,
      salinity: 35,
      lightLevel: 80
    },
    ...config
  };

  const mockSpecies = generateMockSpecies(defaultConfig.speciesCount);
  const simulation = new EcosystemSimulation();
  await simulation.initializeEcosystem(mockSpecies, defaultConfig.environmentParams);
  return simulation;
}

function generateMockSpecies(count: number): Species[] {
  const species: Species[] = [];
  const producerCount = Math.ceil(count * 0.6); // 60% producers for balance
  
  // Generate producers
  for (let i = 0; i < producerCount; i++) {
    species.push({
      id: `producer-${i}`,
      name: `Producer Species ${i}`,
      type: SpeciesType.PRODUCER,
      energyRequirement: 10 + Math.random() * 20,
      reproductionRate: 0.1 + Math.random() * 0.3
    });
  }
  
  // Generate consumers
  for (let i = 0; i < count - producerCount; i++) {
    species.push({
      id: `consumer-${i}`,
      name: `Consumer Species ${i}`,
      type: SpeciesType.CONSUMER,
      energyRequirement: 30 + Math.random() * 40,
      reproductionRate: 0.05 + Math.random() * 0.15
    });
  }
  
  return species;
}

// Test suites
describe('EcosystemSimulation', () => {
  // Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
  describe('initialization', () => {
    it('should correctly initialize ecosystem with valid species and environment', async () => {
      const simulation = await setupTestSimulation();
      const initialState = await simulation.getSimulationResult();
      
      expect(initialState).toBeDefined();
      expect(initialState.species.length).toBe(10);
      expect(initialState.environment).toBeDefined();
      expect(initialState.stabilityScore).toBeGreaterThanOrEqual(0);
      expect(initialState.stabilityScore).toBeLessThanOrEqual(1);
    });

    it('should calculate correct species interactions on initialization', async () => {
      const simulation = await setupTestSimulation();
      const state = await simulation.getSimulationResult();
      
      expect(state.interactions).toBeDefined();
      expect(state.interactions.length).toBeGreaterThan(0);
      expect(state.interactions[0]).toHaveProperty('interactionType');
      expect(Object.values(InteractionType)).toContain(state.interactions[0].interactionType);
    });

    // Requirement: System Performance - <200ms API response time for 95% of requests
    it('should complete initialization within performance SLA', async () => {
      const startTime = performance.now();
      await setupTestSimulation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
    });
  });

  describe('validation', () => {
    it('should reject invalid species counts', async () => {
      await expect(setupTestSimulation({ speciesCount: 1 }))
        .rejects.toThrow(SimulationValidationError);
      await expect(setupTestSimulation({ speciesCount: 101 }))
        .rejects.toThrow(SimulationValidationError);
    });

    it('should validate producer/consumer ratio', async () => {
      const simulation = await setupTestSimulation();
      const state = await simulation.getSimulationResult();
      
      const producers = state.species.filter(s => s.type === SpeciesType.PRODUCER);
      const producerRatio = producers.length / state.species.length;
      
      expect(producerRatio).toBeGreaterThanOrEqual(0.3);
    });

    it('should verify environmental parameters within valid ranges', async () => {
      const invalidConfig = {
        environmentParams: {
          temperature: -20, // Invalid temperature
          depth: 100,
          salinity: 35,
          lightLevel: 80
        }
      };
      
      await expect(setupTestSimulation(invalidConfig))
        .rejects.toThrow(SimulationValidationError);
    });
  });

  describe('simulation_execution', () => {
    it('should correctly update species populations based on interactions', async () => {
      const simulation = await setupTestSimulation();
      const initialState = await simulation.getSimulationResult();
      
      await simulation.simulateTimeStep();
      const newState = await simulation.getSimulationResult();
      
      expect(newState.species).not.toEqual(initialState.species);
      expect(newState.stabilityScore).toBeDefined();
    });

    it('should apply environmental effects correctly', async () => {
      const simulation = await setupTestSimulation({
        environmentParams: {
          temperature: 35, // High stress condition
          depth: 100,
          salinity: 35,
          lightLevel: 80
        }
      });
      
      await simulation.simulateTimeStep();
      const state = await simulation.getSimulationResult();
      
      expect(state.stabilityScore).toBeLessThan(0.8); // Expect lower stability in stress conditions
    });

    it('should handle species extinctions appropriately', async () => {
      const simulation = await setupTestSimulation();
      const initialSpeciesCount = (await simulation.getSimulationResult()).species.length;
      
      // Simulate until some species go extinct
      for (let i = 0; i < 10; i++) {
        await simulation.simulateTimeStep();
      }
      
      const finalState = await simulation.getSimulationResult();
      expect(finalState.species.length).toBeLessThanOrEqual(initialSpeciesCount);
    });
  });

  describe('performance', () => {
    // Requirement: System Performance - <200ms API response time for 95% of requests
    it('should meet time step simulation performance requirements', async () => {
      const simulation = await setupTestSimulation();
      
      const startTime = performance.now();
      await simulation.simulateTimeStep();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should efficiently handle maximum species count', async () => {
      const simulation = await setupTestSimulation({ speciesCount: 100 });
      
      const startTime = performance.now();
      await simulation.simulateTimeStep();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should maintain stable memory usage', async () => {
      const simulation = await setupTestSimulation();
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate multiple time steps
      for (let i = 0; i < 10; i++) {
        await simulation.simulateTimeStep();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(256 * 1024 * 1024); // Less than 256MB increase
    });
  });
});