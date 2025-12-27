-- Complete database migration for all knowledge base types
-- This migration is idempotent and can be run multiple times safely

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create dedicated schema (schema name is replaced by migration runner from DB_SCHEMA env var)
CREATE SCHEMA IF NOT EXISTS {{SCHEMA_NAME}};

-- Create scenarios table in dedicated schema
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.scenarios (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    embedding vector(384),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on embedding column for efficient similarity search
CREATE INDEX IF NOT EXISTS scenarios_embedding_idx ON {{SCHEMA_NAME}}.scenarios 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create feedback table to track user ratings
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.feedback (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    scenario_id INTEGER NOT NULL REFERENCES {{SCHEMA_NAME}}.scenarios(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS feedback_scenario_id_idx ON {{SCHEMA_NAME}}.feedback(scenario_id);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON {{SCHEMA_NAME}}.feedback(created_at);

-- Create resolutions table for step-by-step instructions
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.resolutions (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER NOT NULL UNIQUE REFERENCES {{SCHEMA_NAME}}.scenarios(id) ON DELETE CASCADE,
    steps TEXT NOT NULL,
    step_type VARCHAR(20) NOT NULL CHECK (step_type IN ('numbered', 'bullets')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for lookups
CREATE INDEX IF NOT EXISTS resolutions_scenario_id_idx ON {{SCHEMA_NAME}}.resolutions(scenario_id);

-- Add type column to scenarios table (if not exists)
ALTER TABLE {{SCHEMA_NAME}}.scenarios 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'scenario';

-- Add metadata column for knowledge base specific fields (if not exists)
ALTER TABLE {{SCHEMA_NAME}}.scenarios 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Drop existing constraint if it exists
ALTER TABLE {{SCHEMA_NAME}}.scenarios 
DROP CONSTRAINT IF EXISTS scenarios_type_check;

-- Add constraint with all knowledge base types
ALTER TABLE {{SCHEMA_NAME}}.scenarios 
ADD CONSTRAINT scenarios_type_check 
CHECK (type IN ('scenario', 'work_order', 'equipment', 'outage', 'policy', 'reference', 'subscriber'));

-- Create index on type for filtering (if not exists)
CREATE INDEX IF NOT EXISTS scenarios_type_idx ON {{SCHEMA_NAME}}.scenarios(type);

-- Create index on metadata for queries (if not exists)
CREATE INDEX IF NOT EXISTS scenarios_metadata_idx ON {{SCHEMA_NAME}}.scenarios USING GIN(metadata);

-- Create actions table to track user interactions
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.actions (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    item_name VARCHAR(255),
    item_type VARCHAR(50),
    scenario_id INTEGER REFERENCES {{SCHEMA_NAME}}.scenarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS actions_action_type_idx ON {{SCHEMA_NAME}}.actions(action_type);
CREATE INDEX IF NOT EXISTS actions_item_type_idx ON {{SCHEMA_NAME}}.actions(item_type);
CREATE INDEX IF NOT EXISTS actions_created_at_idx ON {{SCHEMA_NAME}}.actions(created_at);
CREATE INDEX IF NOT EXISTS actions_scenario_id_idx ON {{SCHEMA_NAME}}.actions(scenario_id);
