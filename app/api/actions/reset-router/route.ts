import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { equipmentId, equipmentName } = await request.json()
    
    if (!equipmentId && !equipmentName) {
      return NextResponse.json({ error: 'Equipment ID or name required' }, { status: 400 })
    }

    // Mock router reset - in real implementation, this would call actual equipment API
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return NextResponse.json({
      success: true,
      message: `Router ${equipmentName || equipmentId} reset successfully`,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to reset router' },
      { status: 500 },
    )
  }
}
