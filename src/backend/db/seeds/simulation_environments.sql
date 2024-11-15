-- Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
-- Requirement: Simulation Engine - Handles ecosystem game logic and simulation state

-- Insert predefined simulation environments with varying difficulty levels
INSERT INTO simulation_environments 
(id, name, description, temperature, depth, salinity, light_level, difficulty, created_at)
VALUES
-- Beginner level: Shallow Reef environment
-- Warm temperature, low depth, moderate salinity, high light for easier ecosystem management
(
    gen_random_uuid(),
    'Shallow Reef',
    'A beginner-friendly coral reef environment characterized by warm waters, abundant sunlight, and moderate conditions. Perfect for learning basic ecosystem management principles.',
    25.5,  -- temperature (°C)
    15.0,  -- depth (meters)
    35.0,  -- salinity (PSU)
    90.0,  -- light_level (%)
    'beginner',
    CURRENT_TIMESTAMP
),

-- Intermediate level: Deep Ocean environment
-- Cold temperature, high depth, high salinity, low light introducing more complexity
(
    gen_random_uuid(),
    'Deep Ocean',
    'An intermediate challenge featuring a deep ocean environment where limited light and cold temperatures create unique ecosystem dynamics. Tests adaptation strategies and resource management.',
    4.0,   -- temperature (°C)
    800.0, -- depth (meters)
    35.5,  -- salinity (PSU)
    10.0,  -- light_level (%)
    'intermediate',
    CURRENT_TIMESTAMP
),

-- Advanced level: Coastal Waters environment
-- Variable conditions requiring more sophisticated management
(
    gen_random_uuid(),
    'Coastal Waters',
    'An advanced scenario simulating dynamic coastal waters with fluctuating conditions. Challenges players to maintain ecosystem stability amid changing environmental parameters.',
    18.0,  -- temperature (°C)
    45.0,  -- depth (meters)
    32.0,  -- salinity (PSU)
    65.0,  -- light_level (%)
    'advanced',
    CURRENT_TIMESTAMP
),

-- Expert level: Hydrothermal Vent environment
-- Extreme conditions requiring expert-level ecosystem management
(
    gen_random_uuid(),
    'Hydrothermal Vent',
    'An expert-level challenge simulating extreme conditions near hydrothermal vents. Tests mastery of ecosystem management in harsh environments with unique species adaptations.',
    85.0,  -- temperature (°C)
    2500.0, -- depth (meters)
    38.0,   -- salinity (PSU)
    0.0,    -- light_level (%)
    'expert',
    CURRENT_TIMESTAMP
),

-- Advanced level: Seasonal Transition environment
-- Dynamic environment with changing conditions
(
    gen_random_uuid(),
    'Seasonal Transition',
    'An advanced scenario that simulates seasonal changes in a marine environment. Requires strategic planning and adaptation to cyclical environmental variations.',
    15.0,  -- temperature (°C)
    100.0, -- depth (meters)
    34.0,  -- salinity (PSU)
    75.0,  -- light_level (%)
    'advanced',
    CURRENT_TIMESTAMP
),

-- Expert level: Polar Marine environment
-- Challenging cold-water ecosystem
(
    gen_random_uuid(),
    'Polar Marine',
    'An expert-level polar marine environment featuring extreme cold and seasonal light variations. Tests advanced ecosystem management skills in harsh conditions.',
    -2.0,  -- temperature (°C)
    200.0, -- depth (meters)
    34.5,  -- salinity (PSU)
    40.0,  -- light_level (%)
    'expert',
    CURRENT_TIMESTAMP
);