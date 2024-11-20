-- HUMAN TASKS:
-- 1. Ensure PostgreSQL version 12 or higher is installed
-- 2. Install required PostgreSQL extensions: uuid-ossp, pgcrypto, pg_stat_statements
-- 3. Verify database user has necessary privileges to create extensions and tables
-- 4. Configure appropriate backup strategy for production deployment
-- 5. Set up monitoring for pg_stat_statements metrics

-- Requirement: User Management - Database schema for profile customization and secure storage
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Requirement: User Management - Core user table with secure profile storage
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'FREE_USER' 
        CHECK (role IN ('ANONYMOUS', 'FREE_USER', 'PAID_USER', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED')),
    profile JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requirement: User Management - Efficient querying support
CREATE INDEX users_email_idx ON users USING btree (email);
CREATE INDEX users_role_idx ON users USING btree (role);
CREATE INDEX users_status_idx ON users USING btree (status);

-- Requirement: Subscription System - Tables for subscription management with Stripe integration
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'FREE' 
        CHECK (tier IN ('FREE', 'BASIC', 'PREMIUM')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    next_billing_date TIMESTAMPTZ
);

-- Requirement: Subscription System - Subscription query optimization
CREATE INDEX subscriptions_user_id_idx ON subscriptions USING btree (user_id);
CREATE INDEX subscriptions_stripe_customer_idx ON subscriptions USING btree (stripe_customer_id);
CREATE INDEX subscriptions_tier_idx ON subscriptions USING btree (tier);

-- Requirement: Practice Drills - Schema for storing drill templates with comprehensive evaluation criteria
CREATE TABLE drill_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL 
        CHECK (type IN ('CASE_PROMPT', 'CALCULATIONS', 'CASE_MATH', 'BRAINSTORMING', 'MARKET_SIZING', 'SYNTHESIZING')),
    difficulty TEXT NOT NULL 
        CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    time_limit INTEGER NOT NULL CHECK (time_limit > 0),
    evaluation_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    template_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Requirement: Practice Drills - Efficient template querying
CREATE INDEX drill_templates_type_difficulty_idx ON drill_templates USING btree (type, difficulty);
CREATE INDEX drill_templates_title_idx ON drill_templates USING btree (title);

-- Requirement: Practice Drills - Schema for storing drill attempts and evaluations
CREATE TABLE drill_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drill_id UUID NOT NULL REFERENCES drill_templates(id),
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' 
        CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'EVALUATED', 'ABANDONED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    response JSONB DEFAULT '{}'::jsonb,
    score DECIMAL CHECK (score >= 0 AND score <= 100),
    criteria_scores JSONB DEFAULT '{}'::jsonb,
    feedback TEXT
);

-- Requirement: Practice Drills - Performance analytics optimization
CREATE INDEX drill_attempts_user_id_idx ON drill_attempts USING btree (user_id);
CREATE INDEX drill_attempts_drill_id_idx ON drill_attempts USING btree (drill_id);
CREATE INDEX drill_attempts_status_idx ON drill_attempts USING btree (status);
CREATE INDEX drill_attempts_started_at_idx ON drill_attempts USING btree (started_at);

-- Requirement: User Management - Last login tracking
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS trigger AS $$
BEGIN
    NEW.last_login_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_last_login_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_last_login();