-- Drop industry column from scenarios table
-- This migration removes the industry column and its index

-- Drop the industry index if it exists
DROP INDEX IF EXISTS {{SCHEMA_NAME}}.scenarios_industry_idx;

-- Drop the industry column
ALTER TABLE {{SCHEMA_NAME}}.scenarios 
DROP COLUMN IF EXISTS industry;
