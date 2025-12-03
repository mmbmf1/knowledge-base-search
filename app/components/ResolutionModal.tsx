'use client'

import {
  XMarkIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

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
                    {step}
                  </span>
                </li>
              ))
            ) : (
              steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2.5" />
                  <span className="flex-1 text-slate-700 leading-relaxed">
                    {step}
                  </span>
                </li>
              ))
            )}
          </ol>
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
    </div>
  )
}
