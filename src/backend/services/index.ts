/**
 * Central service module that aggregates and exports all service classes
 * for the Case Interview Practice Platform.
 * 
 * Human Tasks:
 * 1. Verify service initialization order in production environment
 * 2. Configure monitoring for service health checks
 * 3. Set up centralized error tracking for all services
 * 4. Review service dependency graph for potential circular dependencies
 */

// Import service classes
import { DrillService } from './DrillService';
import { FeedbackService } from './FeedbackService';
import { SimulationService } from './SimulationService';
import { SubscriptionService } from './SubscriptionService';
import { UserService } from './UserService';

/**
 * @requirement Core Services - AI evaluation, subscription management, progress tracking
 * through centralized service layer (2. SYSTEM OVERVIEW/High-Level Description)
 */
export {
  DrillService,
  FeedbackService,
  SimulationService,
  SubscriptionService,
  UserService
};

/**
 * Service initialization and dependency management utilities
 * @requirement System Architecture - Service layer organization for business logic implementation
 * with proper dependency management (5. SYSTEM ARCHITECTURE/5.2 Component Details)
 */

// Track initialized services
const initializedServices = new Map<string, any>();

/**
 * Ensures services are properly initialized with dependencies
 */
export function initializeServices(): void {
  // Initialize services in dependency order
  if (!initializedServices.has('SubscriptionService')) {
    initializedServices.set('SubscriptionService', new SubscriptionService());
  }

  if (!initializedServices.has('UserService')) {
    initializedServices.set('UserService', new UserService());
  }

  if (!initializedServices.has('DrillService')) {
    const subscriptionService = initializedServices.get('SubscriptionService');
    initializedServices.set('DrillService', new DrillService());
  }

  if (!initializedServices.has('FeedbackService')) {
    initializedServices.set('FeedbackService', new FeedbackService());
  }

  if (!initializedServices.has('SimulationService')) {
    const subscriptionService = initializedServices.get('SubscriptionService');
    initializedServices.set('SimulationService', new SimulationService());
  }
}

/**
 * Retrieves an initialized service instance
 */
export function getService<T>(serviceName: string): T {
  if (!initializedServices.has(serviceName)) {
    throw new Error(`Service ${serviceName} has not been initialized`);
  }
  return initializedServices.get(serviceName) as T;
}

/**
 * Checks if all required services are initialized
 */
export function checkServicesHealth(): boolean {
  const requiredServices = [
    'DrillService',
    'FeedbackService',
    'SimulationService',
    'SubscriptionService',
    'UserService'
  ];

  return requiredServices.every(service => initializedServices.has(service));
}

/**
 * Resets service initialization state (useful for testing)
 */
export function resetServices(): void {
  initializedServices.clear();
}

// Initialize services on module load
initializeServices();