import { NextRequest, NextResponse } from 'next/server'
import { recordFeedback } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { query, scenarioId, rating } = await request.json()

    if (!query?.trim() || typeof scenarioId !== 'number' || ![-1, 1].includes(rating)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    await recordFeedback(query.trim(), scenarioId, rating)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
