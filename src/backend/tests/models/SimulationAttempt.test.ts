// Third-party imports
import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals'; // ^29.7.0
import { MockInstance } from 'jest-mock'; // ^29.7.0

// Internal imports
import { SimulationAttempt } from '../../models/SimulationAttempt';
import { SimulationState, SimulationStatus } from '../../types/simulation';
import { executeQuery, withTransaction } from '../../utils/database';

/**
 * Human Tasks:
 * 1. Configure test database with simulation_attempts and simulation_results tables
 * 2. Set up test environment variables for database connection
 * 3. Ensure test data isolation between test runs
 * 4. Configure test coverage reporting thresholds
 */

// Mock database utilities
jest.mock('../../utils/database');

// Test data setup
const mockSpecies = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Algae',
    type: 'PRODUCER',
    energyRequirement: 10,
    reproductionRate: 0.8
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Fish',
    type: 'CONSUMER',
    energyRequirement: 50,
    reproductionRate: 0.3
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Shark',
    type: 'CONSUMER',
    energyRequirement: 200,
    reproductionRate: 0.1
  }
];

const mockEnvironment = {
  temperature: 25,
  depth: 100,
  salinity: 35,
  lightLevel: 80
};

const mockSimulationState: SimulationState = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  userId: '123e4567-e89b-12d3-a456-426614174004',
  species: mockSpecies,
  environment: mockEnvironment,
  timeRemaining: 300,
  status: SimulationStatus.SETUP
};

describe('SimulationAttempt', () => {
  // Mock instances
  let executeQueryMock: MockInstance;
  let withTransactionMock: MockInstance;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock implementations
    executeQueryMock = executeQuery as jest.MockedFunction<typeof executeQuery>;
    withTransactionMock = withTransaction as jest.MockedFunction<typeof withTransaction>;

    // Mock successful database operations
    executeQueryMock.mockResolvedValue({ rows: [mockSimulationState] });
    withTransactionMock.mockImplementation(async (callback) => {
      return await callback({});
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    // @requirement McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
    it('should initialize with valid state', () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      expect(simulation.id).toBe(mockSimulationState.id);
      expect(simulation.userId).toBe(mockSimulationState.userId);
      expect(simulation.species).toEqual(mockSimulationState.species);
      expect(simulation.environment).toEqual(mockSimulationState.environment);
      expect(simulation.timeRemaining).toBe(mockSimulationState.timeRemaining);
      expect(simulation.status).toBe(SimulationStatus.SETUP);
      expect(simulation.createdAt).toBeInstanceOf(Date);
      expect(simulation.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid species count', () => {
      const invalidState = {
        ...mockSimulationState,
        species: [mockSpecies[0]]
      };
      expect(() => new SimulationAttempt(invalidState)).toThrow('Species count must be between 3 and 8');
    });

    it('should validate environment parameters', () => {
      const invalidState = {
        ...mockSimulationState,
        environment: {
          ...mockEnvironment,
          temperature: -20 // Invalid temperature
        }
      };
      expect(() => new SimulationAttempt(invalidState)).toThrow();
    });
  });

  describe('save', () => {
    // @requirement System Performance - <200ms API response time for 95% of requests
    it('should persist simulation state to database', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      await simulation.save();

      expect(withTransactionMock).toHaveBeenCalled();
      expect(executeQueryMock).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO simulation_attempts'),
        expect.arrayContaining([
          simulation.id,
          simulation.userId,
          JSON.stringify(simulation.species),
          JSON.stringify(simulation.environment)
        ])
      );
    });

    it('should handle transaction errors', async () => {
      withTransactionMock.mockRejectedValueOnce(new Error('Database error'));
      const simulation = new SimulationAttempt(mockSimulationState);
      
      await expect(simulation.save()).rejects.toThrow('Database error');
    });

    it('should update timestamps on save', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      const originalUpdatedAt = simulation.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      await simulation.save();
      
      expect(simulation.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('updateState', () => {
    it('should merge partial updates correctly', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      const updates = {
        timeRemaining: 200,
        status: SimulationStatus.RUNNING
      };

      await simulation.updateState(updates);

      expect(simulation.timeRemaining).toBe(200);
      expect(simulation.status).toBe(SimulationStatus.RUNNING);
      expect(simulation.species).toEqual(mockSimulationState.species);
      expect(simulation.environment).toEqual(mockSimulationState.environment);
    });

    it('should validate updates before applying', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      const invalidUpdates = {
        timeRemaining: -1 // Invalid time
      };

      await expect(simulation.updateState(invalidUpdates)).rejects.toThrow();
    });

    it('should persist updates to database', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      const updates = { status: SimulationStatus.RUNNING };

      await simulation.updateState(updates);

      expect(withTransactionMock).toHaveBeenCalled();
      expect(executeQueryMock).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([SimulationStatus.RUNNING])
      );
    });
  });

  describe('complete', () => {
    const mockResult = {
      simulationId: mockSimulationState.id,
      score: 85,
      ecosystemStability: 90,
      speciesBalance: 80,
      feedback: ['Good species diversity', 'Stable environment parameters'],
      completedAt: new Date().toISOString()
    };

    it('should complete simulation with valid results', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      simulation.timeRemaining = 0;
      
      await simulation.complete(mockResult);

      expect(simulation.status).toBe(SimulationStatus.COMPLETED);
      expect(withTransactionMock).toHaveBeenCalledTimes(2); // One for status update, one for results
    });

    it('should prevent completing already completed simulation', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      simulation.status = SimulationStatus.COMPLETED;

      await expect(simulation.complete(mockResult)).rejects.toThrow('Simulation already completed');
    });

    it('should validate time remaining before completion', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      simulation.timeRemaining = 100; // Time still remaining

      await expect(simulation.complete(mockResult)).rejects.toThrow('Simulation time not expired');
    });

    it('should store results in database', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      simulation.timeRemaining = 0;

      await simulation.complete(mockResult);

      expect(executeQueryMock).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO simulation_results'),
        expect.arrayContaining([
          mockResult.simulationId,
          mockResult.score,
          mockResult.ecosystemStability,
          mockResult.speciesBalance
        ])
      );
    });
  });
});