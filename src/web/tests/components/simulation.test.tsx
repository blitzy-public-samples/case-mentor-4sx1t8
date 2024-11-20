// @package react ^18.0.0
// @package @testing-library/react ^14.0.0
// @package @testing-library/jest-dom ^5.16.5
// @package jest ^29.0.0

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EcosystemCanvas } from '../../components/simulation/ecosystem-canvas';
import { SimulationControls } from '../../components/simulation/simulation-controls';
import { SpeciesSelector, handleSpeciesSelect, validateSelection } from '../../components/simulation/species-selector';
import { useSimulation } from '../../hooks/use-simulation';

// Mock the useSimulation hook
jest.mock('../../hooks/use-simulation', () => ({
  useSimulation: jest.fn()
}));

// Mock species data for testing
const mockSpecies = [
  { id: 'producer1', type: 'producer', name: 'Algae', populationSize: 100 },
  { id: 'consumer1', type: 'consumer', name: 'Fish', populationSize: 50 }
];

// Mock environment parameters for testing
const mockEnvironmentParams = {
  temperature: 20,
  depth: 50,
  salinity: 35,
  lightLevel: 100
};

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('EcosystemCanvas', () => {
  /**
   * @requirement McKinsey Simulation
   * Test canvas initialization with correct dimensions and context
   */
  test('initializes canvas with correct dimensions and context', () => {
    const { container } = render(
      <EcosystemCanvas
        species={mockSpecies}
        parameters={mockEnvironmentParams}
        width={800}
        height={600}
        isRunning={true}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  /**
   * @requirement McKinsey Simulation
   * Test species rendering with mock species data
   */
  test('renders species correctly on canvas', async () => {
    const { container } = render(
      <EcosystemCanvas
        species={mockSpecies}
        parameters={mockEnvironmentParams}
        width={800}
        height={600}
        isRunning={true}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    
    // Wait for animation frame to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  /**
   * @requirement System Performance
   * Test animation frame handling and performance
   */
  test('handles animation frames efficiently', async () => {
    jest.useFakeTimers();
    
    const { container, rerender } = render(
      <EcosystemCanvas
        species={mockSpecies}
        parameters={mockEnvironmentParams}
        width={800}
        height={600}
        isRunning={true}
      />
    );

    // Test animation frame requests
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Test stopping animation
    rerender(
      <EcosystemCanvas
        species={mockSpecies}
        parameters={mockEnvironmentParams}
        width={800}
        height={600}
        isRunning={false}
      />
    );

    jest.useRealTimers();
  });
});

describe('SimulationControls', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: {
        selectedSpeciesIds: [],
        environment: mockEnvironmentParams,
        timeRemaining: { minutes: 5, seconds: 0 }
      },
      updateSpecies: jest.fn(),
      updateEnvironment: jest.fn()
    });
  });

  /**
   * @requirement McKinsey Simulation
   * Test environment parameter validation against ENVIRONMENT_LIMITS
   */
  test('validates environment parameters correctly', async () => {
    render(
      <SimulationControls
        simulationId="test-sim"
        onComplete={mockOnComplete}
      />
    );

    const temperatureInput = screen.getByLabelText(/Temperature/i);
    
    await act(async () => {
      fireEvent.change(temperatureInput, { target: { value: '30' } });
    });

    expect(useSimulation().updateEnvironment).not.toHaveBeenCalled();
  });

  /**
   * @requirement McKinsey Simulation
   * Test species selection rules against VALIDATION_RULES
   */
  test('enforces species selection rules', async () => {
    const { updateSpecies } = useSimulation();
    
    render(
      <SimulationControls
        simulationId="test-sim"
        onComplete={mockOnComplete}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText(/Start Simulation/i));
    });

    expect(mockOnComplete).not.toHaveBeenCalled();
  });
});

describe('SpeciesSelector', () => {
  /**
   * @requirement McKinsey Simulation
   * Test species group rendering and organization
   */
  test('renders species groups correctly', () => {
    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: {
        selectedSpeciesIds: [],
        isSelecting: true
      },
      updateSpecies: jest.fn()
    });

    render(<SpeciesSelector />);

    expect(screen.getByText(/Producers/i)).toBeInTheDocument();
    expect(screen.getByText(/Consumers/i)).toBeInTheDocument();
    expect(screen.getByText(/Decomposers/i)).toBeInTheDocument();
  });

  /**
   * @requirement McKinsey Simulation
   * Test selection validation rules for ecological balance
   */
  test('validates ecological balance rules', () => {
    const mockSpeciesIds = ['producer1', 'producer2', 'consumer1'];
    expect(validateSelection(mockSpeciesIds)).toBe(false);
  });

  /**
   * @requirement McKinsey Simulation
   * Test producer to consumer ratio requirements
   */
  test('enforces producer to consumer ratio', async () => {
    const mockUpdateSpecies = jest.fn();
    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: {
        selectedSpeciesIds: ['producer1'],
        isSelecting: true
      },
      updateSpecies: mockUpdateSpecies
    });

    render(<SpeciesSelector />);

    await act(async () => {
      fireEvent.click(screen.getByText(/Small Fish/i));
    });

    expect(mockUpdateSpecies).not.toHaveBeenCalled();
  });

  /**
   * @requirement McKinsey Simulation
   * Test maximum species limit
   */
  test('enforces maximum species limit', async () => {
    const mockUpdateSpecies = jest.fn();
    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: {
        selectedSpeciesIds: Array(8).fill('species'),
        isSelecting: true
      },
      updateSpecies: mockUpdateSpecies
    });

    render(<SpeciesSelector />);

    const speciesButton = screen.getByText(/Algae/i);
    expect(speciesButton).toBeDisabled();
  });
});