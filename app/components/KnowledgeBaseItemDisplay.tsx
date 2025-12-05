'use client'

import {
  XMarkIcon,
  MapIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

interface KnowledgeBaseItem {
  id: number
  title: string
  description: string
  type: 'equipment' | 'outage' | 'policy' | 'reference' | 'work_order' | 'subscriber'
  metadata?: Record<string, any>
}

interface KnowledgeBaseItemDisplayProps {
  item: KnowledgeBaseItem
  onClose: () => void
  onScheduleWorkOrder?: () => void
  onUpdateSubscriber?: () => void
}

export default function KnowledgeBaseItemDisplay({
  item,
  onClose,
  onScheduleWorkOrder,
  onUpdateSubscriber,
}: KnowledgeBaseItemDisplayProps) {
  const renderMetadata = () => {
    if (!item.metadata) return null

    switch (item.type) {
      case 'equipment':
        return (
          <div className="space-y-3">
            {item.metadata.specs && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Specifications
                </h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(item.metadata.specs).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-blue-600 font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:{' '}
                      </span>
                      <span className="text-blue-800">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {item.metadata.commonIssues && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Common Issues
                </h5>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  {item.metadata.commonIssues.map(
                    (issue: string, idx: number) => (
                      <li key={idx}>{issue}</li>
                    ),
                  )}
                </ul>
              </div>
            )}
            {item.metadata.lightStatus && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Light Status Guide
                </h5>
                <div className="space-y-1 text-sm">
                  {Object.entries(item.metadata.lightStatus).map(
                    ([light, status]) => (
                      <div key={light}>
                        <span className="text-blue-600 font-medium">
                          {light}:{' '}
                        </span>
                        <span className="text-blue-800">{String(status)}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )

      case 'outage':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Status: </span>
                <span
                  className={`font-semibold ${
                    item.metadata.status === 'active'
                      ? 'text-red-600'
                      : item.metadata.status === 'resolved'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                  }`}
                >
                  {item.metadata.status?.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Type: </span>
                <span className="text-blue-800">
                  {item.metadata.outageType}
                </span>
              </div>
              {item.metadata.affectedCustomers && (
                <div>
                  <span className="text-blue-600 font-medium">
                    Affected Customers:{' '}
                  </span>
                  <span className="text-blue-800">
                    {item.metadata.affectedCustomers}
                  </span>
                </div>
              )}
              {item.metadata.estimatedRestoreTime && (
                <div>
                  <span className="text-blue-600 font-medium">ETA: </span>
                  <span className="text-blue-800">
                    {new Date(
                      item.metadata.estimatedRestoreTime,
                    ).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            {item.metadata.cause && (
              <div>
                <span className="text-blue-600 font-medium">Cause: </span>
                <span className="text-blue-800">{item.metadata.cause}</span>
              </div>
            )}
            {item.metadata.affectedAreas && (
              <div>
                <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  <MapIcon className="w-4 h-4" />
                  View Outage Map
                </button>
              </div>
            )}
            {item.metadata.requiresWorkOrder &&
              item.metadata.workOrderType && (
                <div>
                  <span className="text-blue-600 font-medium">
                    Work Order: {item.metadata.workOrderType}
                  </span>
                </div>
              )}
          </div>
        )

      case 'policy':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {item.metadata.category && (
                <div>
                  <span className="text-blue-600 font-medium">Category: </span>
                  <span className="text-blue-800">
                    {item.metadata.category}
                  </span>
                </div>
              )}
              {item.metadata.approvalLevel && (
                <div>
                  <span className="text-blue-600 font-medium">
                    Approval Level:{' '}
                  </span>
                  <span className="text-blue-800">
                    {item.metadata.approvalLevel}
                  </span>
                </div>
              )}
              {item.metadata.processingTime && (
                <div>
                  <span className="text-blue-600 font-medium">
                    Processing Time:{' '}
                  </span>
                  <span className="text-blue-800">
                    {item.metadata.processingTime}
                  </span>
                </div>
              )}
            </div>
            {item.metadata.requirements && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-1">
                  Requirements
                </h5>
                <ul className="list-disc list-inside text-sm text-blue-800">
                  {item.metadata.requirements.map(
                    (req: string, idx: number) => (
                      <li key={idx}>{req}</li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </div>
        )

      case 'reference':
        return (
          <div className="space-y-3">
            {item.metadata.speedRanges && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Speed Ranges
                </h5>
                <div className="space-y-1 text-sm">
                  {Object.entries(item.metadata.speedRanges).map(
                    ([range, description]) => (
                      <div key={range}>
                        <span className="text-blue-600 font-medium">
                          {range}:{' '}
                        </span>
                        <span className="text-blue-800">{String(description)}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {item.metadata.factors && Array.isArray(item.metadata.factors) && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Factors Affecting Speed
                </h5>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  {item.metadata.factors.map((factor: string, idx: number) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
            {item.metadata.lightStates && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Light States
                </h5>
                <div className="space-y-1 text-sm">
                  {Object.entries(item.metadata.lightStates).map(
                    ([light, status]) => (
                      <div key={light}>
                        <span className="text-blue-600 font-medium">
                          {light}:{' '}
                        </span>
                        <span className="text-blue-800">{String(status)}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {item.metadata.statusCodes && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Status Codes
                </h5>
                <div className="space-y-1 text-sm">
                  {Object.entries(item.metadata.statusCodes).map(
                    ([code, description]) => (
                      <div key={code}>
                        <span className="text-blue-600 font-medium">
                          {code}:{' '}
                        </span>
                        <span className="text-blue-800">
                          {String(description)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {item.metadata.actions && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Actions
                </h5>
                <div className="space-y-2">
                  {Object.entries(item.metadata.actions).map(
                    ([status, actionSteps]) => (
                      <div key={status}>
                        <span className="text-blue-600 font-medium text-sm">
                          {status}:
                        </span>
                        <ul className="list-disc list-inside text-sm text-blue-800 ml-2 mt-1">
                          {(actionSteps as string[]).map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {item.metadata.troubleshooting && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Troubleshooting
                </h5>
                {Array.isArray(item.metadata.troubleshooting) ? (
                  <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                    {item.metadata.troubleshooting.map(
                      (step: string, idx: number) => (
                        <li key={idx}>{step}</li>
                      ),
                    )}
                  </ul>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(item.metadata.troubleshooting).map(
                      ([issue, steps]) => (
                        <div key={issue}>
                          <span className="text-blue-600 font-medium text-sm">
                            {issue}:
                          </span>
                          <ul className="list-disc list-inside text-sm text-blue-800 ml-2 mt-1">
                            {(steps as string[]).map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'work_order':
        return (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {item.metadata.time_bound !== undefined && (
              <div>
                <span className="text-blue-600 font-medium">Time Bound: </span>
                <span className="text-blue-800">
                  {item.metadata.time_bound ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {item.metadata.no_truck !== undefined && (
              <div>
                <span className="text-blue-600 font-medium">
                  Truck Required:{' '}
                </span>
                <span className="text-blue-800">
                  {item.metadata.no_truck ? 'No' : 'Yes'}
                </span>
              </div>
            )}
            {item.metadata.sla && (
              <div>
                <span className="text-blue-600 font-medium">SLA: </span>
                <span className="text-blue-800">{item.metadata.sla}</span>
              </div>
            )}
            {item.metadata.customer_service_impacting && (
              <div>
                <span className="text-blue-600 font-medium">
                  Service Impacting:{' '}
                </span>
                <span className="text-blue-800">
                  {item.metadata.customer_service_impacting}
                </span>
              </div>
            )}
          </div>
        )

      case 'subscriber':
        return (
          <div className="space-y-3">
            {item.metadata.fields && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Data Fields
                </h5>
                <div className="space-y-1 text-sm">
                  {Object.entries(item.metadata.fields).map(
                    ([fieldName, fieldData]: [string, any]) => (
                      <div key={fieldName}>
                        <span className="text-blue-600 font-medium capitalize">
                          {fieldName.replace(/([A-Z])/g, ' $1').trim()}:{' '}
                        </span>
                        <span className="text-blue-800">
                          {fieldData.required ? 'Required' : 'Optional'} •{' '}
                          {fieldData.format}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {item.metadata.updateProcedures && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Update Procedures
                </h5>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  {item.metadata.updateProcedures.map(
                    (procedure: string, idx: number) => (
                      <li key={idx}>{procedure}</li>
                    ),
                  )}
                </ul>
              </div>
            )}
            {item.metadata.validationRules && (
              <div>
                <h5 className="text-sm font-semibold text-blue-900 mb-2">
                  Validation Rules
                </h5>
                <div className="space-y-1 text-sm">
                  {Object.entries(item.metadata.validationRules).map(
                    ([field, rule]) => (
                      <div key={field}>
                        <span className="text-blue-600 font-medium capitalize">
                          {field}:{' '}
                        </span>
                        <span className="text-blue-800">{String(rule)}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const getTypeColor = () => {
    switch (item.type) {
      case 'equipment':
        return 'bg-purple-50 border-purple-200'
      case 'outage':
        return 'bg-red-50 border-red-200'
      case 'policy':
        return 'bg-green-50 border-green-200'
      case 'reference':
        return 'bg-yellow-50 border-yellow-200'
      case 'work_order':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className={`mt-6 p-4 border rounded-lg ${getTypeColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {item.type === 'reference' && (
            <DocumentTextIcon className="w-5 h-5 text-yellow-700" />
          )}
          {item.type === 'outage' && (
            <MapIcon className="w-5 h-5 text-red-700" />
          )}
          <h4 className="font-semibold text-slate-900">{item.title}</h4>
        </div>
        <button
          onClick={onClose}
          className="text-slate-600 hover:text-slate-800"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      {item.description && (
        <p className="text-sm text-slate-700 mb-3">{item.description}</p>
      )}
      {renderMetadata()}
      {item.type === 'work_order' && onScheduleWorkOrder && (
        <button
          onClick={onScheduleWorkOrder}
          className="w-full mt-3 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <CalendarIcon className="w-5 h-5" />
          Schedule Work Order
        </button>
      )}
      {item.type === 'subscriber' && onUpdateSubscriber && (
        <button
          onClick={onUpdateSubscriber}
          className="w-full mt-3 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <UserIcon className="w-5 h-5" />
          Update Subscriber Data
        </button>
      )}
    </div>
  )
}
