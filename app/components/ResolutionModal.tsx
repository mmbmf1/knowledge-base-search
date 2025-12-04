'use client'

import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import ScheduleWorkOrderModal from './ScheduleWorkOrderModal'
import KnowledgeBaseItemDisplay from './KnowledgeBaseItemDisplay'

interface ResolutionModalProps {
  title: string
  steps: string[]
  stepType: 'numbered' | 'bullets'
  isOpen: boolean
  onClose: () => void
  scenarioId: number
  onFeedback: (scenarioId: number, rating: number) => void
  isRated: boolean
}

interface KnowledgeBaseItem {
  id: number
  title: string
  description: string
  type: 'work_order' | 'equipment' | 'outage' | 'policy' | 'reference'
  metadata?: Record<string, any>
}

type KnowledgeBaseType = 'work_order' | 'equipment' | 'outage' | 'policy' | 'reference'

interface TypeNames {
  work_order: string[]
  equipment: string[]
  outage: string[]
  policy: string[]
  reference: string[]
}

export default function ResolutionModal({
  title,
  steps,
  stepType,
  isOpen,
  onClose,
  scenarioId,
  onFeedback,
  isRated,
}: ResolutionModalProps) {
  const [typeNames, setTypeNames] = useState<TypeNames>({
    work_order: [],
    equipment: [],
    outage: [],
    policy: [],
    reference: [],
  })
  const [selectedItem, setSelectedItem] = useState<KnowledgeBaseItem | null>(
    null,
  )
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Fetch all knowledge base type names
      const fetchAllNames = async () => {
        try {
          const [workOrders, equipment, outages, policies, references] =
            await Promise.all([
              fetch('/api/work-order').then((r) => r.json()),
              fetch('/api/knowledge-base?type=equipment').then((r) => r.json()),
              fetch('/api/knowledge-base?type=outage').then((r) => r.json()),
              fetch('/api/knowledge-base?type=policy').then((r) => r.json()),
              fetch('/api/knowledge-base?type=reference').then((r) => r.json()),
            ])

          setTypeNames({
            work_order: workOrders.names || [],
            equipment: equipment.names || [],
            outage: outages.names || [],
            policy: policies.names || [],
            reference: references.names || [],
          })
        } catch (err) {
          console.error('Failed to fetch knowledge base names:', err)
        }
      }

      fetchAllNames()
    }
  }, [isOpen])

  /**
   * Finds a knowledge base item name in text based on type-specific patterns
   */
  const findInText = (
    text: string,
    names: string[],
    type: KnowledgeBaseType,
  ): { name: string; match: RegExpMatchArray; type: KnowledgeBaseType } | null => {
    if (!names.length) return null

    // Sort names by length (longest first) to avoid partial matches
    const sortedNames = [...names].sort((a, b) => b.length - a.length)

    for (const name of sortedNames) {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      let patterns: RegExp[] = []

      switch (type) {
        case 'work_order':
          patterns = [
            new RegExp(
              `\\b(create|Create)\\s+(a|an|the)?\\s+(${escapedName})\\s+work\\s+order\\b`,
              'i',
            ),
            new RegExp(`\\b(${escapedName})\\s+work\\s+order\\b`, 'i'),
          ]
          break
        case 'equipment':
          patterns = [
            new RegExp(`\\b(refer to|check|see|view)\\s+(the\\s+)?(${escapedName})\\b`, 'i'),
            new RegExp(`\\b(${escapedName})\\b`, 'i'),
          ]
          break
        case 'outage':
          patterns = [
            new RegExp(`\\b(check|view|see)\\s+(the\\s+)?(${escapedName})\\b`, 'i'),
            new RegExp(`\\b(${escapedName})\\b`, 'i'),
          ]
          break
        case 'policy':
          patterns = [
            new RegExp(`\\b(refer to|check|see|follow)\\s+(the\\s+)?(${escapedName})\\b`, 'i'),
            new RegExp(`\\b(${escapedName})\\b`, 'i'),
          ]
          break
        case 'reference':
          patterns = [
            new RegExp(`\\b(refer to|check|see|use)\\s+(the\\s+)?(${escapedName})\\b`, 'i'),
            new RegExp(`\\b(${escapedName})\\b`, 'i'),
          ]
          break
      }

      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match && match.index !== undefined) {
          return { name, match, type }
        }
      }
    }
    return null
  }

  const handleItemClick = async (name: string, type: KnowledgeBaseType) => {
    try {
      let response
      if (type === 'work_order') {
        response = await fetch(
          `/api/work-order?name=${encodeURIComponent(name)}`,
        )
      } else {
        response = await fetch(
          `/api/knowledge-base?name=${encodeURIComponent(name)}&type=${type}`,
        )
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}`)
      }
      const item = await response.json()
      setSelectedItem({ ...item, type })
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err)
    }
  }

  const renderStepWithKnowledgeBase = (step: string) => {
    // Check all types in priority order (work orders first, then others)
    const types: KnowledgeBaseType[] = [
      'work_order',
      'equipment',
      'outage',
      'policy',
      'reference',
    ]

    for (const type of types) {
      const match = findInText(step, typeNames[type], type)
      if (match) {
        const { name, match: regexMatch, type: matchType } = match
        const matchIndex = regexMatch.index
        if (matchIndex === undefined) continue

        const beforeMatch = step.substring(0, matchIndex)
        const afterMatch = step.substring(matchIndex + regexMatch[0].length)

        // Extract the actual name from the match
        let itemName = name
        if (matchType === 'work_order') {
          itemName = regexMatch[3] || regexMatch[1] || name
          const hasCreatePrefix =
            regexMatch[1] && regexMatch[1].toLowerCase() === 'create'
          const prefix = hasCreatePrefix
            ? `${regexMatch[1]} ${regexMatch[2] ? regexMatch[2] + ' ' : ''}`
            : ''

          return (
            <span>
              {beforeMatch}
              {prefix && <span>{prefix}</span>}
              <button
                onClick={() => handleItemClick(itemName, matchType)}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors underline decoration-dotted"
              >
                {itemName}
                <InformationCircleIcon className="w-4 h-4" />
              </button>
              <span> work order</span>
              {afterMatch}
            </span>
          )
        } else {
          // For other types, extract name from match groups
          itemName = regexMatch[3] || regexMatch[1] || name

          return (
            <span>
              {beforeMatch}
              <button
                onClick={() => handleItemClick(itemName, matchType)}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors underline decoration-dotted"
              >
                {itemName}
                <InformationCircleIcon className="w-4 h-4" />
              </button>
              {afterMatch}
            </span>
          )
        }
      }
    }

    return <span>{step}</span>
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">
            Resolution Steps
          </h3>
          <ol className="space-y-3">
            {stepType === 'numbered' ? (
              steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-slate-700 leading-relaxed pt-1">
                    {renderStepWithKnowledgeBase(step)}
                  </span>
                </li>
              ))
            ) : (
              steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2.5" />
                  <span className="flex-1 text-slate-700 leading-relaxed">
                    {renderStepWithKnowledgeBase(step)}
                  </span>
                </li>
              ))
            )}
          </ol>

          {selectedItem && (
            <KnowledgeBaseItemDisplay
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onScheduleWorkOrder={
                selectedItem.type === 'work_order'
                  ? () => setIsScheduleModalOpen(true)
                  : undefined
              }
            />
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          {isRated ? (
            <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-medium">Thank you for your feedback</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-sm text-slate-600 font-medium">
                Did this help?
              </span>
              <button
                onClick={() => {
                  onFeedback(scenarioId, 1)
                  onClose()
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors font-medium"
              >
                <HandThumbUpIcon className="w-5 h-5" />
                <span>Helpful</span>
              </button>
              <button
                onClick={() => {
                  onFeedback(scenarioId, -1)
                  onClose()
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors font-medium"
              >
                <HandThumbDownIcon className="w-5 h-5" />
                <span>Not helpful</span>
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Close
          </button>
        </div>
      </div>

      {selectedItem && selectedItem.type === 'work_order' && (
        <ScheduleWorkOrderModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          workOrder={selectedItem}
        />
      )}
    </div>
  )
}
