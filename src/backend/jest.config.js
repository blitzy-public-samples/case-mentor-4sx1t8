// Required external setup and configuration tasks:
// 1. Ensure Jest v29.0.0+ is installed as a dev dependency
// 2. Ensure ts-jest v29.0.0+ is installed as a dev dependency
// 3. Ensure @types/jest v29.0.0+ is installed as a dev dependency
// 4. Create jest.setup.js file in the backend directory for custom test setup
// 5. Verify TypeScript configuration in tsconfig.json is properly set up

/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  // Requirement: TypeScript Support
  // Using ts-jest preset for TypeScript testing environment
  preset: 'ts-jest',
  
  // Setting Node.js as the test environment for backend testing
  testEnvironment: 'node',
  
  // Define root directory for test discovery
  roots: ['<rootDir>'],
  
  // Configure module path aliases to match TypeScript path mappings
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@api/(.*)$': '<rootDir>/api/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@types/(.*)$': '<rootDir>/types/$1'
  },
  
  // Custom test setup file
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test file patterns to match
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  
  // Requirement: Test Coverage
  // Enable coverage reporting
  collectCoverage: true,
  
  // Specify which files to collect coverage from
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/.next/**'
  ],
  
  // Requirement: Test Coverage
  // Set minimum coverage thresholds to 80% as per security requirements
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Configure TypeScript transformation using ts-jest
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: './tsconfig.json'
    }]
  },
  
  // Ignore patterns for test runner
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/dist/'
  ],
  
  // Enable verbose test output
  verbose: true,
  
  // Clear mock calls and instances between every test
  clearMocks: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // Indicates whether each individual test should be reported during the run
  silent: false
};

module.exports = config;