// Required package versions:
// jest-environment-jsdom@^29.0.0
// @testing-library/jest-dom@^5.16.0
// identity-obj-proxy@^3.0.0
// babel-jest@^29.0.0
// jest-watch-typeahead@^2.0.0

/** @type {import('jest').Config} */
const config = {
  // Requirement: Development Environment - Testing configuration with Jest for unit tests
  // Set jsdom test environment for React component testing
  testEnvironment: 'jsdom',

  // Setup file for custom Jest matchers and global test configuration
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],

  // Module name mapping for TypeScript path aliases and asset mocking
  // Aligned with tsconfig.json paths configuration
  moduleNameMapper: {
    // Path aliases for application modules
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/config/(.*)$': '<rootDir>/config/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',

    // Asset mocks
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },

  // Patterns to ignore during test discovery
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/out/'
  ],

  // Requirement: Frontend Testing - Configuration for testing React components
  // Transform configuration for TypeScript and JSX files
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: ['next/babel']
    }]
  },

  // Coverage configuration for tracking test coverage
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    // Exclude type declaration files and node_modules
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],

  // Coverage thresholds to maintain code quality
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Watch plugins for improved test development experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};

module.exports = config;