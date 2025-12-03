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
 * @returns Array of scenarios with similarity scores
 */
export async function searchSimilarScenarios(
  embedding: number[],
  limit: number = 5,
): Promise<Scenario[]> {
  const query = `
        WITH ranked_scenarios AS (
            SELECT 
                s.id,
                s.title,
                s.description,
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
            GROUP BY s.id, s.title, s.description, s.embedding
        )
        SELECT 
            id,
            title,
            description,
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
    const result: QueryResult<Scenario> = await pool.query(query, [
      `[${embedding.join(',')}]`,
      limit,
    ])

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
 */
export async function insertScenario(
  title: string,
  description: string,
  embedding: number[],
): Promise<void> {
  const query = `
        INSERT INTO isp_support.scenarios (title, description, embedding)
        VALUES ($1, $2, $3::vector)
    `

  try {
    await pool.query(query, [title, description, `[${embedding.join(',')}]`])
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
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  await pool.end()
}
