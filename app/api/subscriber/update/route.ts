import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Mock POST to subscriber update tool:', body)

    // Simulate a successful update response
    const confirmationNumber = `SUB-${Date.now()}-${Math.floor(
      Math.random() * 1000,
    )}`

    return NextResponse.json({
      message: 'Subscriber data updated successfully (mock)',
      confirmationNumber,
      ...body,
    })
  } catch (error) {
    console.error('Error updating subscriber data:', error)
    return NextResponse.json(
      { error: 'Failed to update subscriber data' },
      { status: 500 },
    )
  }
}
