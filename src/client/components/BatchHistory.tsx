import React, { useEffect, useState, useCallback, memo, useRef } from 'react'
import { BatchHistory as BatchHistoryType } from '../types'
import { storeAppService } from '../services/StoreAppService'
import { BATCH_STATES } from '../constants'

interface BatchHistoryProps {
  refreshTrigger?: number // Optional prop to trigger refresh
}

const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const locale = navigator.languages?.[0] || 'en-US'
    return date.toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const getStateDisplay = (state: string): string => {
    switch (state) {
        case BATCH_STATES.READY:
            return 'Preparing'
        case BATCH_STATES.PENDING:
            return 'Pending'
        case BATCH_STATES.IN_PROGRESS:
            return 'In Progress'
        case BATCH_STATES.INSTALLED:
            return 'Completed'
        case BATCH_STATES.ERROR:
            return 'Failed'
        case BATCH_STATES.INVALID:
            return 'Invalid'
        case BATCH_STATES.PARTIAL_INSTALL:
            return 'Partial'
        default:
            return state
    }
}

const getStateClass = (state: string): string => {
    switch (state) {
        case BATCH_STATES.INSTALLED:
            return 'history-success'
        case BATCH_STATES.ERROR:
        case BATCH_STATES.INVALID:
            return 'history-error'
        case BATCH_STATES.PARTIAL_INSTALL:
            return 'history-warning'
        case BATCH_STATES.IN_PROGRESS:
            return 'history-progress'
        default:
            return 'history-pending'
    }
}

const BatchHistory = memo(function BatchHistory({ refreshTrigger }: BatchHistoryProps) {
    const [history, setHistory] = useState<BatchHistoryType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const cacheRef = useRef<{ data: BatchHistoryType[], timestamp: number } | null>(null)
    const CACHE_DURATION = 30000 // 30 seconds cache

    const loadHistory = useCallback(async (force = false) => {
        // Check cache first
        const now = Date.now()
        if (!force && cacheRef.current && (now - cacheRef.current.timestamp) < CACHE_DURATION) {
            setHistory(cacheRef.current.data)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)
            const data = await storeAppService.getBatchHistory()
            setHistory(data)
            
            // Update cache
            cacheRef.current = {
                data,
                timestamp: now
            }
        } catch (err) {
            console.error('[BatchHistory] Failed to load:', err)
            setError('Failed to load batch history')
        } finally {
            setLoading(false)
        }
    }, [])

    // Load history on mount
    useEffect(() => {
        void loadHistory()
    }, [loadHistory])

    // Refresh when trigger changes (from parent component)
    useEffect(() => {
        if (refreshTrigger) {
            void loadHistory(true) // Force refresh
        }
    }, [refreshTrigger, loadHistory])

    if (loading) {
        return (
            <div className="batch-history">
                <h3 className="history-header">
                    Recent Batch Installations
                    <span className="loading-text">Loading...</span>
                </h3>
            </div>
        )
    }

    if (error) {
        return (
            <div className="batch-history">
                <h3 className="history-header">Recent Batch Installations</h3>
                <div className="history-error">{error}</div>
            </div>
        )
    }

    if (history.length === 0) {
        return (
            <div className="batch-history">
                <h3 className="history-header">Recent Batch Installations</h3>
                <div className="history-empty">No batch installations found</div>
            </div>
        )
    }

    const displayedHistory = isExpanded ? history : history.slice(0, 3)

    return (
        <div className="batch-history">
            <h3 className="history-header">
                Recent Batch Installations
                <span className="history-count">{history.length} total</span>
            </h3>
            
            <div className="history-list">
                {displayedHistory.map((batch) => (
                    <div key={batch.sys_id} className={`history-item ${getStateClass(batch.state)}`}>
                        <div className="history-main">
                            <div className="history-info">
                                <a 
                                    href={storeAppService.getBatchInstallUrl(batch.sys_id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="history-name"
                                >
                                    {batch.name}
                                </a>
                                <div className="history-meta">
                                    <span className="history-date">{formatDate(batch.sys_created_on)}</span>
                                    {batch.sys_updated_on !== batch.sys_created_on && (
                                        <span className="history-updated" title={`Last updated: ${formatDate(batch.sys_updated_on)}`}>
                                            • Updated {formatDate(batch.sys_updated_on)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className={`history-state-badge ${getStateClass(batch.state)}`}>
                                {getStateDisplay(batch.state)}
                            </span>
                        </div>
                        
                        {batch.error_message && (
                            <div className="history-error-message">
                                <strong>Error:</strong> {batch.error_message}
                            </div>
                        )}
                        
                        {batch.notes && (
                            <div className="history-notes">
                                {batch.notes.split('\n').slice(0, 2).join('\n')}
                                {batch.notes.split('\n').length > 2 && '...'}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {history.length > 3 && (
                <button 
                    type="button"
                    className="history-toggle"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? '▲ Show Less' : `▼ Show All (${history.length - 3} more)`}
                </button>
            )}
        </div>
    )
})

export default BatchHistory
