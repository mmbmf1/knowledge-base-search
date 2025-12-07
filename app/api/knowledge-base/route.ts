import { NextRequest, NextResponse } from 'next/server'
import {
  getKnowledgeBaseItemByName,
  getAllKnowledgeBaseNames,
} from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name')
    const type = searchParams.get('type') as 'equipment' | 'outage' | 'policy' | 'reference' | 'subscriber' | null

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 })
    }

    if (name) {
      const item = await getKnowledgeBaseItemByName(name, type)
      if (!item) {
        return NextResponse.json({ error: `${type} not found` }, { status: 404 })
      }
      return NextResponse.json(item)
    }

    const names = await getAllKnowledgeBaseNames(type)
    return NextResponse.json({ names })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
