import { NextRequest, NextResponse } from 'next/server'
import { recordFeedback, closePool } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, scenarioId, rating } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    if (
      !scenarioId ||
      typeof scenarioId !== 'number' ||
      !Number.isInteger(scenarioId)
    ) {
      return NextResponse.json(
        { error: 'Invalid scenario ID' },
        { status: 400 },
      )
    }

    if (rating !== 1 && rating !== -1) {
      return NextResponse.json(
        { error: 'Rating must be 1 or -1' },
        { status: 400 },
      )
    }

    await recordFeedback(query.trim(), scenarioId, rating)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in feedback API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  } finally {
    await closePool()
  }
}
