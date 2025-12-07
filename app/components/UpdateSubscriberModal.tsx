'use client'

import { useState } from 'react'
import { XMarkIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline'

interface UpdateSubscriberModalProps {
  isOpen: boolean
  onClose: () => void
  subscriber: {
    id: number
    title: string
    description: string
    metadata?: Record<string, any>
  }
}

interface UpdatedSubscriber {
  accountNumber: string
  name: string
  address: string
  phone: string
  email: string
  servicePreferences?: {
    paperlessBilling?: boolean
    autoPay?: boolean
    communicationPreference?: string
  }
  confirmationNumber: string
}

export default function UpdateSubscriberModal({
  isOpen,
  onClose,
  subscriber,
}: UpdateSubscriberModalProps) {
  const [accountNumber, setAccountNumber] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [paperlessBilling, setPaperlessBilling] = useState(false)
  const [autoPay, setAutoPay] = useState(false)
  const [communicationPreference, setCommunicationPreference] = useState('email')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updatedSubscriber, setUpdatedSubscriber] =
    useState<UpdatedSubscriber | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!accountNumber.trim()) {
      setError('Account number is required')
      return
    }
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!address.trim()) {
      setError('Address is required')
      return
    }
    if (!phone.trim()) {
      setError('Phone is required')
      return
    }
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    // Basic phone validation (allow various formats)
    const phoneRegex = /^[\d\s\-\(\)]+$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/subscriber/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: accountNumber.trim(),
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          servicePreferences: {
            paperlessBilling,
            autoPay,
            communicationPreference,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update subscriber data')
      }

      const data = await response.json()
      setUpdatedSubscriber(data)

      // Log the action (non-blocking)
      fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'update_subscriber',
          itemName: subscriber.title,
          itemType: 'subscriber',
        }),
      }).catch(() => {
        // Silently handle errors
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update subscriber data',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setAccountNumber('')
      setName('')
      setAddress('')
      setPhone('')
      setEmail('')
      setPaperlessBilling(false)
      setAutoPay(false)
      setCommunicationPreference('email')
      setUpdatedSubscriber(null)
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  // Success state - show updated subscriber details
  if (updatedSubscriber) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800">
              Subscriber Data Updated
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
                  Subscriber data updated successfully!
                </h3>
                <p className="text-sm text-slate-600">
                  Confirmation Number:{' '}
                  <span className="font-mono font-semibold text-blue-600">
                    {updatedSubscriber.confirmationNumber}
                  </span>
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Account Number:{' '}
                  </span>
                  <span className="text-slate-800">
                    {updatedSubscriber.accountNumber}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Name:{' '}
                  </span>
                  <span className="text-slate-800">{updatedSubscriber.name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Address:{' '}
                  </span>
                  <span className="text-slate-800">
                    {updatedSubscriber.address}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Phone:{' '}
                  </span>
                  <span className="text-slate-800">{updatedSubscriber.phone}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    Email:{' '}
                  </span>
                  <span className="text-slate-800">{updatedSubscriber.email}</span>
                </div>
                {updatedSubscriber.servicePreferences && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">
                      Service Preferences:{' '}
                    </span>
                    <span className="text-slate-800">
                      {updatedSubscriber.servicePreferences.paperlessBilling
                        ? 'Paperless Billing, '
                        : ''}
                      {updatedSubscriber.servicePreferences.autoPay
                        ? 'Auto Pay, '
                        : ''}
                      {updatedSubscriber.servicePreferences.communicationPreference}
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
            Update Subscriber Data
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
              {subscriber.title}
            </h3>
            <p className="text-sm text-slate-600">{subscriber.description}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="accountNumber"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Service Preferences
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={paperlessBilling}
                    onChange={(e) => setPaperlessBilling(e.target.checked)}
                    disabled={isSubmitting}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    Paperless Billing
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoPay}
                    onChange={(e) => setAutoPay(e.target.checked)}
                    disabled={isSubmitting}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Auto Pay</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Communication Preference
                  </label>
                  <select
                    value={communicationPreference}
                    onChange={(e) => setCommunicationPreference(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="mail">Mail</option>
                    <option value="text">Text Message</option>
                  </select>
                </div>
              </div>
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
              {isSubmitting ? 'Updating...' : 'Update Subscriber Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
