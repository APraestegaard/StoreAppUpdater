import React, { useEffect, useState } from 'react'
import { BatchStatusResponse } from '../types'
import { StoreAppService } from '../services/StoreAppService'

interface ProgressTrackerProps {
    batchId: string | null
    executionTrackerId: string | null
    mode: 'user-initiated' | 'detected'
    onComplete: () => void
}

export default function ProgressTracker({ batchId, executionTrackerId, mode, onComplete }: ProgressTrackerProps) {
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
                console.log('ProgressTracker - Poll result:', result)
                setStatus(result)

                // Only call onComplete for user-initiated batches
                // Detected batches should not trigger auto-refresh
                // Terminal states: installed, error, invalid, partial_install
                if (mode === 'user-initiated' && (result.state === 'installed' || result.state === 'error' || result.state === 'invalid' || result.state === 'partial_install')) {
                    console.log('ProgressTracker - Batch completed with state:', result.state, ', calling onComplete in 2 seconds')
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
            case 'invalid':
                return 'Invalid'
            case 'partial_install':
                return 'Partially Installed'
            default:
                return state
        }
    }

    const getStateClass = (state: string): string => {
        switch (state) {
            case 'installed':
                return 'success'
            case 'error':
            case 'invalid':
                return 'error'
            case 'partial_install':
                return 'warning'
            case 'in_progress':
                return 'progress'
            default:
                return 'pending'
        }
    }

    return (
        <div className={`progress-tracker ${getStateClass(status.state)}`}>
            <div className="progress-header">
                <h3>
                    {mode === 'detected' ? '🔍 ' : ''}Installation Progress
                    {mode === 'detected' && <span className="detected-badge">(Detected)</span>}
                </h3>
                <span className={`state-badge ${getStateClass(status.state)}`}>{getStateDisplay(status.state)}</span>
            </div>

            {mode === 'detected' && status.state === 'installed' && (
                <div className="completion-notice">
                    <span className="message-icon">✓</span>
                    <span>Batch installation completed. Refresh the page to see updated applications.</span>
                </div>
            )}

            {status.state === 'invalid' && (
                <div className="error-details">
                    <strong>⚠️ Installation Invalid:</strong> The batch did not install as expected. Please try again or check the batch installation plan for details.
                </div>
            )}

            {status.state === 'partial_install' && (
                <div className="warning-details">
                    <strong>⚠️ Partial Installation:</strong> Some applications were installed successfully, but others failed. Check the batch installation plan for details on which applications need to be retried.
                </div>
            )}

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
