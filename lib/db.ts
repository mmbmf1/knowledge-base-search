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
  type?: 'scenario' | 'work_order' | 'equipment' | 'outage' | 'policy' | 'reference' | 'subscriber'
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
  type?: 'scenario' | 'work_order' | 'equipment' | 'outage' | 'policy' | 'reference' | 'subscriber',
): Promise<Scenario[]> {
  const typeFilter = type ? 'AND s.type = $3' : ''
  const params = type
    ? [`[${embedding.join(',')}]`, limit, type]
    : [`[${embedding.join(',')}]`, limit]

  const query = `
        WITH ranked_scenarios AS (
            SELECT 
                s.id,
                s.title,
                s.description,
                s.type,
                s.metadata,
                1 - (s.embedding <=> $1::vector) as similarity,
                COALESCE(SUM(CASE WHEN f.rating = 1 THEN 1 ELSE 0 END), 0)::int as helpful_count,
                COUNT(f.id)::int as total_feedback,
                CASE 
                    WHEN COUNT(f.id) > 0 THEN 
                        ROUND((SUM(CASE WHEN f.rating = 1 THEN 1 ELSE 0 END)::numeric / COUNT(f.id)::numeric) * 100, 1)
                    ELSE NULL
                END as helpful_percentage,
                ROW_NUMBER() OVER (PARTITION BY s.title ORDER BY s.embedding <=> $1::vector) as rn
            FROM isp_support.scenarios s
            LEFT JOIN isp_support.feedback f ON s.id = f.scenario_id
            WHERE s.embedding IS NOT NULL
            ${typeFilter}
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
  } catch (error) {
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
  type: 'scenario' | 'work_order' | 'equipment' | 'outage' | 'policy' | 'reference' | 'subscriber' = 'scenario',
  metadata: Record<string, any> = {},
): Promise<void> {
  const query = `
        INSERT INTO isp_support.scenarios (title, description, embedding, type, metadata)
        VALUES ($1, $2, $3::vector, $4, $5::jsonb)
    `

  try {
    await pool.query(query, [
      title,
      description,
      `[${embedding.join(',')}]`,
      type,
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
  const feedbackQuery = `
    INSERT INTO isp_support.feedback (query, scenario_id, rating)
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
  const query = `
    SELECT id, scenario_id, steps, step_type
    FROM isp_support.resolutions
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
  const query = `
    INSERT INTO isp_support.resolutions (scenario_id, steps, step_type)
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
  const query = `
    SELECT id, title, description, type, metadata
    FROM isp_support.scenarios
    WHERE type = 'work_order' AND title = $1
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

/**
 * Get all work order names for matching
 * @returns Array of work order names
 */
export async function getAllWorkOrderNames(): Promise<string[]> {
  const query = `
    SELECT title
    FROM isp_support.scenarios
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
  const query = `
    SELECT id, title, description, type, metadata
    FROM isp_support.scenarios
    WHERE type = $1 AND title = $2
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
  const query = `
    SELECT title
    FROM isp_support.scenarios
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

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  await pool.end()
}
