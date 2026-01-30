import React, { useEffect, useState } from 'react'
import { BatchStatusResponse } from '../types'
import { StoreAppService } from '../services/StoreAppService'

interface ProgressTrackerProps {
    batchId: string | null
    executionTrackerId: string | null
    onComplete: () => void
}

export default function ProgressTracker({ batchId, executionTrackerId, onComplete }: ProgressTrackerProps) {
    const [status, setStatus] = useState<BatchStatusResponse | null>(null)
    const service = new StoreAppService()

    useEffect(() => {
        if (!batchId) {
            setStatus(null)
            return
        }

        const pollStatus = async () => {
            try {
                const result = await service.getBatchStatus(batchId)
                setStatus(result)

                // Check if installation is complete
                if (result.state === 'installed' || result.state === 'error') {
                    setTimeout(() => {
                        onComplete()
                    }, 2000)
                }
            } catch (error) {
                console.error('Failed to get batch status:', error)
            }
        }

        // Poll every 3 seconds
        pollStatus()
        const interval = setInterval(pollStatus, 3000)

        return () => clearInterval(interval)
    }, [batchId])

    if (!status || !batchId) {
        return null
    }

    const getStateDisplay = (state: string): string => {
        switch (state) {
            case 'pending':
                return 'Pending'
            case 'in_progress':
                return 'In Progress'
            case 'installed':
                return 'Completed'
            case 'error':
                return 'Error'
            default:
                return state
        }
    }

    const getStateClass = (state: string): string => {
        switch (state) {
            case 'installed':
                return 'success'
            case 'error':
                return 'error'
            case 'in_progress':
                return 'progress'
            default:
                return 'pending'
        }
    }

    return (
        <div className={`progress-tracker ${getStateClass(status.state)}`}>
            <div className="progress-header">
                <h3>Installation Progress</h3>
                <span className={`state-badge ${getStateClass(status.state)}`}>{getStateDisplay(status.state)}</span>
            </div>

            <div className="progress-details">
                <div className="progress-bar-container">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${status.progress}%` }}></div>
                    </div>
                    <span className="progress-text">
                        {status.completed_apps} of {status.total_apps} apps completed ({status.progress}%)
                    </span>
                </div>

                {status.error_message && (
                    <div className="error-details">
                        <strong>Error:</strong> {status.error_message}
                    </div>
                )}

                <div className="progress-links">
                    <a href={service.getBatchInstallUrl(batchId)} target="_blank" rel="noopener noreferrer">
                        View Batch Install Plan
                    </a>
                    {executionTrackerId && (
                        <>
                            <span className="separator">•</span>
                            <a
                                href={service.getExecutionTrackerUrl(executionTrackerId)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View Execution Tracker
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
