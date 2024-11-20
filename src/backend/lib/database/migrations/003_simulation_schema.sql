-- Human Tasks:
-- 1. Ensure PostgreSQL version 12+ is installed (for generated columns support)
-- 2. Install uuid-ossp extension if not already installed
-- 3. Verify database user has necessary privileges for creating types and tables

-- Requirement: McKinsey Simulation - Database schema for ecosystem game replication
-- Create custom enum types for species categorization and simulation states
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE species_type AS ENUM (
    'PRODUCER',
    'CONSUMER',
    'DECOMPOSER'
);

CREATE TYPE simulation_status AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'TIMED_OUT'
);

CREATE TYPE species_interaction AS ENUM (
    'PREDATOR',
    'PREY',
    'COMPETITOR',
    'SYMBIOTIC',
    'NEUTRAL'
);

-- Requirement: Simulation Engine - Database structures for game logic
-- Create species templates table to store base species configurations
CREATE TABLE species_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type species_type NOT NULL,
    base_population INTEGER NOT NULL,
    energy_consumption DECIMAL NOT NULL,
    reproduction_rate DECIMAL NOT NULL,
    optimal_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient species filtering by type
CREATE INDEX species_templates_type_idx ON species_templates USING btree (type);

-- Requirement: McKinsey Simulation - Complex data analysis
-- Create species interactions table to model relationships between species
CREATE TABLE species_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    species_a_id UUID NOT NULL REFERENCES species_templates(id) ON DELETE CASCADE,
    species_b_id UUID NOT NULL REFERENCES species_templates(id) ON DELETE CASCADE,
    interaction_type species_interaction NOT NULL,
    interaction_strength DECIMAL NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT species_different CHECK (species_a_id != species_b_id),
    CONSTRAINT interaction_strength_range CHECK (interaction_strength >= 0 AND interaction_strength <= 1)
);

-- Create index for efficient lookup of species pairs
CREATE INDEX species_interactions_pair_idx ON species_interactions USING btree (species_a_id, species_b_id);

-- Requirement: McKinsey Simulation - Time-pressured scenarios
-- Create simulation attempts table to track ongoing and completed simulations
CREATE TABLE simulation_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status simulation_status NOT NULL DEFAULT 'NOT_STARTED',
    selected_species JSONB NOT NULL DEFAULT '[]'::jsonb,
    environment_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_remaining_seconds INTEGER NOT NULL DEFAULT 1800,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_remaining CHECK (time_remaining_seconds >= 0 AND time_remaining_seconds <= 1800)
);

-- Create indexes for efficient filtering and user history lookup
CREATE INDEX simulation_attempts_user_id_idx ON simulation_attempts USING btree (user_id);
CREATE INDEX simulation_attempts_status_idx ON simulation_attempts USING btree (status);

-- Requirement: McKinsey Simulation - Complex data analysis
-- Create simulation results table to store outcomes and analysis
CREATE TABLE simulation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES simulation_attempts(id) ON DELETE CASCADE,
    species_balance_score DECIMAL NOT NULL,
    survival_rate_score DECIMAL NOT NULL,
    ecosystem_stability_score DECIMAL NOT NULL,
    total_score DECIMAL NOT NULL,
    surviving_species JSONB NOT NULL DEFAULT '[]'::jsonb,
    ecosystem_survived BOOLEAN NOT NULL,
    feedback TEXT[] NOT NULL DEFAULT '{}',
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_species_balance_score CHECK (species_balance_score >= 0 AND species_balance_score <= 100),
    CONSTRAINT valid_survival_rate_score CHECK (survival_rate_score >= 0 AND survival_rate_score <= 100),
    CONSTRAINT valid_ecosystem_stability_score CHECK (ecosystem_stability_score >= 0 AND ecosystem_stability_score <= 100),
    CONSTRAINT valid_total_score CHECK (total_score >= 0 AND total_score <= 100)
);

-- Create index for efficient lookup of results by simulation
CREATE INDEX simulation_results_simulation_id_idx ON simulation_results USING btree (simulation_id);

-- Create triggers to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_species_templates_updated_at
    BEFORE UPDATE ON species_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_species_interactions_updated_at
    BEFORE UPDATE ON species_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_attempts_updated_at
    BEFORE UPDATE ON simulation_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_results_updated_at
    BEFORE UPDATE ON simulation_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE species_templates IS 'Base configurations for different species types in the ecosystem simulation';
COMMENT ON TABLE species_interactions IS 'Defines relationships and interaction strengths between species pairs';
COMMENT ON TABLE simulation_attempts IS 'Tracks individual simulation attempts and their current state';
COMMENT ON TABLE simulation_results IS 'Stores final outcomes and analysis of completed simulations';