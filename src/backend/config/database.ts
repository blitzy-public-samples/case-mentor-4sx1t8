// @requirement: Database Layer - Supabase (PostgreSQL) with horizontal read replicas, connection pooling, and automated backups
// @requirement: Data Security - Database security configuration including encryption and access controls

import { createClient } from '@supabase/supabase-js'; // ^2.38.0
import { DatabaseConfig } from '../types/config';

// Default configuration values
export const DEFAULT_POOL_MIN: number = 2;
export const DEFAULT_POOL_MAX: number = 10;
export const DEFAULT_BACKUP_FREQUENCY: string = 'daily';

/**
 * Human Tasks:
 * 1. Set up SUPABASE_URL and SUPABASE_KEY environment variables in .env files
 * 2. Configure read replica distribution in Supabase dashboard
 * 3. Verify SSL certificates are properly configured
 * 4. Set up automated backup retention policies
 * 5. Configure database encryption keys in Supabase dashboard
 */

/**
 * Validates database configuration settings
 * @param config DatabaseConfig object containing connection settings
 * @throws Error if configuration is invalid
 */
export const validateDatabaseConfig = (config: DatabaseConfig): void => {
    // Validate database URL format
    try {
        new URL(config.url);
    } catch (error) {
        throw new Error('Invalid database URL format');
    }

    // Validate pool configuration
    if (!Number.isInteger(config.poolMin) || config.poolMin < 0) {
        throw new Error('Pool minimum must be a positive integer');
    }
    if (!Number.isInteger(config.poolMax) || config.poolMax < config.poolMin) {
        throw new Error('Pool maximum must be greater than pool minimum');
    }

    // Validate backup frequency
    const validFrequencies = ['hourly', 'daily', 'weekly'];
    if (!validFrequencies.includes(config.backupFrequency)) {
        throw new Error('Invalid backup frequency. Must be one of: ' + validFrequencies.join(', '));
    }

    // Verify required environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
        throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_KEY');
    }

    // Validate SSL configuration
    if (!config.url.includes('sslmode=require')) {
        throw new Error('SSL mode must be required for database connections');
    }
};

// Database configuration object
export const databaseConfig: DatabaseConfig = {
    url: process.env.SUPABASE_URL || '',
    poolMin: DEFAULT_POOL_MIN,
    poolMax: DEFAULT_POOL_MAX,
    backupFrequency: DEFAULT_BACKUP_FREQUENCY,
};

// Validate configuration before creating client
validateDatabaseConfig(databaseConfig);

// Initialize Supabase client with connection pooling and encryption
export const supabaseClient = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || '',
    {
        auth: {
            persistSession: false,
            autoRefreshToken: true,
        },
        db: {
            schema: 'public',
        },
        global: {
            headers: {
                'x-connection-encrypted': 'true',
            },
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
        // Configure connection pool
        pool: {
            min: databaseConfig.poolMin,
            max: databaseConfig.poolMax,
            idleTimeoutMillis: 120000, // 2 minutes
            createTimeoutMillis: 5000, // 5 seconds
            acquireTimeoutMillis: 10000, // 10 seconds
            propagateCreateError: false,
        },
    }
);