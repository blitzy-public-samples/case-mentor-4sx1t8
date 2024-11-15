// Third-party imports
import { describe, it, expect, jest } from '@jest/globals'; // ^29.0.0
import { NextRequest } from 'next/server'; // ^13.0.0
import { createMocks } from 'node-mocks-http'; // ^1.12.0

// Internal imports
import { GET, POST, PUT, DELETE } from '../../api/simulation/route';
import { SimulationService } from '../../services/SimulationService';
import {
  SimulationExecutionContext,
  Species,
  Environment,
  SimulationState,
  SimulationResult
} from '../../lib/simulation/types';

/**
 * Human Tasks:
 * 1. Configure test database with appropriate test data
 * 2. Set up test environment variables
 * 3. Configure test coverage thresholds
 * 4. Set up CI/CD pipeline test stage
 */

// Mock SimulationService
jest.mock('../../services/SimulationService');

// Test data
const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
const mockSimulationId = '987fcdeb-51a2-43f7-9abc-def123456789';
const mockSpecies: Species[] = [
  { id: 'sp1', name: 'Species 1', type: 'producer' },
  { id: 'sp2', name: 'Species 2', type: 'consumer' }
];
const mockEnvironment: Environment = {
  temperature: 25,
  depth: 100,
  salinity: 35,
  lightLevel: 80
};

describe('Simulation API Tests', () => {
  let mockSimulationService: jest.Mocked<SimulationService>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Initialize mock service
    mockSimulationService = {
      startSimulation: jest.fn(),
      updateSpecies: jest.fn(),
      updateEnvironment: jest.fn(),
      executeTimeStep: jest.fn(),
      completeSimulation: jest.fn()
    } as unknown as jest.Mocked<SimulationService>;

    // Mock authentication
    jest.spyOn(global, 'fetch').mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: mockUserId } })
      } as Response)
    );
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  const createTestSimulation = async (userId: string): Promise<SimulationState> => {
    const context: SimulationExecutionContext = {
      userId,
      timeLimit: 1800,
      config: { difficulty: 'medium' }
    };
    
    return mockSimulationService.startSimulation(userId, context);
  };

  describe('POST /api/simulation', () => {
    it('should create new simulation with valid parameters', async () => {
      // Requirement: McKinsey Simulation - Ecosystem game replication
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'start',
          context: {
            timeLimit: 1800,
            config: { difficulty: 'medium' }
          }
        }
      });

      mockSimulationService.startSimulation.mockResolvedValue({
        id: mockSimulationId,
        state: 'initialized'
      } as any);

      await POST(req as unknown as NextRequest);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toHaveProperty('id', mockSimulationId);
    });

    it('should update species selection', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'updateSpecies',
          simulationId: mockSimulationId,
          species: mockSpecies
        }
      });

      mockSimulationService.updateSpecies.mockResolvedValue({
        species: mockSpecies,
        state: 'species_updated'
      } as any);

      await POST(req as unknown as NextRequest);

      expect(res._getStatusCode()).toBe(200);
      expect(mockSimulationService.updateSpecies).toHaveBeenCalledWith(
        mockSimulationId,
        mockSpecies
      );
    });

    it('should update environmental parameters', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'updateEnvironment',
          simulationId: mockSimulationId,
          environment: mockEnvironment
        }
      });

      mockSimulationService.updateEnvironment.mockResolvedValue({
        environment: mockEnvironment,
        state: 'environment_updated'
      } as any);

      await POST(req as unknown as NextRequest);

      expect(res._getStatusCode()).toBe(200);
      expect(mockSimulationService.updateEnvironment).toHaveBeenCalledWith(
        mockSimulationId,
        mockEnvironment
      );
    });

    it('should validate required parameters', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'start'
          // Missing required context
        }
      });

      await POST(req as unknown as NextRequest);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('error');
    });
  });

  describe('PUT /api/simulation', () => {
    it('should execute single time step', async () => {
      // Requirement: McKinsey Simulation - Time-pressured scenarios
      const { req, res } = createMocks({
        method: 'PUT',
        body: {
          simulationId: mockSimulationId
        }
      });

      mockSimulationService.executeTimeStep.mockResolvedValue({
        state: 'running',
        timeStep: 1
      } as any);

      await PUT(req as unknown as NextRequest);

      expect(res._getStatusCode()).toBe(200);
      expect(mockSimulationService.executeTimeStep).toHaveBeenCalledWith(mockSimulationId);
    });

    it('should validate simulation state', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        body: {} // Missing simulationId
      });

      await PUT(req as unknown as NextRequest);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('error', 'Simulation ID required');
    });
  });

  describe('GET /api/simulation', () => {
    it('should return current simulation state', async () => {
      // Requirement: API Response Times - <200ms API response time
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          simulationId: mockSimulationId
        }
      });

      mockSimulationService.executeTimeStep.mockResolvedValue({
        state: 'running',
        species: mockSpecies,
        environment: mockEnvironment
      } as any);

      const startTime = Date.now();
      await GET(req as unknown as NextRequest);
      const responseTime = Date.now() - startTime;

      expect(res._getStatusCode()).toBe(200);
      expect(responseTime).toBeLessThan(200);
      expect(JSON.parse(res._getData())).toMatchObject({
        state: 'running',
        species: mockSpecies,
        environment: mockEnvironment
      });
    });

    it('should handle non-existent simulations', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          simulationId: 'non-existent-id'
        }
      });

      mockSimulationService.executeTimeStep.mockRejectedValue(
        new Error('Simulation not found')
      );

      await GET(req as unknown as NextRequest);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('error');
    });
  });

  describe('DELETE /api/simulation', () => {
    it('should complete simulation successfully', async () => {
      // Requirement: McKinsey Simulation - Complex data analysis
      const { req, res } = createMocks({
        method: 'DELETE',
        query: {
          simulationId: mockSimulationId
        }
      });

      const mockResult: SimulationResult = {
        id: mockSimulationId,
        finalScore: 85,
        speciesBalance: 90,
        ecosystemStability: 80,
        completionTime: 1500
      };

      mockSimulationService.completeSimulation.mockResolvedValue(mockResult);

      await DELETE(req as unknown as NextRequest);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toMatchObject(mockResult);
    });

    it('should validate completion conditions', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: {} // Missing simulationId
      });

      await DELETE(req as unknown as NextRequest);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('error', 'Simulation ID required');
    });
  });
});