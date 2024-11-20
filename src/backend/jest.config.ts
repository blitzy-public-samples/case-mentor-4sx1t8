/**
 * Human Tasks:
 * 1. Ensure the test setup file exists at src/backend/tests/setup.ts
 * 2. Verify that the coverage directory is added to .gitignore
 */

// @ts-check
import type { JestConfigWithTsJest } from 'ts-jest' // v29.0.0
import { compilerOptions } from './tsconfig.json'

/**
 * Jest configuration for the Case Interview Practice Platform backend services
 * Requirements addressed:
 * - Testing Infrastructure: Configures Jest for unit tests, integration tests, and coverage reports
 * - Backend Technology Stack: TypeScript 5.0+ testing configuration for backend services
 */
const config: JestConfigWithTsJest = {
  // Use ts-jest as the default preset for TypeScript testing
  preset: 'ts-jest',

  // Set Node.js as the testing environment
  testEnvironment: 'node',

  // Define the root directory for test discovery
  roots: ['<rootDir>/src/backend'],

  // Pattern matching for test files
  testMatch: [
    '**/__tests__/**/*.ts',  // Tests in __tests__ directories
    '**/*.test.ts'          // Files with .test.ts extension
  ],

  // Module path aliasing to match tsconfig paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/backend/$1'
  },

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',     // Console output
    'lcov',     // Standard coverage report
    'html'      // HTML report for visualization
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '.d.ts$'    // Ignore TypeScript declaration files
  ],

  // Test setup file to run before each test
  setupFilesAfterEnv: ['<rootDir>/src/backend/tests/setup.ts'],

  // TypeScript file transformation configuration
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },

  // Supported file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],

  // TypeScript configuration for ts-jest
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/src/backend/tsconfig.json'
    }
  },

  // Ensure consistent behavior with tsconfig
  moduleResolution: compilerOptions.moduleResolution,
  
  // Enable source maps for better error reporting
  injectGlobals: true,
  
  // Timeout configuration for tests (5 seconds)
  testTimeout: 5000,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Clear mock calls and instances between every test
  clearMocks: true,
  
  // Maximum number of concurrent workers
  maxWorkers: '50%',
  
  // Detect open handles (async operations that weren't properly cleaned up)
  detectOpenHandles: true,
  
  // Force exit after all tests complete
  forceExit: true
}

export default config