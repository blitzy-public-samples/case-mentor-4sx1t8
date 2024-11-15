// Human Tasks:
// 1. Ensure @testing-library/jest-dom is installed with version ^6.1.0
// 2. Ensure jest-environment-jsdom is installed with version ^29.7.0
// 3. Ensure whatwg-fetch is installed with version ^3.6.0
// 4. Ensure msw is installed with version ^1.3.0
// 5. Configure jest.config.js to use this setup file

// External dependencies versions:
// @testing-library/jest-dom@6.1.0
// jest-environment-jsdom@29.7.0
// whatwg-fetch@3.6.0
// msw@1.3.0

import '@testing-library/jest-dom'; // Extends Jest with custom DOM matchers
import 'whatwg-fetch'; // Polyfill for fetch API in test environment

// Requirement: Testing Environment
// Location: 4. TECHNOLOGY STACK/4.5 Development & Deployment/Development Environment
// Description: Setup for Jest testing framework with React Testing Library integration

/**
 * Mock implementation of ResizeObserver for testing components that use viewport measurements
 */
function mockResizeObserver(): void {
  class MockResizeObserver {
    observe(): void {
      // Mock implementation
    }
    
    unobserve(): void {
      // Mock implementation
    }
    
    disconnect(): void {
      // Mock implementation
    }
  }
  
  global.ResizeObserver = MockResizeObserver;
}

/**
 * Mock implementation of IntersectionObserver for testing components with infinite scroll or lazy loading
 */
function mockIntersectionObserver(): void {
  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      // Store callback for future use if needed
      this.callback = callback;
    }
    
    observe(): void {
      // Mock implementation
    }
    
    unobserve(): void {
      // Mock implementation
    }
    
    disconnect(): void {
      // Mock implementation
    }
    
    private callback: IntersectionObserverCallback;
  }
  
  global.IntersectionObserver = MockIntersectionObserver as any;
}

// Requirement: UI Component Testing
// Location: 6. USER INTERFACE DESIGN/6.1 Design System
// Description: Setup for testing UI components with React Testing Library and custom DOM matchers

// Initialize mock observers
mockResizeObserver();
mockIntersectionObserver();

// Requirement: System Testing
// Location: 7. SYSTEM DESIGN/7.3 API Design/7.3.2 Endpoint Specifications
// Description: Configuration for API endpoint testing and mocking using Mock Service Worker (MSW)

// Global test configuration
beforeAll(() => {
  // Suppress console errors during tests
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console error
  (console.error as jest.Mock).mockRestore();
});

// Add custom matchers if needed
expect.extend({
  // Example custom matcher for testing UI components
  toBeVisibleInViewport(received: HTMLElement) {
    const pass = received.getBoundingClientRect().top >= 0;
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to be visible in viewport`
          : `Expected element to be visible in viewport`,
    };
  },
});

// Configure default test timeout
jest.setTimeout(10000); // 10 seconds

// Configure fetch behavior for tests
global.fetch = fetch;