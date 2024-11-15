// External dependencies versions:
// @jest/types@29.7.0
// @swc/jest@0.2.29

import type { Config } from '@jest/types';

// Requirement: Development Environment
// Location: 4. TECHNOLOGY STACK/4.5 Development & Deployment/Development Environment
// Description: Jest configuration for unit tests, integration tests, and coverage reports

// Requirement: Testing Framework
// Location: 4. TECHNOLOGY STACK/4.2 FRAMEWORKS & LIBRARIES/Supporting Libraries
// Description: Jest testing framework configuration with React Testing Library integration

const config: Config.InitialOptions = {
  // Use jsdom environment for browser-like testing
  testEnvironment: 'jest-environment-jsdom',

  // Include global test setup file that provides custom matchers and mocks
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Configure module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/config/(.*)$': '<rootDir>/config/$1',
  },

  // Configure test file matching patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
  ],

  // Configure SWC-based transformation for TypeScript files
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },

  // Configure coverage collection patterns
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // Set coverage thresholds to ensure code quality
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Additional Jest configurations
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,
};

export default config;