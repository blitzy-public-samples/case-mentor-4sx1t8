/**
 * Human Tasks:
 * 1. Configure test coverage thresholds for canvas rendering
 * 2. Set up performance testing for animation frame rates
 * 3. Add visual regression testing setup for canvas snapshots
 */

// @testing-library/react v14.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// vitest v0.34.0
import { vi } from 'vitest';
// @testing-library/jest-dom v6.1.0
import '@testing-library/jest-dom/matchers';

import EcosystemCanvas from '../../components/simulation/EcosystemCanvas';
import { SimulationState, SimulationStatus, Species, SpeciesType } from '../../types/simulation';
import { useSimulation } from '../../hooks/useSimulation';

// Mock the useSimulation hook
vi.mock('../../hooks/useSimulation');

// Mock canvas context
const mockContext = {
  scale: vi.fn(),
  clearRect: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  quadraticCurveTo: vi.fn()
};

// Mock canvas element
HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);

// Helper function to create mock simulation state
const mockSimulationState = (overrides?: Partial<SimulationState>): SimulationState => ({
  id: 'test-simulation',
  userId: 'test-user',
  species: [],
  environment: {
    temperature: 25,
    depth: 100,
    salinity: 35,
    lightLevel: 80
  },
  timeRemaining: 300,
  status: SimulationStatus.RUNNING,
  ...overrides
});

// Helper function to create mock species
const mockSpecies = (overrides?: Partial<Species>): Species => ({
  id: 'test-species',
  name: 'Test Species',
  type: SpeciesType.PRODUCER,
  energyRequirement: 50,
  reproductionRate: 0.5,
  ...overrides
});

describe('EcosystemCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 1,
      writable: true
    });
    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 0));
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => clearTimeout(id));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders canvas element with correct dimensions', () => {
    // Requirement: Simulation Engine - Handles ecosystem game logic and state management
    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: null,
      status: SimulationStatus.SETUP
    });

    const { container } = render(
      <EcosystemCanvas width={800} height={600} className="test-canvas" />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveStyle({
      width: '800px',
      height: '600px'
    });
    expect(canvas).toHaveClass('ecosystem-canvas', 'test-canvas');
  });

  it('initializes canvas context correctly', async () => {
    // Requirement: McKinsey Simulation - Ecosystem game replication with complex data analysis
    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: null,
      status: SimulationStatus.SETUP
    });

    render(<EcosystemCanvas />);

    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    expect(mockContext.scale).toHaveBeenCalledWith(1, 1);
  });

  it('draws species based on simulation state', async () => {
    // Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
    const mockState = mockSimulationState({
      species: [
        mockSpecies({ type: SpeciesType.PRODUCER }),
        mockSpecies({ type: SpeciesType.CONSUMER, id: 'consumer-1' })
      ]
    });

    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: mockState,
      status: SimulationStatus.RUNNING
    });

    render(<EcosystemCanvas />);

    await waitFor(() => {
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });
  });

  it('updates canvas on environment changes', async () => {
    // Requirement: Simulation Engine - Handles ecosystem game logic and state management
    const mockState = mockSimulationState({
      environment: {
        temperature: 30,
        depth: 200,
        salinity: 40,
        lightLevel: 90
      }
    });

    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: mockState,
      status: SimulationStatus.RUNNING
    });

    render(<EcosystemCanvas />);

    await waitFor(() => {
      expect(mockContext.createLinearGradient).toHaveBeenCalled();
      expect(mockContext.createRadialGradient).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });

  it('handles animation frame updates', async () => {
    // Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
    const mockState = mockSimulationState();
    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: mockState,
      status: SimulationStatus.RUNNING
    });

    render(<EcosystemCanvas />);

    await waitFor(() => {
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  it('cleans up resources on unmount', async () => {
    // Requirement: Simulation Engine - Handles ecosystem game logic and state management
    const mockState = mockSimulationState();
    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: mockState,
      status: SimulationStatus.RUNNING
    });

    const { unmount } = render(<EcosystemCanvas />);

    unmount();

    await waitFor(() => {
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  it('pauses animation when simulation is not running', async () => {
    // Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
    const mockState = mockSimulationState({
      status: SimulationStatus.COMPLETED
    });

    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: mockState,
      status: SimulationStatus.COMPLETED
    });

    render(<EcosystemCanvas />);

    await waitFor(() => {
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    });
  });
});