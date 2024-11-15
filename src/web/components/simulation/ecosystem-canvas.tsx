// @package react ^18.0.0

// Human Tasks:
// 1. Verify canvas performance with maximum species load
// 2. Test animation smoothness across different devices
// 3. Validate environment parameter ranges with domain experts
// 4. Configure proper error boundaries for WebGL fallback

import React, { useRef, useEffect, useCallback } from 'react';
import { SimulationControlsProps } from './simulation-controls';
import { Species } from '../../types/simulation';

/**
 * @requirement McKinsey Simulation
 * Color mapping for different species types in the ecosystem
 */
const SPECIES_COLORS = {
  PRODUCER: '#22C55E',
  CONSUMER: '#3B82F6',
  DECOMPOSER: '#EF4444'
} as const;

/**
 * @requirement McKinsey Simulation
 * Animation frame rate for smooth species movement
 */
const ANIMATION_FRAME_RATE = 60;

/**
 * @requirement User Interface Design
 * Canvas padding to prevent species from touching edges
 */
const CANVAS_PADDING = 20;

interface EcosystemCanvasProps {
  species: Species[];
  parameters: {
    temperature: number;
    depth: number;
    salinity: number;
    lightLevel: number;
  };
  width: number;
  height: number;
  isRunning: boolean;
}

/**
 * @requirement McKinsey Simulation
 * Custom hook to initialize and manage canvas context with high-quality rendering
 */
const useCanvasSetup = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  width: number,
  height: number
): CanvasRenderingContext2D | null => {
  const [context, setContext] = React.useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });

    if (!ctx) return;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Set canvas dimensions with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    setContext(ctx);
  }, [canvasRef, width, height]);

  return context;
};

/**
 * @requirement McKinsey Simulation
 * Renders environmental effects based on current parameters
 */
const drawEnvironment = (
  ctx: CanvasRenderingContext2D,
  parameters: EcosystemCanvasProps['parameters']
): void => {
  const { width, height } = ctx.canvas;

  // Clear canvas
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, width, height);

  // Draw water depth gradient
  const depthGradient = ctx.createLinearGradient(0, 0, 0, height);
  depthGradient.addColorStop(0, `rgba(59, 130, 246, ${parameters.depth / 100})`);
  depthGradient.addColorStop(1, `rgba(30, 58, 138, ${parameters.depth / 100})`);
  ctx.fillStyle = depthGradient;
  ctx.fillRect(0, 0, width, height);

  // Visualize temperature effects
  const tempOpacity = (parameters.temperature - 15) / 10; // 15-25°C range
  ctx.fillStyle = `rgba(239, 68, 68, ${tempOpacity})`;
  ctx.fillRect(0, 0, width, height);

  // Show salinity indicators
  const salinitySize = (parameters.salinity - 30) * 2; // 30-40 ppt range
  for (let i = 0; i < width; i += 50) {
    for (let j = 0; j < height; j += 50) {
      ctx.beginPath();
      ctx.arc(i, j, salinitySize, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
    }
  }

  // Add light level overlay
  const lightGradient = ctx.createRadialGradient(
    width / 2, 0, 0,
    width / 2, 0, height
  );
  lightGradient.addColorStop(0, `rgba(255, 255, 255, ${parameters.lightLevel / 200})`);
  lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = lightGradient;
  ctx.fillRect(0, 0, width, height);
};

/**
 * @requirement McKinsey Simulation
 * Renders individual species with population-based sizing and environmental interactions
 */
const drawSpecies = (
  ctx: CanvasRenderingContext2D,
  species: Species,
  parameters: EcosystemCanvasProps['parameters']
): void => {
  const { width, height } = ctx.canvas;
  const baseSize = Math.min(width, height) / 20;

  // Calculate position based on environmental parameters
  const x = CANVAS_PADDING + (Math.sin(Date.now() / 1000) + 1) * 
    (width - 2 * CANVAS_PADDING) / 2;
  const y = CANVAS_PADDING + 
    (parameters.depth / 100) * (height - 2 * CANVAS_PADDING);

  // Size based on population
  const size = baseSize * (0.5 + species.populationSize / 100);

  // Draw species representation
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = SPECIES_COLORS[species.type];
  ctx.fill();

  // Add population indicator
  ctx.font = '12px Inter';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText(
    species.populationSize.toString(),
    x,
    y + size + 15
  );

  // Add species name
  ctx.font = '10px Inter';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(
    species.name,
    x,
    y - size - 5
  );
};

/**
 * @requirement McKinsey Simulation
 * Main canvas component for ecosystem visualization
 */
export const EcosystemCanvas: React.FC<EcosystemCanvasProps> = ({
  species,
  parameters,
  width,
  height,
  isRunning
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const context = useCanvasSetup(canvasRef, width, height);
  const animationFrameRef = useRef<number>();

  const render = useCallback(() => {
    if (!context) return;

    // Draw environment first
    drawEnvironment(context, parameters);

    // Draw each species
    species.forEach(s => drawSpecies(context, s, parameters));

    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(render);
    }
  }, [context, species, parameters, isRunning]);

  useEffect(() => {
    if (isRunning) {
      render();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, render]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: '8px',
        backgroundColor: '#0F172A'
      }}
      aria-label="Ecosystem simulation visualization"
    />
  );
};

EcosystemCanvas.displayName = 'EcosystemCanvas';