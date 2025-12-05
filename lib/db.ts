import { Pool, QueryResult } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
// Try multiple paths to handle different execution contexts
const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Please check your .env.local file.')
  process.exit(1)
}

// Get database schema name from environment variable (default: isp_support)
export function getSchemaName(): string {
  return process.env.DB_SCHEMA || 'isp_support'
}

// Get default industry from environment variable (default: isp)
export function getDefaultIndustry(): string {
  return process.env.DEFAULT_INDUSTRY || 'isp'
}

// Create connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('connect', () => {
  // Connection established
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export interface Scenario {
  id: number
  title: string
  description: string
  type?:
    | 'scenario'
    | 'work_order'
    | 'equipment'
    | 'outage'
    | 'policy'
    | 'reference'
    | 'subscriber'
  industry?: string
  metadata?: Record<string, any>
  similarity?: number
  helpful_count?: number
  total_feedback?: number
  helpful_percentage?: number
}

export interface Resolution {
  id: number
  scenario_id: number
  steps: string[]
  step_type: 'numbered' | 'bullets'
}

/**
 * Search for similar scenarios using cosine similarity
 * @param embedding - 384-dimensional embedding vector
 * @param limit - Maximum number of results to return (default: 5)
 * @param type - Optional filter by type
 * @returns Array of scenarios with similarity scores
 */
export async function searchSimilarScenarios(
  embedding: number[],
  limit: number = 5,
  type?:
    | 'scenario'
    | 'work_order'
    | 'equipment'
    | 'outage'
    | 'policy'
    | 'reference'
    | 'subscriber',
  industry: string | null = null,
): Promise<Scenario[]> {
  const schema = getSchemaName()
  const defaultIndustry = getDefaultIndustry()
  const industryFilter = industry || defaultIndustry
  const typeFilter = type ? 'AND s.type = $4' : ''
  const params = type
    ? [`[${embedding.join(',')}]`, limit, industryFilter, type, defaultIndustry]
    : [`[${embedding.join(',')}]`, limit, industryFilter, defaultIndustry]

  const query = `
        WITH ranked_scenarios AS (
            SELECT 
                s.id,
                s.title,
                s.description,
                s.type,
                COALESCE(s.industry, $${type ? '5' : '4'}) as industry,
                s.metadata,
                1 - (s.embedding <=> $1::vector) as similarity,
                COALESCE(SUM(CASE WHEN f.rating = 1 THEN 1 ELSE 0 END), 0)::int as helpful_count,
                COALESCE(SUM(CASE WHEN f.rating = -1 THEN 1 ELSE 0 END), 0)::int as not_helpful_count,
                COUNT(f.id)::int as total_feedback,
                CASE 
                    WHEN COUNT(f.id) > 0 THEN 
                        ROUND((SUM(CASE WHEN f.rating = 1 THEN 1 ELSE 0 END)::numeric / COUNT(f.id)::numeric) * 100, 1)
                    ELSE NULL
                END as helpful_percentage,
                ROW_NUMBER() OVER (PARTITION BY s.title ORDER BY s.embedding <=> $1::vector) as rn
                   FROM ${schema}.scenarios s
                   LEFT JOIN ${schema}.feedback f ON s.id = f.scenario_id
                   WHERE s.embedding IS NOT NULL
                   AND (COALESCE(s.industry, $${type ? '5' : '4'}) = $3)
                   ${typeFilter}
                   GROUP BY s.id, s.title, s.description, s.type, s.industry, s.metadata, s.embedding
        )
               SELECT 
                   id,
                   title,
                   description,
                   type,
                   industry,
                   metadata,
                   similarity,
                   helpful_count,
                   not_helpful_count,
                   total_feedback,
                   helpful_percentage
               FROM ranked_scenarios
        WHERE rn = 1
        ORDER BY 
            (similarity * 0.7 + COALESCE(helpful_percentage / 100.0, 0.5) * 0.3) DESC
        LIMIT $2
    `

  try {
    const result: QueryResult<Scenario> = await pool.query(query, params)

    return result.rows
  } catch (error: any) {
    if (error?.code === '42703' || error?.message?.includes('industry')) {
      const fallbackTypeFilter = type ? 'AND s.type = $3' : ''
      const fallbackQuery = `
        WITH ranked_scenarios AS (
            SELECT 
                s.id,
                s.title,
                s.description,
                s.type,
                s.metadata,
                1 - (s.embedding <=> $1::vector) as similarity,
                COALESCE(SUM(CASE WHEN f.rating = 1 THEN 1 ELSE 0 END), 0)::int as helpful_count,
                COALESCE(SUM(CASE WHEN f.rating = -1 THEN 1 ELSE 0 END), 0)::int as not_helpful_count,
                COUNT(f.id)::int as total_feedback,
                CASE 
                    WHEN COUNT(f.id) > 0 THEN 
                        ROUND((SUM(CASE WHEN f.rating = 1 THEN 1 ELSE 0 END)::numeric / COUNT(f.id)::numeric) * 100, 1)
                    ELSE NULL
                END as helpful_percentage,
                ROW_NUMBER() OVER (PARTITION BY s.title ORDER BY s.embedding <=> $1::vector) as rn
                   FROM ${schema}.scenarios s
                   LEFT JOIN ${schema}.feedback f ON s.id = f.scenario_id
                   WHERE s.embedding IS NOT NULL
                   ${fallbackTypeFilter}
                   GROUP BY s.id, s.title, s.description, s.type, s.metadata, s.embedding
        )
               SELECT 
                   id,
                   title,
                   description,
                   type,
                   metadata,
                   similarity,
                   helpful_count,
                   not_helpful_count,
                   total_feedback,
                   helpful_percentage
               FROM ranked_scenarios
        WHERE rn = 1
        ORDER BY 
            (similarity * 0.7 + COALESCE(helpful_percentage / 100.0, 0.5) * 0.3) DESC
        LIMIT $2
      `
      const fallbackParams = type
        ? [`[${embedding.join(',')}]`, limit, type]
        : [`[${embedding.join(',')}]`, limit]
      const result: QueryResult<Scenario> = await pool.query(
        fallbackQuery,
        fallbackParams,
      )
      return result.rows.map((row) => ({ ...row, industry: defaultIndustry }))
    }
    console.error('Error searching similar scenarios:', error)
    throw error
  }
}

/**
 * Insert a scenario with its embedding
 * @param title - Scenario title
 * @param description - Scenario description
 * @param embedding - 384-dimensional embedding vector
 * @param type - Type of entry (default: 'scenario')
 * @param metadata - Optional metadata (JSON object)
 */
export async function insertScenario(
  title: string,
  description: string,
  embedding: number[],
  type:
    | 'scenario'
    | 'work_order'
    | 'equipment'
    | 'outage'
    | 'policy'
    | 'reference'
    | 'subscriber' = 'scenario',
  metadata: Record<string, any> = {},
  industry: string | null = null,
): Promise<void> {
  const defaultIndustry = industry || getDefaultIndustry()
  const schema = getSchemaName()
  const query = `
              INSERT INTO ${schema}.scenarios (title, description, embedding, type, industry, metadata)
              VALUES ($1, $2, $3::vector, $4, $5, $6::jsonb)
          `

  try {
    await pool.query(query, [
      title,
      description,
      `[${embedding.join(',')}]`,
      type,
      defaultIndustry,
      JSON.stringify(metadata),
    ])
  } catch (error) {
    console.error('Error inserting scenario:', error)
    throw error
  }
}

/**
 * Record user feedback for a scenario
 * @param query - The user's search query
 * @param scenarioId - The ID of the scenario that was rated
 * @param rating - 1 for thumbs up, -1 for thumbs down
 */
export async function recordFeedback(
  query: string,
  scenarioId: number,
  rating: number,
): Promise<void> {
  const schema = getSchemaName()
  const feedbackQuery = `
    INSERT INTO ${schema}.feedback (query, scenario_id, rating)
    VALUES ($1, $2, $3)
  `

  try {
    await pool.query(feedbackQuery, [query, scenarioId, rating])
  } catch (error) {
    console.error('Error recording feedback:', error)
    // Don't throw - feedback is non-critical, don't break the app
  }
}

/**
 * Get resolution steps for a scenario
 * @param scenarioId - The ID of the scenario
 * @returns Resolution object with steps, or null if not found
 */
export async function getResolution(
  scenarioId: number,
): Promise<Resolution | null> {
  const schema = getSchemaName()
  const query = `
    SELECT id, scenario_id, steps, step_type
    FROM ${schema}.resolutions
    WHERE scenario_id = $1
  `

  try {
    const result = await pool.query(query, [scenarioId])
    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    // Parse steps from JSON string or array
    let steps: string[]
    if (typeof row.steps === 'string') {
      try {
        steps = JSON.parse(row.steps)
      } catch {
        // If not JSON, treat as newline-separated
        steps = row.steps.split('\n').filter((s: string) => s.trim())
      }
    } else if (Array.isArray(row.steps)) {
      steps = row.steps
    } else {
      steps = []
    }

    return {
      id: row.id,
      scenario_id: row.scenario_id,
      steps,
      step_type: row.step_type,
    }
  } catch (error) {
    console.error('Error fetching resolution:', error)
    throw error
  }
}

/**
 * Insert a resolution with step-by-step instructions
 * @param scenarioId - The ID of the scenario
 * @param steps - Array of step strings
 * @param stepType - 'numbered' or 'bullets'
 */
export async function insertResolution(
  scenarioId: number,
  steps: string[],
  stepType: 'numbered' | 'bullets',
): Promise<void> {
  const schema = getSchemaName()
  const query = `
    INSERT INTO ${schema}.resolutions (scenario_id, steps, step_type)
    VALUES ($1, $2::jsonb, $3)
    ON CONFLICT (scenario_id) DO UPDATE
    SET steps = $2::jsonb, step_type = $3
  `

  try {
    await pool.query(query, [scenarioId, JSON.stringify(steps), stepType])
  } catch (error) {
    console.error('Error inserting resolution:', error)
    throw error
  }
}

/**
 * Get work order by name
 * @param name - The name of the work order
 * @returns Scenario object with work order data, or null if not found
 */
export async function getWorkOrderByName(
  name: string,
): Promise<Scenario | null> {
  const schema = getSchemaName()
  const query = `
    SELECT id, title, description, type, metadata
    FROM ${schema}.scenarios
    WHERE type = 'work_order' AND LOWER(TRIM(title)) = LOWER(TRIM($1))
    LIMIT 1
  `

  try {
    const result = await pool.query(query, [name])
    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error('Error fetching work order:', error)
    throw error
  }
}

export async function getScenarioByTitle(
  title: string,
): Promise<Scenario | null> {
  const schema = getSchemaName()
  const query = `
    SELECT id, title, description, type, metadata
    FROM ${schema}.scenarios
    WHERE type = 'scenario' AND LOWER(TRIM(title)) = LOWER(TRIM($1))
    LIMIT 1
  `

  try {
    const result = await pool.query(query, [title])
    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error('Error fetching scenario by title:', error)
    throw error
  }
}

/**
 * Get all work order names for matching
 * @returns Array of work order names
 */
export async function getAllWorkOrderNames(): Promise<string[]> {
  const schema = getSchemaName()
  const query = `
    SELECT title
    FROM ${schema}.scenarios
    WHERE type = 'work_order'
    ORDER BY title
  `

  try {
    const result = await pool.query(query)
    return result.rows.map((row: { title: string }) => row.title)
  } catch (error) {
    console.error('Error fetching work order names:', error)
    throw error
  }
}

/**
 * Get knowledge base item by name and type
 * @param name - The name/title of the item
 * @param type - The type of knowledge base item
 * @returns Scenario object, or null if not found
 */
export async function getKnowledgeBaseItemByName(
  name: string,
  type: 'equipment' | 'outage' | 'policy' | 'reference' | 'subscriber',
): Promise<Scenario | null> {
  const schema = getSchemaName()
  const query = `
    SELECT id, title, description, type, metadata
    FROM ${schema}.scenarios
    WHERE type = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2))
    LIMIT 1
  `

  try {
    const result = await pool.query(query, [type, name])
    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error(`Error fetching ${type}:`, error)
    throw error
  }
}

/**
 * Get all names for a specific knowledge base type
 * @param type - The type of knowledge base item
 * @returns Array of names
 */
export async function getAllKnowledgeBaseNames(
  type: 'equipment' | 'outage' | 'policy' | 'reference' | 'subscriber',
): Promise<string[]> {
  const schema = getSchemaName()
  const query = `
    SELECT title
    FROM ${schema}.scenarios
    WHERE type = $1
    ORDER BY title
  `

  try {
    const result = await pool.query(query, [type])
    return result.rows.map((row: { title: string }) => row.title)
  } catch (error) {
    console.error(`Error fetching ${type} names:`, error)
    throw error
  }
}

export interface TopSearch {
  query: string
  count: number
  itemType?: string
  isKnowledgeBase?: boolean
}

export async function getTopKnowledgeBaseItems(
  limit: number = 10,
  days: number | null = 30,
): Promise<TopSearch[]> {
  const schema = getSchemaName()
  const actionDateFilter = days
    ? `AND created_at >= NOW() - INTERVAL '${days} days'`
    : ''

  const actionQuery = `
    SELECT 
      LOWER(TRIM(item_name)) as query,
      COUNT(*)::int as count,
      item_type as item_type,
      true as is_knowledge_base
    FROM ${schema}.actions
    WHERE action_type IN ('view_knowledge_base', 'click_schedule_work_order', 'click_update_subscriber')
      AND item_name IS NOT NULL
      ${actionDateFilter}
    GROUP BY LOWER(TRIM(item_name)), item_type
    ORDER BY count DESC, query ASC
    LIMIT $1
  `

  try {
    try {
      const result = await pool.query(actionQuery, [limit])
      if (result.rows.length > 0) {
        return result.rows.map(
          (row: {
            query: string
            count: number
            item_type: string | null
            is_knowledge_base: boolean
          }) => ({
            query: row.query,
            count: row.count,
            itemType: row.item_type || undefined,
            isKnowledgeBase: true,
          }),
        )
      }
    } catch (error: any) {
      if (error?.code === '42P01') {
        // Table doesn't exist, fall through to fallback
      } else {
        throw error
      }
    }

    const fallbackQuery = `
      SELECT 
        LOWER(TRIM(title)) as query,
        0 as count,
        type as item_type,
        true as is_knowledge_base
      FROM ${schema}.scenarios
      WHERE type IN ('equipment', 'outage', 'policy', 'reference', 'subscriber', 'work_order')
      GROUP BY LOWER(TRIM(title)), type
      ORDER BY query ASC
      LIMIT $1
    `
    const fallbackResult = await pool.query(fallbackQuery, [limit])
    return fallbackResult.rows.map(
      (row: {
        query: string
        count: number
        item_type: string | null
        is_knowledge_base: boolean
      }) => ({
        query: row.query,
        count: row.count,
        itemType: row.item_type || undefined,
        isKnowledgeBase: true,
      }),
    )
  } catch (error) {
    console.error('Error fetching top knowledge base items:', error)
    throw error
  }
}

export interface HelpfulSearch {
  query: string
  helpfulCount: number
  notHelpfulCount: number
  totalFeedback: number
  helpfulPercentage: number
}

export async function getHelpfulSearches(
  limit: number = 10,
  days: number | null = 30,
): Promise<HelpfulSearch[]> {
  const schema = getSchemaName()
  const params: any[] = [limit]
  const dateFilter = days
    ? `AND f.created_at >= NOW() - INTERVAL '${days} days'`
    : ''

  const query = `
    WITH ScenarioFeedback AS (
      SELECT
        s.id AS scenario_id,
        s.title,
        s.description,
        COUNT(*) FILTER (WHERE f.rating = 1)::int as helpful_count,
        COUNT(*) FILTER (WHERE f.rating = -1)::int as not_helpful_count,
        COUNT(f.id)::int as total_feedback,
        ROUND(
          ((COUNT(*) FILTER (WHERE f.rating = 1)::numeric / NULLIF(COUNT(f.id), 0)) * 100)::numeric,
          1
        ) as helpful_percentage
      FROM ${schema}.scenarios s
      JOIN ${schema}.feedback f ON s.id = f.scenario_id
      WHERE s.type = 'scenario'
        ${dateFilter}
      GROUP BY s.id, s.title, s.description
      HAVING COUNT(f.id) >= 2
    )
    SELECT
      title as query,
      helpful_count,
      not_helpful_count,
      total_feedback,
      helpful_percentage
    FROM ScenarioFeedback
    ORDER BY helpful_count DESC, helpful_percentage DESC, total_feedback DESC
    LIMIT $1
  `

  try {
    const result = await pool.query(query, params)
    return result.rows.map((row) => ({
      query: row.query,
      helpfulCount: row.helpful_count || 0,
      notHelpfulCount: row.not_helpful_count || 0,
      totalFeedback: row.total_feedback || 0,
      helpfulPercentage: parseFloat(row.helpful_percentage || '0'),
    }))
  } catch (error) {
    console.error('Error fetching helpful searches:', error)
    throw error
  }
}

export async function logAction(
  actionType: string,
  itemName?: string,
  itemType?: string,
  scenarioId?: number,
): Promise<void> {
  const schema = getSchemaName()
  const logQuery = `
    INSERT INTO ${schema}.actions (action_type, item_name, item_type, scenario_id)
    VALUES ($1, $2, $3, $4)
  `

  pool
    .query(logQuery, [
      actionType,
      itemName || null,
      itemType || null,
      scenarioId || null,
    ])
    .catch(() => {})
}

export interface TopAction {
  actionType: string
  count: number
}

export async function getTopActions(
  limit: number = 10,
  days: number | null = 30,
): Promise<TopAction[]> {
  const schema = getSchemaName()
  try {
    let query = `
      SELECT 
        action_type as "actionType",
        COUNT(*) as count
      FROM ${schema}.actions
      WHERE action_type LIKE 'execute_%'
    `

    const params: any[] = []
    if (days !== null) {
      query += ` AND created_at >= NOW() - INTERVAL '${days} days'`
    }

    query += `
      GROUP BY action_type
      ORDER BY count DESC
      LIMIT $1
    `
    params.push(limit)

    const result = await pool.query(query, params)
    return result.rows.map((row) => ({
      actionType: row.actionType.replace('execute_', ''),
      count: parseInt(row.count, 10),
    }))
  } catch (error) {
    console.error('Error fetching top actions:', error)
    throw error
  }
}

export async function closePool(): Promise<void> {
  await pool.end()
}
