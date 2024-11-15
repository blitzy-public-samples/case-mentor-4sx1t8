-- Human Tasks:
-- 1. Ensure PostgreSQL version 12 or higher is installed (required for JSONB and partitioning features)
-- 2. Verify database has sufficient storage capacity for JSONB data and partitions
-- 3. Review partition maintenance strategy for historical data
-- 4. Monitor feedback metrics for AI model performance tracking
-- 5. Consider implementing partition cleanup policy based on data retention requirements

-- Requirement: AI Evaluation (2. SYSTEM OVERVIEW/Core Services)
-- Create table for storing detailed AI-generated feedback for both drill and simulation attempts
CREATE TABLE feedback (
    -- Unique identifier for each feedback entry
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Type of attempt this feedback is for
    -- Requirement: Progress Tracking (3. SCOPE/Core Features/User Management)
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('DRILL', 'SIMULATION')),
    
    -- References to attempt tables with cascade delete
    drill_attempt_id UUID REFERENCES drill_attempts(id) ON DELETE CASCADE,
    simulation_attempt_id UUID REFERENCES simulation_attempts(id) ON DELETE CASCADE,
    
    -- Structured feedback content
    -- Requirement: User Satisfaction (2. SYSTEM OVERVIEW/Success Criteria)
    feedback_content JSONB NOT NULL,
    
    -- Performance score
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    
    -- Detailed evaluation metrics
    evaluation_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Areas identified for improvement
    improvement_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- AI model version for quality tracking
    model_version TEXT NOT NULL,
    
    -- Timestamp for feedback generation
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
) PARTITION BY RANGE (created_at);

-- Enforce polymorphic association constraint
ALTER TABLE feedback ADD CONSTRAINT feedback_attempt_type_check
    CHECK ((attempt_type = 'DRILL' AND drill_attempt_id IS NOT NULL AND simulation_attempt_id IS NULL) OR
           (attempt_type = 'SIMULATION' AND simulation_attempt_id IS NOT NULL AND drill_attempt_id IS NULL));

-- Create indexes for optimizing queries
CREATE INDEX feedback_drill_attempt_idx ON feedback USING btree (drill_attempt_id);
CREATE INDEX feedback_simulation_attempt_idx ON feedback USING btree (simulation_attempt_id);
CREATE INDEX feedback_created_at_idx ON feedback USING btree (created_at);

-- Create initial partitions for the next 12 months
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
    partition_date DATE;
    partition_name TEXT;
    sql TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        partition_date := start_date + (i || ' months')::INTERVAL;
        partition_name := 'feedback_' || TO_CHAR(partition_date, 'YYYY_MM');
        sql := FORMAT(
            'CREATE TABLE %I PARTITION OF feedback 
            FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            partition_date,
            partition_date + '1 month'::INTERVAL
        );
        EXECUTE sql;
    END LOOP;
END $$;

-- Create function to manage partition creation
CREATE OR REPLACE FUNCTION create_feedback_partition()
RETURNS void AS $$
DECLARE
    next_partition_date DATE;
    partition_name TEXT;
    partition_start_date TEXT;
    partition_end_date TEXT;
BEGIN
    next_partition_date := date_trunc('month', NOW() + INTERVAL '1 month')::DATE;
    partition_name := 'feedback_' || to_char(next_partition_date, 'YYYY_MM');
    partition_start_date := to_char(next_partition_date, 'YYYY-MM-DD');
    partition_end_date := to_char(next_partition_date + INTERVAL '1 month', 'YYYY-MM-DD');
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF feedback
         FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        partition_start_date,
        partition_end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Create event trigger to automatically create next month's partition
CREATE OR REPLACE FUNCTION trigger_create_next_feedback_partition()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_feedback_partition();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_next_feedback_partition
    AFTER INSERT ON feedback
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_create_next_feedback_partition();

-- Add table and column documentation
COMMENT ON TABLE feedback IS 'Stores AI-generated feedback for drill and simulation attempts with comprehensive evaluation metrics';
COMMENT ON COLUMN feedback.id IS 'Unique identifier for each feedback entry';
COMMENT ON COLUMN feedback.attempt_type IS 'Type of attempt this feedback is for (DRILL or SIMULATION)';
COMMENT ON COLUMN feedback.drill_attempt_id IS 'Reference to drill attempt if feedback is for a drill, cascades deletion';
COMMENT ON COLUMN feedback.simulation_attempt_id IS 'Reference to simulation attempt if feedback is for a simulation, cascades deletion';
COMMENT ON COLUMN feedback.feedback_content IS 'Structured feedback content including strengths, weaknesses, and improvement suggestions';
COMMENT ON COLUMN feedback.score IS 'Numerical score (0-100) assigned by AI evaluation for performance tracking';
COMMENT ON COLUMN feedback.evaluation_metrics IS 'Detailed evaluation metrics and rubric scores for analytics';
COMMENT ON COLUMN feedback.improvement_areas IS 'Array of specific areas identified for improvement with actionable suggestions';
COMMENT ON COLUMN feedback.model_version IS 'Version of the AI model used for evaluation';
COMMENT ON COLUMN feedback.created_at IS 'UTC timestamp when the feedback was generated';