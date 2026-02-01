import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { BatchHistory as BatchHistoryType } from '../types'
import { StoreAppService } from '../services/StoreAppService'

export default function BatchHistory() {
    const [history, setHistory] = useState<BatchHistoryType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const service = useMemo(() => new StoreAppService(), [])

    const loadHistory = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await service.getBatchHistory()
            setHistory(data)
        } catch (err) {
            setError('Failed to load batch history')
        } finally {
            setLoading(false)
        }
    }, [service])

    useEffect(() => {
        void loadHistory()
    }, [loadHistory])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStateDisplay = (state: string): string => {
        switch (state) {
            case 'ready':
                return 'Preparing'
            case 'pending':
                return 'Pending'
            case 'in_progress':
                return 'In Progress'
            case 'installed':
                return 'Completed'
            case 'error':
                return 'Failed'
            case 'invalid':
                return 'Invalid'
            case 'partial_install':
                return 'Partial'
            default:
                return state
        }
    }

    const getStateClass = (state: string): string => {
        switch (state) {
            case 'installed':
                return 'history-success'
            case 'error':
            case 'invalid':
                return 'history-error'
            case 'partial_install':
                return 'history-warning'
            case 'in_progress':
                return 'history-progress'
            default:
                return 'history-pending'
        }
    }

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
                                    href={service.getBatchInstallUrl(batch.sys_id)}
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
                    className="history-toggle"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? '▲ Show Less' : `▼ Show All (${history.length - 3} more)`}
                </button>
            )}
        </div>
    )
}
