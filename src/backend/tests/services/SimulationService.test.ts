// Third-party imports
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'; // ^29.0.0
import { MockInstance } from 'jest-mock'; // ^29.0.0

// Internal imports
import { SimulationService } from '../../services/SimulationService';
import {
  SimulationExecutionContext,
  Species,
  Environment,
  SimulationState,
  SimulationResult,
  InteractionType
} from '../../lib/simulation/types';

/**
 * Human Tasks:
 * 1. Ensure Jest is configured with TypeScript support
 * 2. Configure test environment variables if needed
 * 3. Set up test database for SimulationAttempt persistence
 * 4. Configure test coverage thresholds
 */

// Mock dependencies
jest.mock('../lib/simulation/ecosystem');
jest.mock('../lib/simulation/evaluator');
jest.mock('../models/SimulationAttempt');

describe('SimulationService', () => {
  let simulationService: SimulationService;
  let mockExecutionContext: SimulationExecutionContext;
  let mockSpecies: Species[];
  let mockEnvironment: Environment;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Initialize service
    simulationService = new SimulationService();

    // Set up mock data
    mockExecutionContext = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timeLimit: 1800, // 30 minutes
      config: {}
    };

    mockSpecies = [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Species 1',
        trophicLevel: 1,
        population: 100,
        interactions: [{ type: InteractionType.PREDATION, targetId: '123e4567-e89b-12d3-a456-426614174002' }]
      }
    ];

    mockEnvironment = {
      temperature: 25,
      salinity: 35,
      depth: 100,
      lightLevel: 80
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Test suite for startSimulation
  describe('startSimulation', () => {
    /**
     * @requirement McKinsey Simulation - Tests initialization of time-pressured scenarios
     */
    it('should successfully start a simulation with valid context', async () => {
      const result = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(mockExecutionContext.userId);
      expect(result.timeRemaining).toBe(mockExecutionContext.timeLimit);
    });

    it('should reject invalid user permissions', async () => {
      const invalidUserId = 'invalid-uuid';
      await expect(
        simulationService.startSimulation(invalidUserId, mockExecutionContext)
      ).rejects.toThrow();
    });

    it('should validate context parameters', async () => {
      const invalidContext = { ...mockExecutionContext, timeLimit: -1 };
      await expect(
        simulationService.startSimulation(mockExecutionContext.userId, invalidContext)
      ).rejects.toThrow();
    });

    it('should prevent concurrent simulations for same user', async () => {
      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      await expect(
        simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext)
      ).rejects.toThrow();
    });
  });

  // Test suite for updateSpecies
  describe('updateSpecies', () => {
    /**
     * @requirement Simulation Engine - Tests species management and interaction logic
     */
    it('should update species with valid data', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      const result = await simulationService.updateSpecies(attempt.id, mockSpecies);
      expect(result.species).toEqual(mockSpecies);
    });

    it('should reject invalid species combinations', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      const invalidSpecies = [...mockSpecies, { ...mockSpecies[0] }]; // Duplicate species
      await expect(
        simulationService.updateSpecies(attempt.id, invalidSpecies)
      ).rejects.toThrow();
    });

    it('should validate trophic level requirements', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      const invalidTrophicSpecies = [{ ...mockSpecies[0], trophicLevel: -1 }];
      await expect(
        simulationService.updateSpecies(attempt.id, invalidTrophicSpecies)
      ).rejects.toThrow();
    });

    it('should validate species interactions', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      const invalidInteractionSpecies = [{
        ...mockSpecies[0],
        interactions: [{ type: 'INVALID' as InteractionType, targetId: 'invalid-id' }]
      }];
      await expect(
        simulationService.updateSpecies(attempt.id, invalidInteractionSpecies)
      ).rejects.toThrow();
    });
  });

  // Test suite for updateEnvironment
  describe('updateEnvironment', () => {
    /**
     * @requirement Simulation Engine - Tests environmental parameter management
     */
    it('should update environment with valid parameters', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      const result = await simulationService.updateEnvironment(attempt.id, mockEnvironment);
      expect(result.environment).toEqual(mockEnvironment);
    });

    it('should validate parameter ranges', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      const invalidEnvironment = { ...mockEnvironment, temperature: 1000 }; // Invalid temperature
      await expect(
        simulationService.updateEnvironment(attempt.id, invalidEnvironment)
      ).rejects.toThrow();
    });

    it('should calculate environmental stress accurately', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      const stressfulEnvironment = {
        ...mockEnvironment,
        temperature: 35,
        salinity: 45
      };

      const result = await simulationService.updateEnvironment(attempt.id, stressfulEnvironment);
      expect(result.environmentalStress).toBeGreaterThan(0);
    });

    it('should assess species impact under environmental changes', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      await simulationService.updateSpecies(attempt.id, mockSpecies);
      const result = await simulationService.updateEnvironment(attempt.id, mockEnvironment);
      expect(result.speciesImpact).toBeDefined();
    });
  });

  // Test suite for executeTimeStep
  describe('executeTimeStep', () => {
    /**
     * @requirement McKinsey Simulation - Tests time-based scenario progression
     */
    it('should execute time step and update state', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      const result = await simulationService.executeTimeStep(attempt.id);
      expect(result.timeRemaining).toBeLessThan(mockExecutionContext.timeLimit);
    });

    it('should calculate population dynamics', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      await simulationService.updateSpecies(attempt.id, mockSpecies);
      const result = await simulationService.executeTimeStep(attempt.id);
      expect(result.populationChanges).toBeDefined();
    });

    it('should apply environmental effects', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      await simulationService.updateEnvironment(attempt.id, mockEnvironment);
      const result = await simulationService.executeTimeStep(attempt.id);
      expect(result.environmentalEffects).toBeDefined();
    });

    it('should evaluate completion conditions', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      // Simulate time until near completion
      for (let i = 0; i < mockExecutionContext.timeLimit - 1; i++) {
        await simulationService.executeTimeStep(attempt.id);
      }

      const result = await simulationService.executeTimeStep(attempt.id);
      expect(result.isComplete).toBe(true);
    });
  });

  // Test suite for completeSimulation
  describe('completeSimulation', () => {
    /**
     * @requirement McKinsey Simulation - Tests evaluation of simulation outcomes
     */
    it('should generate valid simulation result', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      const result = await simulationService.completeSimulation(attempt.id);
      expect(result.score).toBeDefined();
      expect(result.feedback).toBeDefined();
    });

    it('should calculate accurate scores', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      await simulationService.updateSpecies(attempt.id, mockSpecies);
      await simulationService.executeTimeStep(attempt.id);
      const result = await simulationService.completeSimulation(attempt.id);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should generate comprehensive feedback', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      const result = await simulationService.completeSimulation(attempt.id);
      expect(result.feedback).toHaveProperty('strengths');
      expect(result.feedback).toHaveProperty('improvements');
    });

    it('should handle incomplete simulation errors', async () => {
      const attempt = await simulationService.startSimulation(
        mockExecutionContext.userId,
        mockExecutionContext
      );

      // Force incomplete state
      jest.spyOn(attempt, 'isComplete').mockReturnValue(false);
      await expect(
        simulationService.completeSimulation(attempt.id)
      ).rejects.toThrow();
    });
  });
});