-- Human Tasks:
-- 1. Ensure PostgreSQL version 12 or higher is installed (required for JSONB and partitioning features)
-- 2. Verify database has sufficient storage capacity for JSONB data and partitions
-- 3. Review partition maintenance strategy for historical data
-- 4. Configure appropriate backup strategy for simulation data
-- 5. Monitor partition size growth and adjust retention policy as needed

-- Requirement: McKinsey Simulation (3. SCOPE/Core Features/McKinsey Simulation)
-- Create table for tracking ecosystem simulation attempts with comprehensive metrics and state tracking
CREATE TABLE simulation_attempts (
    -- Primary identifier for each simulation attempt
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link to user making the attempt
    -- Requirement: Progress Tracking (3. SCOPE/Core Features/User Management)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Current state of the simulation attempt
    status TEXT NOT NULL DEFAULT 'SETUP'
        CHECK (status IN ('SETUP', 'RUNNING', 'COMPLETED', 'FAILED')),
    
    -- Selected species configuration and parameters
    species_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Environmental conditions affecting the simulation
    environment_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Current ecosystem state and dynamics
    ecosystem_state JSONB DEFAULT '{}'::jsonb,
    
    -- Performance and evaluation metrics
    metrics JSONB DEFAULT '{}'::jsonb,
    
    -- Overall performance score
    score INTEGER CHECK (score >= 0 AND score <= 100),
    
    -- Structured feedback for improvement
    feedback JSONB DEFAULT '[]'::jsonb,
    
    -- Time tracking metrics
    time_spent INTEGER DEFAULT 0,
    
    -- Timestamps for attempt lifecycle
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    completed_at TIMESTAMP WITH TIME ZONE
) PARTITION BY RANGE (started_at);

-- Create indexes for optimizing common query patterns
CREATE INDEX simulation_attempts_user_id_idx ON simulation_attempts USING btree (user_id);
CREATE INDEX simulation_attempts_status_idx ON simulation_attempts USING btree (status);
CREATE INDEX simulation_attempts_completed_at_idx ON simulation_attempts USING btree (completed_at);

-- Create initial partition
-- Creates partition for current month and next month to ensure continuous operation
CREATE TABLE simulation_attempts_y2024m01 PARTITION OF simulation_attempts
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE simulation_attempts_y2024m02 PARTITION OF simulation_attempts
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Add comprehensive table and column documentation
COMMENT ON TABLE simulation_attempts IS 'Core simulation_attempts table for tracking McKinsey ecosystem simulation game attempts';
COMMENT ON COLUMN simulation_attempts.id IS 'Unique identifier for each simulation attempt';
COMMENT ON COLUMN simulation_attempts.user_id IS 'Foreign key reference to the user making the attempt, cascades deletion';
COMMENT ON COLUMN simulation_attempts.status IS 'Current status of the simulation attempt with strict state validation';
COMMENT ON COLUMN simulation_attempts.species_data IS 'Selected species and their configurations in JSON format including population sizes, traits, and interactions';
COMMENT ON COLUMN simulation_attempts.environment_parameters IS 'Environment configuration parameters (temperature, depth, salinity, light level) affecting species interactions';
COMMENT ON COLUMN simulation_attempts.ecosystem_state IS 'Current state of the ecosystem including species interactions, population dynamics, and stability metrics';
COMMENT ON COLUMN simulation_attempts.metrics IS 'Performance metrics including species diversity index, trophic efficiency, stability score, and ecosystem resilience';
COMMENT ON COLUMN simulation_attempts.score IS 'Overall simulation performance score (0-100) based on ecosystem stability and diversity';
COMMENT ON COLUMN simulation_attempts.feedback IS 'Array of structured feedback messages about ecosystem design, species balance, and improvement suggestions';
COMMENT ON COLUMN simulation_attempts.time_spent IS 'Time spent in seconds on the simulation attempt for performance tracking';
COMMENT ON COLUMN simulation_attempts.started_at IS 'UTC timestamp when the simulation attempt was started';
COMMENT ON COLUMN simulation_attempts.completed_at IS 'UTC timestamp when the simulation attempt was completed or failed';

-- Create function to manage partition creation
CREATE OR REPLACE FUNCTION create_simulation_attempts_partition()
RETURNS void AS $$
DECLARE
    next_partition_date DATE;
    partition_name TEXT;
    partition_start_date TEXT;
    partition_end_date TEXT;
BEGIN
    next_partition_date := date_trunc('month', NOW() + INTERVAL '1 month')::DATE;
    partition_name := 'simulation_attempts_y' || 
                     to_char(next_partition_date, 'YYYY') ||
                     'm' || 
                     to_char(next_partition_date, 'MM');
    partition_start_date := to_char(next_partition_date, 'YYYY-MM-DD');
    partition_end_date := to_char(next_partition_date + INTERVAL '1 month', 'YYYY-MM-DD');
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF simulation_attempts
         FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        partition_start_date,
        partition_end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Create event trigger to automatically create next month's partition
CREATE OR REPLACE FUNCTION trigger_create_next_partition()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_simulation_attempts_partition();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_next_partition
    AFTER INSERT ON simulation_attempts
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_create_next_partition();