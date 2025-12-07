import { NextRequest, NextResponse } from 'next/server'
import { getResolution } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const scenarioId = parseInt(request.nextUrl.searchParams.get('scenarioId') || '', 10)
    if (!scenarioId) {
      return NextResponse.json({ error: 'scenarioId is required' }, { status: 400 })
    }

    const resolution = await getResolution(scenarioId)
    if (!resolution) {
      return NextResponse.json({ error: 'Resolution not found' }, { status: 404 })
    }

    return NextResponse.json(resolution)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
