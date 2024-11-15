/**
 * Human Tasks:
 * 1. Configure canvas performance monitoring
 * 2. Set up error tracking for WebGL fallback scenarios
 * 3. Verify browser compatibility for Canvas API features
 */

// react v18.0.0
import React, { useRef, useEffect, useCallback } from 'react';
// classnames v2.3.2
import classNames from 'classnames';

import { useSimulation } from '../../hooks/useSimulation';
import { 
  Species, 
  EnvironmentParameters, 
  SimulationStatus, 
  SpeciesType 
} from '../../types/simulation';

// Canvas default dimensions
const CANVAS_DEFAULT_WIDTH = 800;
const CANVAS_DEFAULT_HEIGHT = 600;

// Species visualization colors
const SPECIES_COLORS = {
  PRODUCER: '#22C55E',
  CONSUMER: '#3B82F6'
};

// Animation frame rate for smooth rendering
const ANIMATION_FRAME_RATE = 60;

// Interface for canvas component props
interface EcosystemCanvasProps {
  className?: string;
  width?: number;
  height?: number;
}

// Interface for position tracking
interface Position {
  x: number;
  y: number;
}

/**
 * Custom hook for canvas setup and context management
 * Requirement: Simulation Engine - Handles ecosystem game logic and state management
 */
const useCanvasSetup = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Configure context for high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Set up canvas dimensions with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    return ctx;
  }, []);

  useEffect(() => {
    return getContext();
  }, [getContext]);

  return getContext();
};

/**
 * Renders environmental effects on the canvas
 * Requirement: McKinsey Simulation - Ecosystem game replication with complex data analysis
 */
const drawEnvironment = (ctx: CanvasRenderingContext2D, params: EnvironmentParameters) => {
  const { width, height } = ctx.canvas;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw water depth gradient
  const depthGradient = ctx.createLinearGradient(0, 0, 0, height);
  const depthAlpha = Math.min(params.depth / 1000, 1);
  depthGradient.addColorStop(0, `rgba(173, 216, 230, ${0.2 + depthAlpha})`);
  depthGradient.addColorStop(1, `rgba(0, 51, 102, ${0.4 + depthAlpha})`);
  ctx.fillStyle = depthGradient;
  ctx.fillRect(0, 0, width, height);

  // Render temperature effects
  const tempHue = Math.max(0, Math.min(240, (params.temperature + 10) * 8));
  ctx.fillStyle = `hsla(${tempHue}, 70%, 50%, 0.1)`;
  ctx.fillRect(0, 0, width, height);

  // Add light level visualization
  const lightGradient = ctx.createRadialGradient(
    width / 2, 0, 0,
    width / 2, 0, height
  );
  const lightAlpha = params.lightLevel / 100;
  lightGradient.addColorStop(0, `rgba(255, 255, 200, ${lightAlpha})`);
  lightGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
  ctx.fillStyle = lightGradient;
  ctx.fillRect(0, 0, width, height);

  // Display salinity indicators
  const salinityParticles = Math.floor(params.salinity * 10);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  for (let i = 0; i < salinityParticles; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
};

/**
 * Renders individual species on the canvas
 * Requirement: McKinsey Simulation - Ecosystem game replication with complex data analysis
 */
const drawSpecies = (ctx: CanvasRenderingContext2D, species: Species, position: Position) => {
  const baseSize = species.type === SpeciesType.PRODUCER ? 10 : 15;
  const color = SPECIES_COLORS[species.type];

  ctx.save();
  ctx.translate(position.x, position.y);

  // Draw species body
  ctx.beginPath();
  ctx.fillStyle = color;
  if (species.type === SpeciesType.PRODUCER) {
    // Draw producer as organic shape
    ctx.moveTo(0, -baseSize);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = baseSize * (0.8 + Math.random() * 0.4);
      ctx.lineTo(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      );
    }
    ctx.closePath();
  } else {
    // Draw consumer as fish-like shape
    ctx.moveTo(baseSize, 0);
    ctx.quadraticCurveTo(0, -baseSize/2, -baseSize, 0);
    ctx.quadraticCurveTo(0, baseSize/2, baseSize, 0);
  }
  ctx.fill();

  // Add energy indicator
  const energyRadius = baseSize * 0.3;
  ctx.beginPath();
  ctx.fillStyle = `rgba(255, 255, 255, ${species.energyRequirement / 100})`;
  ctx.arc(0, 0, energyRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

/**
 * Main canvas component for ecosystem visualization
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
const EcosystemCanvas: React.FC<EcosystemCanvasProps> = ({
  className,
  width = CANVAS_DEFAULT_WIDTH,
  height = CANVAS_DEFAULT_HEIGHT
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  const { simulationState, status } = useSimulation();
  const ctx = useCanvasSetup(canvasRef);

  /**
   * Animation frame handler for continuous rendering
   * Requirement: Simulation Engine - Handles ecosystem game logic and state management
   */
  const animate = useCallback((timestamp: number) => {
    if (!ctx || !simulationState) return;

    // Control frame rate
    const elapsed = timestamp - lastFrameTimeRef.current;
    if (elapsed < (1000 / ANIMATION_FRAME_RATE)) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameTimeRef.current = timestamp;

    // Draw environment
    drawEnvironment(ctx, simulationState.environment);

    // Draw all species
    simulationState.species.forEach((species, index) => {
      // Calculate position based on time and species properties
      const angle = (index / simulationState.species.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.3;
      const position: Position = {
        x: width/2 + Math.cos(angle + timestamp/1000) * radius,
        y: height/2 + Math.sin(angle + timestamp/1000) * radius
      };

      drawSpecies(ctx, species, position);
    });

    if (status === SimulationStatus.RUNNING) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [ctx, simulationState, status, width, height]);

  // Set up animation loop
  useEffect(() => {
    if (status === SimulationStatus.RUNNING) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate, status]);

  return (
    <canvas
      ref={canvasRef}
      className={classNames('ecosystem-canvas', className)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#0F172A'
      }}
      aria-label="Ecosystem simulation visualization"
    />
  );
};

export default EcosystemCanvas;