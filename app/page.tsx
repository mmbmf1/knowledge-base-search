'use client'

import {
  useState,
  FormEvent,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react'
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import ResolutionModal from './components/ResolutionModal'
import KnowledgeBaseItemDisplay from './components/KnowledgeBaseItemDisplay'
import ScheduleWorkOrderModal from './components/ScheduleWorkOrderModal'
import UpdateSubscriberModal from './components/UpdateSubscriberModal'

interface SearchResult {
  id: number
  title: string
  description: string
  type?:
    | 'scenario'
    | 'work_order'
    | 'equipment'
    | 'outage'
    | 'policy'
    | 'reference'
    | 'subscriber'
  metadata?: Record<string, any>
  helpful_count?: number
  not_helpful_count?: number
  total_feedback?: number
  helpful_percentage?: number
  sourceQuery?: string
}

interface KnowledgeBaseItem {
  id: number
  title: string
  description: string
  type:
    | 'equipment'
    | 'outage'
    | 'policy'
    | 'reference'
    | 'subscriber'
    | 'work_order'
  metadata?: Record<string, any>
}

interface Resolution {
  id: number
  scenario_id: number
  steps: string[]
  step_type: 'numbered' | 'bullets'
}

interface TopSearch {
  query: string
  count: number
  itemType?: string
  isKnowledgeBase?: boolean
}

interface HelpfulSearch {
  query: string
  helpfulCount: number
  notHelpfulCount: number
  totalFeedback: number
  helpfulPercentage: number
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
  const [selectedItem, setSelectedItem] = useState<KnowledgeBaseItem | null>(
    null,
  )
  const [isKnowledgeBaseModalOpen, setIsKnowledgeBaseModalOpen] =
    useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isUpdateSubscriberModalOpen, setIsUpdateSubscriberModalOpen] =
    useState(false)
  const [topSearches, setTopSearches] = useState<TopSearch[]>([])
  const [helpfulSearches, setHelpfulSearches] = useState<HelpfulSearch[]>([])
  const [helpfulSearchResults, setHelpfulSearchResults] = useState<
    Record<string, SearchResult[]>
  >({})
  const [loadingHelpfulSearches, setLoadingHelpfulSearches] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const exampleQueries = [
    'wifi password not working',
    'router light is red',
    'no internet connection',
    'slow internet speed',
  ]

  const fetchSearchResults = async (
    searchQuery: string,
  ): Promise<SearchResult[]> => {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Search failed')
    }

    const data = await response.json()
    return (data.results || []).map((r: SearchResult) => ({
      ...r,
      sourceQuery: searchQuery,
    }))
  }

  const logAction = useCallback(
    (actionType: string, itemName: string, itemType: string) => {
      fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, itemName, itemType }),
      }).catch(() => {})
    },
    [],
  )

  const findResultById = useCallback(
    (id: number) =>
      results.find((r) => r.id === id) ||
      Object.values(helpfulSearchResults)
        .flat()
        .find((r) => r.id === id),
    [results, helpfulSearchResults],
  )

  const handleSearch = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!query.trim()) return

      setLoading(true)
      setError(null)
      setResults([])

      try {
        setResults(await fetchSearchResults(query))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    },
    [query],
  )

  const handleCardClick = useCallback(
    async (scenarioId: number) => {
      const result = findResultById(scenarioId)
      if (!result) return

      if (
        result.type &&
        result.type !== 'scenario' &&
        result.type !== 'work_order'
      ) {
        setSelectedItem({
          id: result.id,
          title: result.title,
          description: result.description,
          type: result.type as KnowledgeBaseItem['type'],
          metadata: result.metadata,
        })
        setIsKnowledgeBaseModalOpen(true)
        return
      }

      if (result.type === 'work_order') return

      const response = await fetch(`/api/resolution?scenarioId=${scenarioId}`)
      if (response.ok) {
        const resolution: Resolution = await response.json()
        setSelectedResolution(resolution)
        setSelectedScenarioTitle(result.title)
        setShowResolutionModal(true)
      }
    },
    [findResultById],
  )

  const handleFeedback = (scenarioId: number, rating: number) => {
    if (!ratedScenarios.has(scenarioId)) submitFeedback(scenarioId, rating)
  }

  const fetchHelpfulSearches = useCallback(async () => {
    setLoadingHelpfulSearches(true)
    try {
      const response = await fetch('/api/helpful-searches?limit=10&days=30')
      if (!response.ok) return

      const data = await response.json()
      const searches = data.helpfulSearches || []
      setHelpfulSearches(searches)

      const resultsMap: Record<string, SearchResult[]> = {}
      await Promise.all(
        searches.map(async (s: HelpfulSearch) => {
          try {
            const scenarioResponse = await fetch(
              `/api/scenario?title=${encodeURIComponent(s.query)}`,
            )
            if (scenarioResponse.ok) {
              const scenario = await scenarioResponse.json()
              if (scenario && scenario.id) {
                resultsMap[s.query] = [
                  {
                    id: scenario.id,
                    title: scenario.title,
                    description: scenario.description || '',
                    type: 'scenario',
                    sourceQuery: s.query,
                  },
                ]
              }
            }
          } catch (err) {
            console.error('Error fetching helpful search result:', s.query, err)
          }
        }),
      )
      setHelpfulSearchResults(resultsMap)
    } finally {
      setLoadingHelpfulSearches(false)
    }
  }, [])

  const refreshSearchResults = async () => {
    if (!query.trim()) return
    try {
      setResults(await fetchSearchResults(query))
    } catch {}
  }

  const submitFeedback = async (scenarioId: number, rating: number) => {
    const result = findResultById(scenarioId)
    const feedbackQuery = query.trim() || result?.sourceQuery || ''
    if (!feedbackQuery) return

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: feedbackQuery, scenarioId, rating }),
    })

    if (response.ok) {
      setRatedScenarios(new Set([...ratedScenarios, scenarioId]))
      setToast({ message: 'Thank you for your feedback!', type: 'success' })
      setTimeout(() => setToast(null), 3000)
      Promise.all([fetchHelpfulSearches(), refreshSearchResults()])
    } else {
      setToast({ message: 'Failed to submit feedback', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const closeKnowledgeBaseModal = useCallback(() => {
    setIsKnowledgeBaseModalOpen(false)
    setSelectedItem(null)
    setQuery('')
    setResults([])
    searchInputRef.current?.focus()
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowResolutionModal(false)
    setSelectedResolution(null)
    setSelectedScenarioTitle('')
    searchInputRef.current?.focus()
  }, [])

  const handleClear = () => {
    setQuery('')
    setResults([])
    setError(null)
    setRatedScenarios(new Set())
  }

  const handleTopSearchClick = async (topSearch: TopSearch) => {
    if (topSearch.isKnowledgeBase && topSearch.itemType) {
      setLoading(true)
      setError(null)

      const url =
        topSearch.itemType === 'work_order'
          ? `/api/work-order?name=${encodeURIComponent(topSearch.query)}`
          : `/api/knowledge-base?name=${encodeURIComponent(topSearch.query)}&type=${topSearch.itemType}`

      const response = await fetch(url)
      if (response.ok) {
        const item = await response.json()
        logAction('view_knowledge_base', item.title, topSearch.itemType)
        setSelectedItem({
          ...item,
          type: topSearch.itemType as KnowledgeBaseItem['type'],
        })
        setIsKnowledgeBaseModalOpen(true)
      } else {
        setError('Failed to fetch item')
      }
      setLoading(false)
    } else {
      setQuery(topSearch.query)
      setLoading(true)
      setError(null)
      setResults([])
      try {
        setResults(await fetchSearchResults(topSearch.query))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetch('/api/top-knowledge-base?limit=10&days=30')
      .then((r) => r.ok && r.json())
      .then((data) => data && setTopSearches(data.topSearches || []))
      .catch(() => {})
    fetchHelpfulSearches()
  }, [fetchHelpfulSearches])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isKnowledgeBaseModalOpen) closeKnowledgeBaseModal()
        if (showResolutionModal) handleCloseModal()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [
    isKnowledgeBaseModalOpen,
    showResolutionModal,
    closeKnowledgeBaseModal,
    handleCloseModal,
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-8 mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Knowledge Base Search
            </h1>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            {!query && exampleQueries.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-sm text-slate-600 mr-2">Try:</span>
                {exampleQueries.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={async () => {
                      setQuery(example)
                      setLoading(true)
                      setError(null)
                      setResults([])
                      try {
                        setResults(await fetchSearchResults(example))
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : 'An error occurred',
                        )
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full border border-blue-200 hover:border-blue-300 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for solutions, guides, or information..."
                  className="w-full px-5 py-3.5 pr-10 text-slate-700 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  aria-label="Search input"
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
            <div
              className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-800"
              role="alert"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{error}</span>
                <button
                  onClick={() => {
                    setError(null)
                    searchInputRef.current?.focus()
                  }}
                  className="ml-4 text-red-600 hover:text-red-800"
                  aria-label="Dismiss error"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
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
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-slate-800">
                          {result.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                            <HandThumbUpIcon className="w-4 h-4" />
                            <span>{result.helpful_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                            <HandThumbDownIcon className="w-4 h-4" />
                            <span>{result.not_helpful_count || 0}</span>
                          </div>
                        </div>
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

        {!loading &&
          results.length === 0 &&
          !query &&
          (topSearches.length > 0 || helpfulSearches.length > 0) && (
            <div className="space-y-6">
              {topSearches.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    Docs
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {topSearches.map((topSearch, index) => (
                      <button
                        key={index}
                        onClick={() => handleTopSearchClick(topSearch)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 hover:border-indigo-300"
                      >
                        {topSearch.query}
                        <span className="ml-1.5 text-indigo-500 text-xs">
                          📚
                        </span>
                        <span className="ml-2 text-indigo-500 text-xs">
                          ({topSearch.count})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(loadingHelpfulSearches || helpfulSearches.length > 0) && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                    <HandThumbUpIcon className="w-5 h-5 text-green-600" />
                    Most Helpful Searches
                  </h2>
                  {loadingHelpfulSearches ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-slate-200 rounded-xl"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {helpfulSearches
                        .map((helpfulSearch, index) => {
                          const result =
                            helpfulSearchResults[helpfulSearch.query]?.[0]
                          if (!result) {
                            return (
                              <div
                                key={`${helpfulSearch.query}-${index}`}
                                onClick={() => {
                                  setQuery(helpfulSearch.query)
                                  handleSearch({
                                    preventDefault: () => {},
                                  } as FormEvent)
                                }}
                                className="bg-white rounded-xl shadow-md border border-slate-200/50 p-6 hover:shadow-xl hover:border-blue-300/50 transition-all duration-200 cursor-pointer"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="text-xl font-semibold text-slate-800">
                                    {helpfulSearch.query}
                                  </h3>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                                      <HandThumbUpIcon className="w-4 h-4" />
                                      <span>{helpfulSearch.helpfulCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                                      <HandThumbDownIcon className="w-4 h-4" />
                                      <span>
                                        {helpfulSearch.notHelpfulCount || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                  Click to search for this
                                </p>
                              </div>
                            )
                          }
                          return (
                            <div
                              key={`${result.id}-${index}-${helpfulSearch.query || index}`}
                              onClick={() => handleCardClick(result.id)}
                              className="bg-white rounded-xl shadow-md border border-slate-200/50 p-6 hover:shadow-xl hover:border-blue-300/50 transition-all duration-200 cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-xl font-semibold text-slate-800">
                                  {result.title}
                                </h3>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                                    <HandThumbUpIcon className="w-4 h-4" />
                                    <span>{helpfulSearch.helpfulCount}</span>
                                  </div>
                                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                                    <HandThumbDownIcon className="w-4 h-4" />
                                    <span>
                                      {helpfulSearch.notHelpfulCount || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-slate-600 leading-relaxed">
                                {result.description}
                              </p>
                            </div>
                          )
                        })
                        .filter(Boolean)}
                    </div>
                  )}
                </div>
              )}
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

      {isKnowledgeBaseModalOpen && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={closeKnowledgeBaseModal}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2
                id="modal-title"
                className="text-2xl font-bold text-slate-800"
              >
                {selectedItem.title}
              </h2>
              <button
                onClick={closeKnowledgeBaseModal}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <KnowledgeBaseItemDisplay
                item={selectedItem}
                onClose={closeKnowledgeBaseModal}
                onScheduleWorkOrder={
                  selectedItem.type === 'work_order'
                    ? () => {
                        logAction(
                          'click_schedule_work_order',
                          selectedItem.title,
                          'work_order',
                        )
                        setIsScheduleModalOpen(true)
                      }
                    : undefined
                }
                onUpdateSubscriber={
                  selectedItem.type === 'subscriber'
                    ? () => {
                        logAction(
                          'click_update_subscriber',
                          selectedItem.title,
                          'subscriber',
                        )
                        setIsUpdateSubscriberModalOpen(true)
                      }
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      )}

      {selectedItem?.type === 'work_order' && (
        <ScheduleWorkOrderModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          workOrder={selectedItem}
        />
      )}

      {selectedItem?.type === 'subscriber' && (
        <UpdateSubscriberModal
          isOpen={isUpdateSubscriberModalOpen}
          onClose={() => setIsUpdateSubscriberModalOpen(false)}
          subscriber={selectedItem}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <XMarkIcon className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-600"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
