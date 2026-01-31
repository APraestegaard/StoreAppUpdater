import React, { useState, useEffect, useMemo } from 'react'
import { StoreApp } from './types'
import { StoreAppService } from './services/StoreAppService'
import AppListTable from './components/AppListTable'
import ActionBar from './components/ActionBar'
import ProgressTracker from './components/ProgressTracker'
import ConfirmationModal from './components/ConfirmationModal'
import BatchHistory from './components/BatchHistory'
import './app.css'

export default function App() {
    const [apps, setApps] = useState<StoreApp[]>([])
    const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [batchId, setBatchId] = useState<string | null>(null)
    const [executionTrackerId, setExecutionTrackerId] = useState<string | null>(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [pendingUpdateApps, setPendingUpdateApps] = useState<StoreApp[]>([])
    const [batchInProgress, setBatchInProgress] = useState<{
        inProgress: boolean
        batchName?: string
        state?: string
        link?: string
        batchId?: string
    } | null>(null)

    const service = useMemo(() => new StoreAppService(), [])

    const loadApps = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await service.getAppsNeedingUpdate()
            setApps(data)
            setSelectedApps(new Set()) // Clear selections on refresh
        } catch (err) {
            setError('Failed to load applications. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadApps()
        void checkForBatchInProgress()
    }, [])

    const checkForBatchInProgress = async () => {
        try {
            const status = await service.checkBatchInProgress()
            if (status.inProgress) {
                setBatchInProgress({
                    inProgress: true,
                    batchName: status.batchName,
                    state: status.state,
                    link: status.link,
                    batchId: status.batchId
                })
            } else {
                setBatchInProgress(null)
            }
        } catch (err) {
            // Error handled silently - batch status is non-critical
        }
    }

    const handleSelectApp = (sysId: string, selected: boolean) => {
        setSelectedApps((prev) => {
            const newSet = new Set(prev)
            if (selected) {
                newSet.add(sysId)
            } else {
                newSet.delete(sysId)
            }
            return newSet
        })
    }

    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            setSelectedApps(new Set(apps.map((app) => app.sys_id)))
        } else {
            setSelectedApps(new Set())
        }
    }

    const handleUpdateSelected = async () => {
        if (selectedApps.size === 0) return

        // Check for in-progress batch
        await checkForBatchInProgress()
        if (batchInProgress?.inProgress) {
            setError(`Cannot start new update: Batch installation "${batchInProgress.batchName}" is currently ${batchInProgress.state}. Please wait for it to complete.`)
            return
        }

        // Get full app objects for selected apps and show confirmation modal
        const selectedAppObjects = apps.filter((app) => selectedApps.has(app.sys_id))
        setPendingUpdateApps(selectedAppObjects)
        setShowConfirmModal(true)
    }

    const handleConfirmUpdate = async () => {
        setShowConfirmModal(false)
        
        try {
            setIsUpdating(true)
            setError(null)
            setSuccess(null)

            const result = await service.updateSelectedApps(pendingUpdateApps, false)

            if (result.success) {
                setBatchId(result.batch_installation_id)
                setExecutionTrackerId(result.execution_tracker_id)
                setSuccess(
                    `Update batch created successfully! ${pendingUpdateApps.length} application(s) will be updated. Check progress above.`
                )
                setPendingUpdateApps([])
            } else {
                setError(result.error || 'Failed to start update process')
                setIsUpdating(false)
            }
        } catch (err) {
            setError('Failed to update applications. Please try again.')
            setIsUpdating(false)
        }
    }

    const handleCancelUpdate = () => {
        setShowConfirmModal(false)
        setPendingUpdateApps([])
    }

    const handleUpdateAll = async () => {
        // Show confirmation modal with all apps
        setPendingUpdateApps(apps)
        setShowConfirmModal(true)
    }

    const handleCheckUpdates = async () => {
        if (
            !confirm(
                'Checking for updates may take several minutes. The page will remain responsive. Continue?'
            )
        ) {
            return
        }

        try {
            setIsCheckingUpdates(true)
            setError(null)
            setSuccess(null)

            const result = await service.checkForUpdates()

            if (result.success) {
                setSuccess(result.message)
                // Refresh the list after checking for updates
                setTimeout(() => {
                    void loadApps()
                }, 2000)
            } else {
                setError(result.message || 'Failed to check for updates')
            }
        } catch (err) {
            setError('Failed to check for updates. Please try again.')
        } finally {
            setIsCheckingUpdates(false)
        }
    }

    const handleProgressComplete = () => {
        setIsUpdating(false)
        setSuccess('Installation completed! Refreshing application list...')
        // Keep the progress tracker visible for 3 more seconds before clearing
        setTimeout(() => {
            setBatchId(null)
            setExecutionTrackerId(null)
            void loadApps()
        }, 3000)
    }

    const dismissMessage = () => {
        setError(null)
        setSuccess(null)
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <h1>Store App Update Manager</h1>
                    <p className="subtitle">Manage and update ServiceNow store applications</p>
                    <p className="author-credit">
                        Created by <a href="https://www.linkedin.com/in/danielaagrenmadsen/da/" target="_blank" rel="noopener noreferrer">Daniel Aagren Seehartrai Madsen</a> • ServiceNow Rising Star 2025
                    </p>
                </div>
            </header>

            <main className="app-content">
                {/* Confirmation Modal */}
                <ConfirmationModal
                    apps={pendingUpdateApps}
                    onConfirm={handleConfirmUpdate}
                    onCancel={handleCancelUpdate}
                    isVisible={showConfirmModal}
                />
                
                {batchInProgress?.inProgress && (
                    <div className="info-message">
                        <strong>ℹ️ Batch Installation In Progress:</strong> "{batchInProgress.batchName}" is currently {batchInProgress.state}. 
                        New updates are disabled until it completes.
                    </div>
                )}

                {(batchId || batchInProgress?.batchId) && (
                    <ProgressTracker 
                        batchId={batchId || batchInProgress?.batchId || null} 
                        executionTrackerId={executionTrackerId} 
                        mode={batchId ? 'user-initiated' : 'detected'}
                        onComplete={handleProgressComplete} 
                    />
                )}

                {error && (
                    <div className="message error">
                        <span className="message-icon">⚠</span>
                        <span className="message-text">{error}</span>
                        <button className="message-close" onClick={dismissMessage}>
                            ×
                        </button>
                    </div>
                )}

                {success && (
                    <div className="message success">
                        <span className="message-icon">✓</span>
                        <span className="message-text">{success}</span>
                        <button className="message-close" onClick={dismissMessage}>
                            ×
                        </button>
                    </div>
                )}

                <ActionBar
                    appsCount={apps.length}
                    selectedCount={selectedApps.size}
                    isUpdating={isUpdating || batchInProgress?.inProgress || false}
                    isCheckingUpdates={isCheckingUpdates}
                    onUpdateSelected={handleUpdateSelected}
                    onUpdateAll={handleUpdateAll}
                    onCheckUpdates={handleCheckUpdates}
                    onRefresh={loadApps}
                />

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading applications...</p>
                    </div>
                ) : (
                    <>
                        <AppListTable
                            apps={apps}
                            selectedApps={selectedApps}
                            onSelectApp={handleSelectApp}
                            onSelectAll={handleSelectAll}
                        />
                        
                        <BatchHistory />
                    </>
                )}
            </main>
        </div>
    )
}
