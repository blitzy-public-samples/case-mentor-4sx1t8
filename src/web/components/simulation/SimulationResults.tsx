/**
 * Human Tasks:
 * 1. Verify that framer-motion animations are performing well on lower-end devices
 * 2. Test color contrast ratios meet WCAG 2.1 AA standards
 * 3. Validate screen reader compatibility with motion animations
 */

// react v18.0.0
import React from 'react';
// framer-motion v10.0.0
import { motion } from 'framer-motion';

import { SimulationResult } from '../../types/simulation';
import { useSimulation } from '../../hooks/useSimulation';
import Card from '../shared/Card';

// Animation variants for score displays
const scoreVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

// Staggered animation for feedback items
const feedbackListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const feedbackItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  }
};

/**
 * Formats a numeric score as a percentage with 1 decimal place
 * @param score - Number between 0 and 1
 * @returns Formatted percentage string
 */
const formatScore = (score: number): string => {
  if (score === null || score === undefined) return '0.0%';
  return `${(score * 100).toFixed(1)}%`;
};

interface SimulationResultsProps {
  result: SimulationResult | null;
  onReset: () => void;
}

/**
 * Displays the results of a completed ecosystem simulation with animated transitions
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 * Requirement: Simulation Engine - Handles ecosystem game logic and state management
 */
const SimulationResults: React.FC<SimulationResultsProps> = ({ result, onReset }) => {
  if (!result) return null;

  return (
    <Card
      className="max-w-2xl mx-auto p-6 space-y-6"
      shadow="lg"
      role="region"
      aria-label="Simulation Results"
    >
      {/* Overall Score */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={scoreVariants}
        className="text-center"
      >
        <h2 className="text-2xl font-semibold mb-2">
          Overall Score
        </h2>
        <div 
          className="text-4xl font-bold text-blue-600"
          aria-label={`Overall score: ${formatScore(result.score)}`}
        >
          {formatScore(result.score)}
        </div>
      </motion.div>

      {/* Ecosystem Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          variants={scoreVariants}
          initial="hidden"
          animate="visible"
          className="text-center p-4 bg-gray-50 rounded-lg"
        >
          <h3 className="text-lg font-medium mb-2">
            Ecosystem Stability
          </h3>
          <div 
            className="text-2xl font-semibold text-green-600"
            aria-label={`Ecosystem stability: ${formatScore(result.ecosystemStability)}`}
          >
            {formatScore(result.ecosystemStability)}
          </div>
        </motion.div>

        <motion.div
          variants={scoreVariants}
          initial="hidden"
          animate="visible"
          className="text-center p-4 bg-gray-50 rounded-lg"
        >
          <h3 className="text-lg font-medium mb-2">
            Species Balance
          </h3>
          <div 
            className="text-2xl font-semibold text-green-600"
            aria-label={`Species balance: ${formatScore(result.speciesBalance)}`}
          >
            {formatScore(result.speciesBalance)}
          </div>
        </motion.div>
      </div>

      {/* Detailed Feedback */}
      <motion.div
        variants={feedbackListVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <h3 className="text-xl font-semibold">
          Detailed Feedback
        </h3>
        <ul className="space-y-2" role="list">
          {result.feedback.map((item, index) => (
            <motion.li
              key={index}
              variants={feedbackItemVariants}
              className="flex items-start space-x-2 text-gray-700"
            >
              <span className="mt-1 text-green-500">•</span>
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Completion Time */}
      <motion.div
        variants={scoreVariants}
        initial="hidden"
        animate="visible"
        className="text-sm text-gray-500 text-center"
      >
        Completed at: {new Date(result.completedAt).toLocaleString()}
      </motion.div>

      {/* Reset Button */}
      <motion.div
        variants={scoreVariants}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        <button
          onClick={onReset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     transition-colors duration-200 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Start new simulation"
        >
          Start New Simulation
        </button>
      </motion.div>
    </Card>
  );
};

export default SimulationResults;