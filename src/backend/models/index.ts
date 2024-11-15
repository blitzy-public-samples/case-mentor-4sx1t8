/**
 * Central export file for all model classes in the Case Interview Practice Platform backend
 * @requirement Core Features - Centralizes access to models for Practice Drills, McKinsey Simulation, User Management, and Subscription System
 * @requirement Data Storage - Provides unified access to database models for Users & Profiles, Drill Attempts & Results, Simulation Data, and Subscription Status
 */

// Import model classes from their respective files
import { DrillAttemptModel } from './DrillAttempt';
import { Feedback } from './Feedback';
import { SimulationAttempt } from './SimulationAttempt';
import { SubscriptionModel } from './Subscription';
import { UserModel } from './User';

// Export all models with their exposed members
export {
    // Practice Drill Models
    DrillAttemptModel,
    // Methods: save, complete, calculateMetrics
    
    // AI Feedback Models
    Feedback,
    // Methods: save, update, delete, findById, findByAttempt
    
    // Simulation Models
    SimulationAttempt,
    // Methods: save, updateState, complete
    
    // Subscription Models
    SubscriptionModel,
    // Methods: create, findById, findByUserId
    
    // User Management Models
    UserModel
    // Methods: createUser, getUserById, updateUserProfile, authenticateUser, updateSubscription
};