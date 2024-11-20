-- Human Tasks:
-- 1. Ensure PostgreSQL version 12 or higher is installed (required for JSONB and partitioning features)
-- 2. Verify database has sufficient storage capacity for JSONB data and partitions
-- 3. Review partition maintenance strategy for historical data
-- 4. Consider implementing partition cleanup policy based on data retention requirements

-- Requirement: Practice Drills (3. SCOPE/Core Features/Practice Drills)
-- Create table to track user attempts across different drill types
CREATE TABLE drill_attempts (
    -- Unique identifier for each attempt
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference to user making the attempt
    -- Requirement: User Management (3. SCOPE/Core Features/User Management)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Type of drill being attempted
    drill_type TEXT NOT NULL CHECK (
        drill_type IN (
            'CASE_PROMPT',
            'CALCULATION',
            'CASE_MATH',
            'BRAINSTORMING',
            'MARKET_SIZING',
            'SYNTHESIZING'
        )
    ),
    
    -- Difficulty level for progression tracking
    difficulty TEXT NOT NULL CHECK (
        difficulty IN (
            'BEGINNER',
            'INTERMEDIATE',
            'ADVANCED'
        )
    ),
    
    -- Current status of attempt
    -- Requirement: User Engagement (2. SYSTEM OVERVIEW/Success Criteria)
    status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (
        status IN (
            'NOT_STARTED',
            'IN_PROGRESS',
            'COMPLETED',
            'EVALUATED'
        )
    ),
    
    -- User's response data in flexible JSON format
    response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Performance score for analytics
    -- Requirement: Progress Tracking (3. SCOPE/Core Features/User Management)
    score INTEGER CHECK (score >= 0 AND score <= 100),
    
    -- Structured feedback from evaluation
    feedback JSONB DEFAULT '{}'::jsonb,
    
    -- Time tracking for performance analytics
    time_spent INTEGER DEFAULT 0,
    
    -- Timestamps for attempt lifecycle
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    completed_at TIMESTAMP WITH TIME ZONE,
    evaluated_at TIMESTAMP WITH TIME ZONE
) PARTITION BY RANGE (started_at);

-- Create indexes for optimizing common queries
CREATE INDEX drill_attempts_user_id_idx 
    ON drill_attempts USING btree (user_id);

CREATE INDEX drill_attempts_type_status_idx 
    ON drill_attempts USING btree (drill_type, status);

CREATE INDEX drill_attempts_completed_at_idx 
    ON drill_attempts USING btree (completed_at);

-- Create initial partitions for the next 12 months
-- Partitions are created monthly for efficient data management
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
    partition_date DATE;
    partition_name TEXT;
    sql TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        partition_date := start_date + (i || ' months')::INTERVAL;
        partition_name := 'drill_attempts_' || TO_CHAR(partition_date, 'YYYY_MM');
        sql := FORMAT(
            'CREATE TABLE %I PARTITION OF drill_attempts 
            FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            partition_date,
            partition_date + '1 month'::INTERVAL
        );
        EXECUTE sql;
    END LOOP;
END $$;

-- Add table comments for documentation
COMMENT ON TABLE drill_attempts IS 'Tracks user practice attempts and performance across different drill types';
COMMENT ON COLUMN drill_attempts.id IS 'Unique identifier for each drill attempt';
COMMENT ON COLUMN drill_attempts.user_id IS 'Foreign key reference to the user making the attempt';
COMMENT ON COLUMN drill_attempts.drill_type IS 'Type of drill being attempted';
COMMENT ON COLUMN drill_attempts.difficulty IS 'Difficulty level of the drill';
COMMENT ON COLUMN drill_attempts.status IS 'Current status of the drill attempt';
COMMENT ON COLUMN drill_attempts.response_data IS 'User''s response data in JSON format';
COMMENT ON COLUMN drill_attempts.score IS 'Evaluation score (0-100) for performance tracking';
COMMENT ON COLUMN drill_attempts.feedback IS 'Structured feedback from AI evaluation';
COMMENT ON COLUMN drill_attempts.time_spent IS 'Time spent in seconds on the drill';
COMMENT ON COLUMN drill_attempts.started_at IS 'UTC timestamp when the drill attempt was started';
COMMENT ON COLUMN drill_attempts.completed_at IS 'UTC timestamp when the drill attempt was completed';
COMMENT ON COLUMN drill_attempts.evaluated_at IS 'UTC timestamp when the drill attempt was evaluated';