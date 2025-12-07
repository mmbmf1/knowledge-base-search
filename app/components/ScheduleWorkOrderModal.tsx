'use client'

import { useState } from 'react'
import { XMarkIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface ScheduleWorkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  workOrder: {
    id: number
    title: string
    description: string
    metadata?: Record<string, any>
  }
}

interface TimeSlot {
  date: string
  timeWindow: string
  startTime: string
  endTime: string
}

interface ScheduledWorkOrder {
  workOrderName: string
  customerName: string
  customerPhone: string
  customerAddress: string
  notes: string
  scheduledDate?: string
  scheduledTime?: string
  confirmationNumber: string
}

export default function ScheduleWorkOrderModal({
  isOpen,
  onClose,
  workOrder,
}: ScheduleWorkOrderModalProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scheduledWorkOrder, setScheduledWorkOrder] =
    useState<ScheduledWorkOrder | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requiresTruck = workOrder.metadata?.no_truck === false

  // Generate mock available time slots for next 7 days
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const today = new Date()
    const timeWindows = [
      { start: '09:00', end: '12:00', label: '9am-12pm' },
      { start: '13:00', end: '16:00', label: '1pm-4pm' },
      { start: '17:00', end: '20:00', label: '5pm-8pm' },
    ]

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })

      timeWindows.forEach((window) => {
        slots.push({
          date: dateStr,
          timeWindow: `${formattedDate} ${window.label}`,
          startTime: window.start,
          endTime: window.end,
        })
      })
    }

    return slots
  }

  const timeSlots = requiresTruck ? generateTimeSlots() : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!customerName.trim()) {
      setError('Customer name is required')
      return
    }
    if (!customerPhone.trim()) {
      setError('Customer phone is required')
      return
    }
    if (!customerAddress.trim()) {
      setError('Customer address is required')
      return
    }
    if (requiresTruck && !selectedSlot) {
      setError('Please select a time slot')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workOrderName: workOrder.title,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          notes: notes.trim(),
          scheduledDate: selectedSlot?.date,
          scheduledTime: selectedSlot
            ? `${selectedSlot.startTime}-${selectedSlot.endTime}`
            : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to schedule work order')
      }

      const data = await response.json()
      setScheduledWorkOrder(data)

      // Log the action (non-blocking)
      fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'schedule_work_order',
          itemName: workOrder.title,
          itemType: 'work_order',
        }),
      }).catch(() => {
        // Silently handle errors
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to schedule work order',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setCustomerName('')
      setCustomerPhone('')
      setCustomerAddress('')
      setNotes('')
      setSelectedSlot(null)
      setScheduledWorkOrder(null)
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  // Success state - show scheduled work order details
  if (scheduledWorkOrder) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800">
              Work Order Scheduled
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircleIcon className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Work order scheduled successfully!
                </h3>
                <p className="text-sm text-slate-600">
                  Confirmation Number:{' '}
                  <span className="font-mono font-semibold text-blue-600">
                    {scheduledWorkOrder.confirmationNumber}
                  </span>
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Work Order:{' '}
                  </span>
                  <span className="text-slate-800">{workOrder.title}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Customer:{' '}
                  </span>
                  <span className="text-slate-800">
                    {scheduledWorkOrder.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Phone:{' '}
                  </span>
                  <span className="text-slate-800">
                    {scheduledWorkOrder.customerPhone}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Address:{' '}
                  </span>
                  <span className="text-slate-800">
                    {scheduledWorkOrder.customerAddress}
                  </span>
                </div>
                {scheduledWorkOrder.scheduledDate && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">
                      Scheduled:{' '}
                    </span>
                    <span className="text-slate-800">
                      {new Date(
                        scheduledWorkOrder.scheduledDate,
                      ).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}{' '}
                      {scheduledWorkOrder.scheduledTime}
                    </span>
                  </div>
                )}
                {scheduledWorkOrder.notes && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">
                      Notes:{' '}
                    </span>
                    <span className="text-slate-800">
                      {scheduledWorkOrder.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Form state
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">
            Schedule Work Order
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <XMarkIcon className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {workOrder.title}
            </h3>
            <p className="text-sm text-slate-600">{workOrder.description}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="customerName"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="customerPhone"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Customer Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="customerAddress"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Customer Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            {requiresTruck && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  <CalendarIcon className="w-5 h-5 inline mr-1" />
                  Select Time Slot <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      disabled={isSubmitting}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        selectedSlot?.date === slot.date &&
                        selectedSlot?.startTime === slot.startTime
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {slot.timeWindow}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes or special instructions..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
