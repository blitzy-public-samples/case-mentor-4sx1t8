// @testing-library/react version: ^14.0.0
// @testing-library/user-event version: ^14.0.0
// vitest version: ^0.34.0

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import type { MockedFunction } from 'vitest';
import SimulationPage from '../../app/simulation/page';
import { useSimulation } from '../../hooks/use-simulation';
import { apiClient } from '../../lib/api-client';
import type { EcosystemCanvasProps } from '../../components/simulation/ecosystem-canvas';

// Mock dependencies
vi.mock('../../hooks/use-simulation');
vi.mock('../../lib/api-client');
vi.mock('../../components/simulation/ecosystem-canvas', () => ({
  EcosystemCanvas: ({ species, parameters }: EcosystemCanvasProps) => (
    <div data-testid="ecosystem-canvas">
      <div data-testid="species-count">{species.length}</div>
      <div data-testid="environment-params">{JSON.stringify(parameters)}</div>
    </div>
  )
}));

describe('SimulationPage', () => {
  const mockApiClient = {
    post: vi.fn(),
    get: vi.fn()
  };

  const mockUseSimulation = vi.fn(() => ({
    simulationState: {
      isSelecting: true,
      selectedSpeciesIds: [],
      timeRemaining: { minutes: 30, seconds: 0 }
    },
    updateSpecies: vi.fn(),
    initializeSimulation: vi.fn(),
    updateEnvironment: vi.fn()
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.post as MockedFunction<typeof apiClient.post>).mockImplementation(mockApiClient.post);
    (apiClient.get as MockedFunction<typeof apiClient.get>).mockImplementation(mockApiClient.get);
    (useSimulation as MockedFunction<typeof useSimulation>).mockImplementation(mockUseSimulation);
  });

  /**
   * @requirement McKinsey Simulation
   * Tests initial rendering of simulation interface
   */
  it('renders simulation interface correctly', async () => {
    render(<SimulationPage />);

    // Verify main components are present
    expect(screen.getByText('Species Selection')).toBeInTheDocument();
    expect(screen.getByText('Ecosystem Visualization')).toBeInTheDocument();
    expect(screen.getByTestId('ecosystem-canvas')).toBeInTheDocument();

    // Verify initial simulation state
    const { simulationState } = mockUseSimulation();
    expect(simulationState.isSelecting).toBe(true);
    expect(simulationState.selectedSpeciesIds).toHaveLength(0);
    expect(simulationState.timeRemaining).toEqual({ minutes: 30, seconds: 0 });
  });

  /**
   * @requirement McKinsey Simulation
   * Tests species selection functionality
   */
  it('handles species selection', async () => {
    const user = userEvent.setup();
    const mockUpdateSpecies = vi.fn();

    mockUseSimulation.mockImplementation(() => ({
      simulationState: {
        isSelecting: true,
        selectedSpeciesIds: ['PRODUCER-1'],
        timeRemaining: { minutes: 30, seconds: 0 }
      },
      updateSpecies: mockUpdateSpecies,
      initializeSimulation: vi.fn(),
      updateEnvironment: vi.fn()
    }));

    render(<SimulationPage />);

    // Simulate species selection
    const speciesSelector = screen.getByText('Species Selection');
    await user.click(speciesSelector);

    // Verify species update was called
    expect(mockUpdateSpecies).toHaveBeenCalledWith(['PRODUCER-1']);

    // Check ecosystem canvas updates
    const speciesCount = screen.getByTestId('species-count');
    expect(speciesCount.textContent).toBe('1');
  });

  /**
   * @requirement System Performance
   * Tests environment parameter validation
   */
  it('validates environment parameters', async () => {
    const mockUpdateEnvironment = vi.fn();
    const user = userEvent.setup();

    mockUseSimulation.mockImplementation(() => ({
      simulationState: {
        isSelecting: true,
        selectedSpeciesIds: ['PRODUCER-1'],
        timeRemaining: { minutes: 30, seconds: 0 }
      },
      updateSpecies: vi.fn(),
      initializeSimulation: vi.fn(),
      updateEnvironment: mockUpdateEnvironment
    }));

    render(<SimulationPage />);

    // Verify environment parameters are passed correctly
    const environmentParams = screen.getByTestId('environment-params');
    const params = JSON.parse(environmentParams.textContent || '{}');
    
    expect(params).toEqual({
      temperature: 20,
      depth: 50,
      salinity: 35,
      lightLevel: 100
    });

    // Verify environment update is called with valid parameters
    expect(mockUpdateEnvironment).not.toHaveBeenCalled();
  });

  /**
   * @requirement McKinsey Simulation
   * Tests simulation completion and result submission
   */
  it('submits simulation results', async () => {
    const mockInitializeSimulation = vi.fn().mockResolvedValue('sim-123');
    const user = userEvent.setup();

    mockUseSimulation.mockImplementation(() => ({
      simulationState: {
        isSelecting: false,
        selectedSpeciesIds: ['PRODUCER-1', 'CONSUMER-1'],
        timeRemaining: { minutes: 0, seconds: 0 }
      },
      updateSpecies: vi.fn(),
      initializeSimulation: mockInitializeSimulation,
      updateEnvironment: vi.fn()
    }));

    mockApiClient.post.mockResolvedValue({
      success: true,
      data: { id: 'sim-123' }
    });

    render(<SimulationPage />);

    // Verify simulation initialization
    expect(mockInitializeSimulation).toHaveBeenCalledWith({
      selectedSpecies: expect.arrayContaining([
        expect.objectContaining({ id: 'PRODUCER-1' }),
        expect.objectContaining({ id: 'CONSUMER-1' })
      ]),
      duration: { minutes: 30, seconds: 0 },
      environment: expect.any(Object)
    });

    // Verify API submission
    expect(mockApiClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/simulations'),
      expect.any(Object)
    );
  });
});