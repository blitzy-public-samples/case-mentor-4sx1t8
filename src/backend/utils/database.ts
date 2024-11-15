/**
 * Human Tasks:
 * 1. Ensure Supabase project is properly configured with read replicas
 * 2. Verify SSL certificates are installed and up to date
 * 3. Set up monitoring for connection pool metrics
 * 4. Configure backup retention policies in Supabase dashboard
 * 5. Set up error tracking system for database errors
 */

// @requirement: Database Layer - Supabase (PostgreSQL) with horizontal read replicas, connection pooling, and automated backups
// @requirement: Data Security - Secure database operations with encryption and access control

import { createClient, SupabaseClient } from '@supabase/supabase-js'; // ^2.38.0
import { PostgrestFilterBuilder } from '@supabase/postgrest-js'; // ^1.8.0
import { DatabaseConfig } from '../types/config';
import { databaseConfig } from '../config/database';

// Global client instance
let supabaseClient: SupabaseClient;

// Query options interface
interface QueryOptions {
  timeout?: number;
  singleRow?: boolean;
  readOnly?: boolean;
}

// Query filters interface
interface QueryFilters {
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
  joins?: Array<{
    table: string;
    on: string;
    type?: 'LEFT' | 'RIGHT' | 'INNER';
  }>;
}

/**
 * Custom error class for database operations
 * @requirement: Data Security - Error handling with detailed information for monitoring
 */
export class DatabaseError extends Error {
  public code: string;
  public originalError: any;

  constructor(message: string, code: string, originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.originalError = originalError;
    Error.captureStackTrace(this, DatabaseError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      stack: this.stack,
      originalError: this.originalError ? {
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Initializes the database connection pool
 * @requirement: Database Layer - Connection pooling configuration
 */
export async function initializePool(config: DatabaseConfig): Promise<void> {
  try {
    supabaseClient = createClient(config.url, process.env.SUPABASE_KEY || '', {
      auth: {
        persistSession: false,
        autoRefreshToken: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-connection-encrypted': 'true'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      pool: {
        min: config.poolMin,
        max: config.poolMax,
        idleTimeoutMillis: 120000,
        createTimeoutMillis: 5000,
        acquireTimeoutMillis: 10000,
        propagateCreateError: false
      }
    });

    // Verify connection with test query
    await supabaseClient.from('_health').select('*').limit(1);
  } catch (error) {
    throw new DatabaseError(
      'Failed to initialize database pool',
      'POOL_INIT_ERROR',
      error as Error
    );
  }
}

/**
 * Executes a database query with proper error handling
 * @requirement: Data Security - Secure query execution with parameterization
 */
export async function executeQuery<T>(
  query: string,
  params: any[] = [],
  options: QueryOptions = {}
): Promise<T> {
  const timeout = options.timeout || 30000; // 30 second default timeout
  
  try {
    const result = await Promise.race([
      supabaseClient.rpc(query, ...params),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      )
    ]);

    if (options.singleRow) {
      return (result as any).single();
    }
    
    return result as T;
  } catch (error) {
    throw new DatabaseError(
      'Query execution failed',
      'QUERY_ERROR',
      error as Error
    );
  }
}

/**
 * Executes multiple queries within a transaction
 * @requirement: Database Layer - Transaction management with automatic rollback
 */
export async function withTransaction<T>(
  callback: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  try {
    await supabaseClient.rpc('begin_transaction');
    const result = await callback(supabaseClient);
    await supabaseClient.rpc('commit_transaction');
    return result;
  } catch (error) {
    await supabaseClient.rpc('rollback_transaction');
    throw new DatabaseError(
      'Transaction failed',
      'TRANSACTION_ERROR',
      error as Error
    );
  }
}

/**
 * Builds a type-safe database query
 * @requirement: Database Layer - Type-safe query building
 */
export function buildQuery<T>(
  table: string,
  filters: QueryFilters
): PostgrestFilterBuilder<T> {
  let query = supabaseClient
    .from(table)
    .select('*') as PostgrestFilterBuilder<T>;

  if (filters.where) {
    Object.entries(filters.where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  if (filters.orderBy) {
    query = query.order(filters.orderBy);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  if (filters.joins) {
    filters.joins.forEach(join => {
      query = query.select(`${join.table}!inner(*)`)
        .eq(join.on.split('=')[0], join.on.split('=')[1]);
    });
  }

  return query;
}

// Initialize pool on module load
initializePool(databaseConfig).catch(error => {
  console.error('Failed to initialize database pool:', error);
  process.exit(1);
});