import { NextRequest, NextResponse } from 'next/server'

interface ScheduleRequest {
  workOrderName: string
  customerName: string
  customerPhone: string
  customerAddress: string
  notes?: string
  scheduledDate?: string
  scheduledTime?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleRequest = await request.json()

    // Validate required fields
    if (!body.workOrderName || !body.customerName || !body.customerPhone || !body.customerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Mock POST to external scheduling tool
    // In a real implementation, this would make an actual API call
    const mockSchedulingToolRequest = {
      workOrderType: body.workOrderName,
      customer: {
        name: body.customerName,
        phone: body.customerPhone,
        address: body.customerAddress,
      },
      notes: body.notes || '',
      scheduledDate: body.scheduledDate,
      scheduledTime: body.scheduledTime,
    }

    // Log the mock request (simulating POST to external tool)
    console.log('Mock POST to scheduling tool:', JSON.stringify(mockSchedulingToolRequest, null, 2))

    // Generate mock confirmation number
    const confirmationNumber = `WO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Return success response with scheduled work order details
    return NextResponse.json({
      workOrderName: body.workOrderName,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      notes: body.notes || '',
      scheduledDate: body.scheduledDate,
      scheduledTime: body.scheduledTime,
      confirmationNumber,
    })
  } catch (error) {
    console.error('Error scheduling work order:', error)
    return NextResponse.json(
      { error: 'Failed to schedule work order' },
      { status: 500 },
    )
  }
}
