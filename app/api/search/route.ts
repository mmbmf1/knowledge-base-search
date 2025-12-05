import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/embeddings'
import { searchSimilarScenarios } from '@/lib/db'
import { getIndustryConfig } from '@/lib/industry-config'

export async function POST(request: NextRequest) {
  try {
    const { query, type } = await request.json()

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const trimmedQuery = query.trim()

    const industryConfig = getIndustryConfig()
    const queryEmbedding = await generateEmbedding(trimmedQuery)
    const results = await searchSimilarScenarios(
      queryEmbedding,
      5,
      (type || 'scenario') as 'scenario' | 'work_order',
      industryConfig.industry,
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    )
  }
}
