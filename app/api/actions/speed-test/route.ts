import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { subscriberId, subscriberName } = await request.json()
    
    if (!subscriberId && !subscriberName) {
      return NextResponse.json({ error: 'Subscriber ID or name required' }, { status: 400 })
    }

    // Mock speed test - in real implementation, this would trigger actual speed test
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate mock speed test results
    const downloadSpeed = Math.floor(Math.random() * 500) + 100
    const uploadSpeed = Math.floor(Math.random() * 100) + 20
    const latency = Math.floor(Math.random() * 30) + 10

    return NextResponse.json({
      success: true,
      message: `Speed test completed: ${downloadSpeed} Mbps down, ${uploadSpeed} Mbps up, ${latency} ms latency`,
      results: {
        downloadSpeed: `${downloadSpeed} Mbps`,
        uploadSpeed: `${uploadSpeed} Mbps`,
        latency: `${latency} ms`,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to run speed test' },
      { status: 500 },
    )
  }
}
