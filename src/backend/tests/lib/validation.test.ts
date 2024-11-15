// Third-party imports
import { describe, test, expect } from 'jest'; // ^29.0.0
import { z } from 'zod'; // ^3.22.0

// Import validation functions and schemas
import {
  drillValidation,
  simulationValidation,
  userValidation
} from '../../lib/validation';

// Human Tasks:
// 1. Monitor test coverage and maintain >90% coverage for validation functions
// 2. Update test cases when new validation rules are added
// 3. Periodically review error messages for clarity and usefulness
// 4. Ensure test data matches production scenarios

describe('Drill Validation', () => {
  // Requirement: Input Validation - JSON Schema validation across all data types
  describe('validateDrillPrompt', () => {
    test('should validate valid drill prompt data', () => {
      const validPrompt = {
        type: 'market_sizing',
        timeLimit: 900,
        content: 'Calculate the market size for electric vehicles in Germany',
        difficulty: 'medium',
        industry: 'automotive'
      };
      
      expect(() => drillValidation.validateDrillPrompt(validPrompt)).not.toThrow();
      expect(drillValidation.DRILL_PROMPT_SCHEMA.parse(validPrompt)).toEqual(validPrompt);
    });

    test('should reject invalid drill type', () => {
      const invalidPrompt = {
        type: 'invalid_type',
        timeLimit: 900,
        content: 'Test content',
        difficulty: 'medium',
        industry: 'automotive'
      };
      
      expect(() => drillValidation.validateDrillPrompt(invalidPrompt)).toThrow();
      expect(() => drillValidation.DRILL_PROMPT_SCHEMA.parse(invalidPrompt))
        .toThrow(/Invalid drill type/);
    });

    test('should reject invalid time limit', () => {
      const invalidTimePrompt = {
        type: 'market_sizing',
        timeLimit: -100,
        content: 'Test content',
        difficulty: 'medium',
        industry: 'automotive'
      };
      
      expect(() => drillValidation.validateDrillPrompt(invalidTimePrompt)).toThrow();
      expect(() => drillValidation.DRILL_PROMPT_SCHEMA.parse(invalidTimePrompt))
        .toThrow(/Time limit must be positive/);
    });

    test('should reject empty content', () => {
      const emptyContentPrompt = {
        type: 'market_sizing',
        timeLimit: 900,
        content: '',
        difficulty: 'medium',
        industry: 'automotive'
      };
      
      expect(() => drillValidation.validateDrillPrompt(emptyContentPrompt)).toThrow();
      expect(() => drillValidation.DRILL_PROMPT_SCHEMA.parse(emptyContentPrompt))
        .toThrow(/Content cannot be empty/);
    });

    test('should validate schema types at runtime', () => {
      const invalidTypePrompt = {
        type: 'market_sizing',
        timeLimit: '900', // Should be number
        content: 123, // Should be string
        difficulty: 'medium',
        industry: 'automotive'
      };
      
      expect(() => drillValidation.validateDrillPrompt(invalidTypePrompt)).toThrow();
      expect(() => drillValidation.DRILL_PROMPT_SCHEMA.parse(invalidTypePrompt))
        .toThrow(/Expected number, received string/);
    });
  });

  // Requirement: Security Controls - Test validation rules for structured data
  describe('validateDrillResponse', () => {
    test('should validate drill attempt response', () => {
      const validResponse = {
        promptId: 'abc-123',
        content: 'Market size calculation: 500,000 units * €30,000 = €15B TAM',
        timeSpent: 850,
        attachments: []
      };
      
      expect(() => drillValidation.validateDrillResponse(validResponse)).not.toThrow();
      expect(drillValidation.DRILL_ATTEMPT_SCHEMA.parse(validResponse)).toEqual(validResponse);
    });

    test('should validate response with attachments', () => {
      const responseWithAttachments = {
        promptId: 'abc-123',
        content: 'Market sizing with calculations',
        timeSpent: 850,
        attachments: ['calc1.jpg', 'notes.pdf']
      };
      
      expect(() => drillValidation.validateDrillResponse(responseWithAttachments)).not.toThrow();
      expect(drillValidation.DRILL_ATTEMPT_SCHEMA.parse(responseWithAttachments))
        .toEqual(responseWithAttachments);
    });
  });

  // Requirement: Input Validation - Test validation rules for numerical data
  describe('validateDrillEvaluation', () => {
    test('should validate evaluation with valid score', () => {
      const validEvaluation = {
        attemptId: 'def-456',
        score: 85,
        feedback: 'Good structure and calculations',
        areas: ['framework', 'math']
      };
      
      expect(() => drillValidation.validateDrillEvaluation(validEvaluation)).not.toThrow();
      expect(drillValidation.DRILL_EVALUATION_SCHEMA.parse(validEvaluation))
        .toEqual(validEvaluation);
    });

    test('should reject invalid score range', () => {
      const invalidScoreEvaluation = {
        attemptId: 'def-456',
        score: 101,
        feedback: 'Test feedback',
        areas: ['framework']
      };
      
      expect(() => drillValidation.validateDrillEvaluation(invalidScoreEvaluation)).toThrow();
      expect(() => drillValidation.DRILL_EVALUATION_SCHEMA.parse(invalidScoreEvaluation))
        .toThrow(/Score must be between 0 and 100/);
    });
  });
});

describe('Simulation Validation', () => {
  // Requirement: Security Controls - Test validation rules for complex objects
  describe('validateSpecies', () => {
    test('should validate valid species configuration', () => {
      const validSpecies = {
        name: 'Atlantic Cod',
        type: 'consumer',
        energyRequirement: 50,
        reproductionRate: 1.5,
        population: 1000
      };
      
      expect(() => simulationValidation.validateSpecies(validSpecies)).not.toThrow();
      expect(simulationValidation.simulationSchemas.species.parse(validSpecies))
        .toEqual(validSpecies);
    });

    test('should reject invalid energy requirements', () => {
      const invalidEnergy = {
        name: 'Atlantic Cod',
        type: 'consumer',
        energyRequirement: -10,
        reproductionRate: 1.5,
        population: 1000
      };
      
      expect(() => simulationValidation.validateSpecies(invalidEnergy)).toThrow();
      expect(() => simulationValidation.simulationSchemas.species.parse(invalidEnergy))
        .toThrow(/Energy requirement must be positive/);
    });
  });

  describe('validateEnvironment', () => {
    test('should validate environment parameters', () => {
      const validEnvironment = {
        temperature: 20,
        sunlight: 75,
        nutrients: 100,
        capacity: 10000
      };
      
      expect(() => simulationValidation.validateEnvironment(validEnvironment)).not.toThrow();
      expect(simulationValidation.simulationSchemas.environment.parse(validEnvironment))
        .toEqual(validEnvironment);
    });
  });

  describe('validateSimulationState', () => {
    test('should validate valid simulation state', () => {
      const validState = {
        tick: 100,
        species: [],
        environment: {
          temperature: 20,
          sunlight: 75,
          nutrients: 100,
          capacity: 10000
        },
        events: []
      };
      
      expect(() => simulationValidation.validateSimulationState(validState)).not.toThrow();
    });
  });
});

describe('User Validation', () => {
  // Requirement: Security Controls - Test validation rules for user data
  describe('validateUserRegistration', () => {
    test('should validate valid registration data', () => {
      const validRegistration = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
        university: 'MIT'
      };
      
      expect(() => userValidation.validateUserRegistration(validRegistration)).not.toThrow();
      expect(userValidation.userRegistrationSchema.parse(validRegistration))
        .toEqual(validRegistration);
    });

    test('should reject invalid email format', () => {
      const invalidEmail = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'John Doe',
        university: 'MIT'
      };
      
      expect(() => userValidation.validateUserRegistration(invalidEmail)).toThrow();
      expect(() => userValidation.userRegistrationSchema.parse(invalidEmail))
        .toThrow(/Invalid email format/);
    });

    test('should reject weak passwords', () => {
      const weakPassword = {
        email: 'user@example.com',
        password: '123456',
        name: 'John Doe',
        university: 'MIT'
      };
      
      expect(() => userValidation.validateUserRegistration(weakPassword)).toThrow();
      expect(() => userValidation.userRegistrationSchema.parse(weakPassword))
        .toThrow(/Password must meet complexity requirements/);
    });
  });

  describe('validateProfileUpdate', () => {
    test('should validate profile updates', () => {
      const validUpdate = {
        name: 'John Smith',
        university: 'Harvard',
        graduationYear: 2024,
        targetFirms: ['McKinsey', 'BCG']
      };
      
      expect(() => userValidation.validateProfileUpdate(validUpdate)).not.toThrow();
      expect(userValidation.userProfileSchema.parse(validUpdate))
        .toEqual(validUpdate);
    });
  });

  describe('validateSubscriptionUpdate', () => {
    test('should validate subscription updates', () => {
      const validSubscription = {
        plan: 'premium',
        startDate: '2024-01-01',
        autoRenew: true,
        paymentMethod: 'card_123'
      };
      
      expect(() => userValidation.validateSubscriptionUpdate(validSubscription)).not.toThrow();
      expect(userValidation.subscriptionUpdateSchema.parse(validSubscription))
        .toEqual(validSubscription);
    });
  });
});