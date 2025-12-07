import { NextRequest, NextResponse } from 'next/server'
import { getWorkOrderByName, getAllWorkOrderNames } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get('name')
    if (name) {
      const workOrder = await getWorkOrderByName(name)
      if (!workOrder) {
        return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
      }
      return NextResponse.json(workOrder)
    }
    const names = await getAllWorkOrderNames()
    return NextResponse.json({ names })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
