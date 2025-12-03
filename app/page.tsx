'use client'

import { useState, FormEvent } from 'react'
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import ResolutionModal from './components/ResolutionModal'

interface SearchResult {
  id: number
  title: string
  description: string
  helpful_count?: number
  total_feedback?: number
  helpful_percentage?: number
}

interface Resolution {
  id: number
  scenario_id: number
  steps: string[]
  step_type: 'numbered' | 'bullets'
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ratedScenarios, setRatedScenarios] = useState<Set<number>>(new Set())
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [selectedResolution, setSelectedResolution] =
    useState<Resolution | null>(null)
  const [selectedScenarioTitle, setSelectedScenarioTitle] = useState('')

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()

    if (!query.trim()) {
      return
    }

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = async (scenarioId: number) => {
    try {
      const response = await fetch(`/api/resolution?scenarioId=${scenarioId}`)
      if (response.ok) {
        const resolution: Resolution = await response.json()
        const scenario = results.find((r) => r.id === scenarioId)
        setSelectedResolution(resolution)
        setSelectedScenarioTitle(scenario?.title || '')
        setShowResolutionModal(true)
      }
    } catch (err) {
      console.error('Failed to fetch resolution:', err)
    }
  }

  const handleFeedback = async (scenarioId: number, rating: number) => {
    if (ratedScenarios.has(scenarioId)) return
    await submitFeedback(scenarioId, rating)
  }

  const submitFeedback = async (scenarioId: number, rating: number) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, scenarioId, rating }),
      })
      setRatedScenarios(new Set([...ratedScenarios, scenarioId]))
    } catch (err) {
      console.error('Failed to submit feedback:', err)
    }
  }

  const handleCloseModal = () => {
    setShowResolutionModal(false)
    setSelectedResolution(null)
    setSelectedScenarioTitle('')
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setError(null)
    setRatedScenarios(new Set())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-8 mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Troubleshooting Search
            </h1>
            <p className="text-slate-600">
              Find solutions for common ISP issues
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., router light is red, no internet connection..."
                  className="w-full px-5 py-3.5 pr-10 text-slate-700 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  disabled={loading}
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="w-5 h-5 text-slate-400" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-8 py-3.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-800">
              <span className="font-medium">{error}</span>
            </div>
          )}
        </div>

        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-slate-600">Searching...</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => {
              const isRated = ratedScenarios.has(result.id)
              return (
                <div
                  key={result.id}
                  onClick={() => handleCardClick(result.id)}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/50 p-6 hover:shadow-xl hover:border-blue-300/50 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-slate-800">
                          {result.title}
                        </h3>
                        {result.helpful_percentage !== null &&
                          result.helpful_percentage !== undefined &&
                          result.total_feedback &&
                          result.total_feedback > 0 && (
                            <div className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                              {result.helpful_percentage}% ({result.total_feedback})
                            </div>
                          )}
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {result.description}
                      </p>
                      {isRated && (
                        <div className="flex items-center gap-2 text-sm text-green-600 mt-4">
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Thank you for your feedback</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && results.length === 0 && query && !error && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-12 text-center">
            <p className="text-slate-600 text-lg mb-2">No results found</p>
            <p className="text-slate-500">Try a different query</p>
          </div>
        )}
      </div>

      {selectedResolution && (
        <ResolutionModal
          title={selectedScenarioTitle}
          steps={selectedResolution.steps}
          stepType={selectedResolution.step_type}
          isOpen={showResolutionModal}
          onClose={handleCloseModal}
          scenarioId={selectedResolution.scenario_id}
          onFeedback={handleFeedback}
          isRated={ratedScenarios.has(selectedResolution.scenario_id)}
        />
      )}
    </div>
  )
}
