-- Migration to add new knowledge base types: equipment, outage, policy, reference
-- Run this against your database to update the type constraint

-- Drop existing constraint
ALTER TABLE isp_support.scenarios 
DROP CONSTRAINT IF EXISTS scenarios_type_check;

-- Add new constraint with all types
ALTER TABLE isp_support.scenarios 
ADD CONSTRAINT scenarios_type_check 
CHECK (type IN ('scenario', 'work_order', 'equipment', 'outage', 'policy', 'reference'));
