// Human Tasks:
// 1. Verify Supabase project URL and anon key are set in environment variables
// 2. Confirm database policies are properly configured in Supabase dashboard
// 3. Review real-time subscription settings match application requirements
// 4. Validate retry and timeout settings against network conditions

// @supabase/supabase-js v2.38.0
import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../config/constants';

// Requirement: Database Layer - Supabase (PostgreSQL) integration for data persistence
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Creates and configures a Supabase client instance with optimized settings
 * Requirement: System Performance - Ensure <200ms API response time for 95% of requests
 */
const createSupabaseClient = () => {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        // Requirement: Authentication - JWT-based authentication implementation
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      global: {
        // Configure timeout and retry mechanisms for reliable operations
        timeout: API_CONFIG.TIMEOUT,
        headers: {
          'x-client-info': 'supabase-js/2.38.0'
        }
      },
      realtime: {
        // Optimize real-time subscription settings
        params: {
          eventsPerSecond: 10
        },
        retryAfterError: true,
        maxReconnectAttempts: API_CONFIG.RETRY_ATTEMPTS
      }
    }
  );

  return client;
};

// Export configured Supabase client instance for application-wide use
export const supabase = createSupabaseClient();

// Type-safe default export of the Supabase client
export default supabase;