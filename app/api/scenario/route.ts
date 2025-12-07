import { NextRequest, NextResponse } from 'next/server'
import { getScenarioByTitle } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const title = request.nextUrl.searchParams.get('title')
    if (!title) {
      return NextResponse.json({ error: 'title parameter is required' }, { status: 400 })
    }

    const scenario = await getScenarioByTitle(title)
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    return NextResponse.json(scenario)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
