-- Human Tasks:
-- 1. Verify PostgreSQL version 12 or higher is installed (required for JSONB support)
-- 2. Ensure the drill_attempts table has been created before running this seed
-- 3. Review and adjust time_limit values based on user testing feedback
-- 4. Validate evaluation_criteria matches the AI evaluation system capabilities

-- Requirement: Practice Drills (3. SCOPE/Core Features/Practice Drills)
-- Initialize core drill types with their configurations
INSERT INTO drill_types (
    code,
    name,
    description,
    difficulty_levels,
    time_limit,
    evaluation_criteria
)
VALUES 
    -- Case Prompt Drills
    (
        'CASE_PROMPT',
        'Case Prompt Drills',
        'Practice analyzing and structuring responses to case interview prompts',
        '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
        900, -- 15 minutes
        '{
            "structure": true,
            "clarity": true,
            "analysis_depth": true
        }'::jsonb
    ),
    
    -- Calculations Drills
    (
        'CALCULATION',
        'Calculations Drills',
        'Practice quick mental math and business calculations',
        '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
        300, -- 5 minutes
        '{
            "accuracy": true,
            "speed": true,
            "method": true
        }'::jsonb
    ),
    
    -- Case Math Drills
    (
        'CASE_MATH',
        'Case Math Drills',
        'Practice complex mathematical analysis in business contexts',
        '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
        600, -- 10 minutes
        '{
            "accuracy": true,
            "approach": true,
            "business_context": true
        }'::jsonb
    ),
    
    -- Brainstorming Drills
    (
        'BRAINSTORMING',
        'Brainstorming Drills',
        'Practice generating comprehensive solution ideas',
        '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
        600, -- 10 minutes
        '{
            "quantity": true,
            "quality": true,
            "creativity": true
        }'::jsonb
    ),
    
    -- Market Sizing Drills
    (
        'MARKET_SIZING',
        'Market Sizing Drills',
        'Practice estimating market sizes and volumes',
        '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
        600, -- 10 minutes
        '{
            "approach": true,
            "assumptions": true,
            "calculation": true
        }'::jsonb
    ),
    
    -- Synthesizing Drills
    (
        'SYNTHESIZING',
        'Synthesizing Drills',
        'Practice combining information to form coherent conclusions',
        '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
        600, -- 10 minutes
        '{
            "completeness": true,
            "coherence": true,
            "insight": true
        }'::jsonb
    )
ON CONFLICT (code) DO UPDATE 
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    difficulty_levels = EXCLUDED.difficulty_levels,
    time_limit = EXCLUDED.time_limit,
    evaluation_criteria = EXCLUDED.evaluation_criteria;

-- Requirement: Drill Structure (7. SYSTEM DESIGN/User Interface Design/7.1.3 Critical User Flows)
-- Add comments for documentation
COMMENT ON TABLE drill_types IS 'Core drill types and their configurations for the practice system';
COMMENT ON COLUMN drill_types.id IS 'Unique identifier for each drill type';
COMMENT ON COLUMN drill_types.code IS 'Unique code identifier matching drill_attempts table constraints';
COMMENT ON COLUMN drill_types.name IS 'Display name of the drill type';
COMMENT ON COLUMN drill_types.description IS 'Detailed description of the drill type';
COMMENT ON COLUMN drill_types.difficulty_levels IS 'Available difficulty levels for this drill type';
COMMENT ON COLUMN drill_types.time_limit IS 'Default time limit in seconds for this drill type';
COMMENT ON COLUMN drill_types.evaluation_criteria IS 'Criteria used for AI evaluation of drill attempts';
COMMENT ON COLUMN drill_types.created_at IS 'Timestamp when drill type was created';