-- Migration to create and populate drill types lookup tables and enums
-- Requirement: Practice Drills - Database schema for Case Prompt, Calculations, Case Math, 
-- Brainstorming, Market Sizing, and Synthesizing Drills with metadata, evaluation criteria, 
-- and difficulty levels

-- Create drill type enum
DO $$ BEGIN
    CREATE TYPE drill_type AS ENUM (
        'CASE_PROMPT',
        'CALCULATIONS', 
        'CASE_MATH',
        'BRAINSTORMING',
        'MARKET_SIZING',
        'SYNTHESIZING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create drill difficulty enum
DO $$ BEGIN
    CREATE TYPE drill_difficulty AS ENUM (
        'BEGINNER',
        'INTERMEDIATE',
        'ADVANCED',
        'EXPERT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create drill type metadata table
CREATE TABLE IF NOT EXISTS drill_type_metadata (
    type drill_type PRIMARY KEY,
    display_name text NOT NULL,
    description text NOT NULL,
    time_limit_default integer NOT NULL,
    evaluation_criteria_template jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Create index on drill type
CREATE INDEX IF NOT EXISTS drill_type_metadata_type_idx ON drill_type_metadata (type);

-- Create drill difficulty metadata table
CREATE TABLE IF NOT EXISTS drill_difficulty_metadata (
    level drill_difficulty PRIMARY KEY,
    display_name text NOT NULL,
    description text NOT NULL,
    points_multiplier integer NOT NULL
);

-- Create index on difficulty level
CREATE INDEX IF NOT EXISTS drill_difficulty_metadata_level_idx ON drill_difficulty_metadata (level);

-- Populate drill type metadata
INSERT INTO drill_type_metadata (type, display_name, description, time_limit_default, evaluation_criteria_template)
VALUES
    ('CASE_PROMPT', 'Case Prompt', 'Practice analyzing and structuring responses to case interview prompts', 900,
     '[{"category":"Structure","weight":0.4},{"category":"Analysis","weight":0.3},{"category":"Communication","weight":0.3}]'),
    ('CALCULATIONS', 'Calculations', 'Practice quick mental math and business calculations', 300,
     '[{"category":"Accuracy","weight":0.5},{"category":"Speed","weight":0.3},{"category":"Method","weight":0.2}]'),
    ('CASE_MATH', 'Case Math', 'Practice complex mathematical analysis in business context', 600,
     '[{"category":"Accuracy","weight":0.4},{"category":"Approach","weight":0.3},{"category":"Explanation","weight":0.3}]'),
    ('BRAINSTORMING', 'Brainstorming', 'Practice generating and organizing ideas for business solutions', 600,
     '[{"category":"Creativity","weight":0.4},{"category":"Structure","weight":0.3},{"category":"Feasibility","weight":0.3}]'),
    ('MARKET_SIZING', 'Market Sizing', 'Practice estimating market sizes and business metrics', 600,
     '[{"category":"Logic","weight":0.4},{"category":"Assumptions","weight":0.3},{"category":"Calculations","weight":0.3}]'),
    ('SYNTHESIZING', 'Synthesizing', 'Practice combining insights and forming recommendations', 900,
     '[{"category":"Insights","weight":0.4},{"category":"Structure","weight":0.3},{"category":"Recommendation","weight":0.3}]')
ON CONFLICT (type) DO UPDATE
SET 
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    time_limit_default = EXCLUDED.time_limit_default,
    evaluation_criteria_template = EXCLUDED.evaluation_criteria_template;

-- Populate drill difficulty metadata
INSERT INTO drill_difficulty_metadata (level, display_name, description, points_multiplier)
VALUES
    ('BEGINNER', 'Beginner', 'Foundational concepts and basic scenarios', 1),
    ('INTERMEDIATE', 'Intermediate', 'More complex scenarios with multiple components', 2),
    ('ADVANCED', 'Advanced', 'Challenging scenarios requiring deep analysis', 3),
    ('EXPERT', 'Expert', 'Complex, multi-faceted scenarios for experienced practitioners', 4)
ON CONFLICT (level) DO UPDATE
SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    points_multiplier = EXCLUDED.points_multiplier;