import { NextRequest, NextResponse } from 'next/server'
import { getResolution, closePool } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const scenarioId = searchParams.get('scenarioId')

    if (!scenarioId) {
      return NextResponse.json(
        { error: 'scenarioId is required' },
        { status: 400 },
      )
    }

    const id = parseInt(scenarioId, 10)
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'Invalid scenario ID' },
        { status: 400 },
      )
    }

    const resolution = await getResolution(id)

    if (!resolution) {
      return NextResponse.json(
        { error: 'Resolution not found' },
        { status: 404 },
      )
    }

    return NextResponse.json(resolution)
  } catch (error) {
    console.error('Error in resolution API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  } finally {
    await closePool()
  }
}
