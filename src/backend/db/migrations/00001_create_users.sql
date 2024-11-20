-- Human Tasks:
-- 1. Ensure PostgreSQL version 12 or higher is installed
-- 2. Verify that database superuser has permission to create extensions
-- 3. Backup any existing database before running migration
-- 4. Review and adjust any environment-specific settings (e.g., tablespace)

-- Requirement: Data Storage Schema (7. SYSTEM DESIGN/7.2 Database Design/7.2.1 Schema Design)
-- Enable UUID generation capability
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core users table for the Case Interview Practice Platform
-- Requirement: User Management (3. SCOPE/Core Features/User Management)
CREATE TABLE users (
    -- Unique identifier for each user, generated using UUID v4 for global uniqueness and security
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User's email address used for authentication, communication, and account recovery
    -- Must be unique across the system
    email TEXT NOT NULL UNIQUE,
    
    -- Securely hashed user password using industry-standard hashing algorithm
    -- Raw passwords are never stored
    password_hash TEXT NOT NULL,
    
    -- Flexible JSON storage for user profile information including preferences, settings, and customization options
    profile_data JSONB DEFAULT '{}'::jsonb,
    
    -- UTC timestamp of user account creation for audit and tracking purposes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    
    -- UTC timestamp of last user record update for change tracking and audit purposes
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index to optimize login lookups and email uniqueness checks
-- Improves authentication performance
CREATE INDEX users_email_idx ON users USING btree (email);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at timestamp when record is modified
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Add table comments for documentation
COMMENT ON TABLE users IS 'Core users table for the Case Interview Practice Platform';
COMMENT ON COLUMN users.id IS 'Unique identifier for each user, generated using UUID v4 for global uniqueness and security';
COMMENT ON COLUMN users.email IS 'User''s email address used for authentication, communication, and account recovery. Must be unique across the system';
COMMENT ON COLUMN users.password_hash IS 'Securely hashed user password using industry-standard hashing algorithm. Raw passwords are never stored';
COMMENT ON COLUMN users.profile_data IS 'Flexible JSON storage for user profile information including preferences, settings, and customization options';
COMMENT ON COLUMN users.created_at IS 'UTC timestamp of user account creation for audit and tracking purposes';
COMMENT ON COLUMN users.updated_at IS 'UTC timestamp of last user record update for change tracking and audit purposes';