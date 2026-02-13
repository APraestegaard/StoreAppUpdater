import React, { useEffect, useState, useMemo, memo, useCallback } from 'react'
import { BatchStatusResponse } from '../types'
import { storeAppService } from '../services/StoreAppService'
import { useInterval } from '../hooks'
import { TIMING, BATCH_STATES } from '../constants'

interface ProgressTrackerProps {
    batchId: string | null
    executionTrackerId: string | null
    mode: 'user-initiated' | 'detected'
    onComplete: () => void
    onCancel?: () => void
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
            return 'Error'
        case 'invalid':
            return 'Invalid'
        case 'partial_install':
            return 'Partially Installed'
        case 'cancelled':
            return 'Cancelled'
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
        case 'cancelled':
            return 'warning'
        case 'in_progress':
            return 'progress'
        case 'ready':
            return 'progress'
        default:
            return 'pending'
    }
}

const ProgressTracker = memo(function ProgressTracker({ batchId, executionTrackerId, mode, onComplete, onCancel }: ProgressTrackerProps) {
    const [status, setStatus] = useState<BatchStatusResponse | null>(null)

    const pollStatus = useCallback(async () => {
        if (!batchId) {
            setStatus(null)
            return
        }

        try {
            const result = await storeAppService.getBatchStatus(batchId)
            setStatus(result)

            // Only call onComplete for user-initiated batches
            // Detected batches should not trigger auto-refresh
            // Terminal states: installed, error, invalid, partial_install
            const terminalStates = [
                BATCH_STATES.INSTALLED,
                BATCH_STATES.ERROR,
                BATCH_STATES.INVALID,
                BATCH_STATES.PARTIAL_INSTALL
            ]

            if (mode === 'user-initiated' && terminalStates.includes(result.state as any)) {
                setTimeout(() => {
                    onComplete()
                }, TIMING.PROGRESS_COMPLETE_DELAY)
            }
        } catch (error) {
            console.error('[ProgressTracker] Status polling error:', error)
            // Status polling error handled silently - will retry on next interval
        }
    }, [batchId, mode, onComplete])

    // Poll immediately on mount and when batchId changes
    useEffect(() => {
        if (batchId) {
            pollStatus()
        } else {
            setStatus(null)
        }
    }, [batchId, pollStatus])

    // Poll every 3 seconds using custom hook
    useInterval(pollStatus, batchId ? TIMING.BATCH_POLL_INTERVAL : null)

    if (!status || !batchId) {
        return null
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

            {status.state === 'cancelled' && (
                <div className="warning-details">
                    <strong>🚫 Installation Cancelled:</strong> The batch installation was cancelled. Some applications may have been partially updated.
                </div>
            )}

            <div className="progress-details">
                {status.state === 'ready' ? (
                    <div className="preparing-message">
                        <div className="loading-spinner"></div>
                        <span className="preparing-text">
                            {status.total_apps > 0 
                                ? `Preparing batch installation... This may take a few minutes. (${status.total_apps} application${status.total_apps !== 1 ? 's' : ''} loaded)`
                                : 'Preparing batch installation... This may take a few minutes.'}
                        </span>
                    </div>
                ) : (
                    <div className="progress-bar-container">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${status.progress}%` }}></div>
                        </div>
                        <span className="progress-text">
                            {status.completed_apps} of {status.total_apps} apps completed ({status.progress}%)
                        </span>
                        {status.current_app_display && status.state === 'in_progress' && (
                            <div className="current-app-info">
                                <div className="loading-spinner small"></div>
                                <span>Currently updating: <strong>{status.current_app_display}</strong></span>
                            </div>
                        )}
                    </div>
                )}

                {status.error_message && (
                    <div className="error-details">
                        <strong>Error:</strong> {status.error_message}
                    </div>
                )}

                <div className="progress-links">
                    <a href={storeAppService.getBatchInstallUrl(batchId)} target="_blank" rel="noopener noreferrer">
                        View Batch Install Plan
                    </a>
                    {executionTrackerId && (
                        <>
                            <span className="separator">•</span>
                            <a
                                href={storeAppService.getExecutionTrackerUrl(executionTrackerId)}
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
})

export default ProgressTracker
