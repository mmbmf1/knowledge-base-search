import { NextRequest, NextResponse } from 'next/server'
import { getHelpfulSearches } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const days = searchParams.get('days')
      ? parseInt(searchParams.get('days')!, 10)
      : 30
    const helpfulSearches = await getHelpfulSearches(limit, days)
    return NextResponse.json({ helpfulSearches })
  } catch (error) {
    console.error('Error in helpful-searches route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
