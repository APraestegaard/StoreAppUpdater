import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { StoreApp } from './types'
import { storeAppService } from './services/StoreAppService'
import { useAppList, useBatchStatus, useMessages } from './hooks'
import { ERROR_MESSAGES, SUCCESS_MESSAGES, TIMING } from './constants'
import AppListTable from './components/AppListTable'
import ActionBar from './components/ActionBar'
import ProgressTracker from './components/ProgressTracker'
import ConfirmationModal from './components/ConfirmationModal'
import ConfirmationAlertModal from './components/ConfirmationAlertModal'
import BatchHistory from './components/BatchHistory'
import SkeletonTable from './components/SkeletonTable'
import './app.css'

export default function App() {
    // Use custom hooks for state management
    const { apps, loading, error: appsError, loadApps, refreshApps } = useAppList()
    const { batchInProgress, checkForBatchInProgress } = useBatchStatus()
    const { error, success, setError, setSuccess, dismissMessages } = useMessages()

    // Local state
    const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set())
    const [isUpdating, setIsUpdating] = useState(false)
    const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [batchId, setBatchId] = useState<string | null>(null)
    const [executionTrackerId, setExecutionTrackerId] = useState<string | null>(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [pendingUpdateApps, setPendingUpdateApps] = useState<StoreApp[]>([])
    const [showUnavailableApps, setShowUnavailableApps] = useState(false)
    const [showCheckUpdatesConfirm, setShowCheckUpdatesConfirm] = useState(false)
    const [batchHistoryRefreshTrigger, setBatchHistoryRefreshTrigger] = useState(0)

    // Initialize and check for batch in progress
    useEffect(() => {
        void loadApps()
        void checkForBatchInProgress()
    }, [loadApps, checkForBatchInProgress])

    // Show apps error if it exists
    useEffect(() => {
        if (appsError) {
            setError(appsError)
        }
    }, [appsError, setError])

    // Memoized handlers
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        setSelectedApps(new Set()) // Clear selections on refresh
        await refreshApps()
        setIsRefreshing(false)
        setBatchHistoryRefreshTrigger(prev => prev + 1)
    }, [refreshApps])

    const handleSelectApp = useCallback((sysId: string, selected: boolean) => {
        setSelectedApps((prev) => {
            const newSet = new Set(prev)
            if (selected) {
                newSet.add(sysId)
            } else {
                newSet.delete(sysId)
            }
            return newSet
        })
    }, [])

    const handleSelectAll = useCallback((selected: boolean) => {
        if (selected) {
            setSelectedApps(new Set(apps.map((app) => app.sys_id)))
        } else {
            setSelectedApps(new Set())
        }
    }, [apps])

    const handleUpdateSelected = useCallback(async () => {
        if (selectedApps.size === 0) return

        // Check for in-progress batch
        await checkForBatchInProgress()
        if (batchInProgress?.inProgress) {
            setError(ERROR_MESSAGES.BATCH_IN_PROGRESS(
                batchInProgress.batchName || 'Batch Installation',
                batchInProgress.state || 'in progress'
            ))
            return
        }

        // Get full app objects for selected apps and show confirmation modal
        const selectedAppObjects = apps.filter((app) => selectedApps.has(app.sys_id))
        setPendingUpdateApps(selectedAppObjects)
        setShowConfirmModal(true)
    }, [selectedApps, apps, batchInProgress, checkForBatchInProgress, setError])

    const handleConfirmUpdate = useCallback(async () => {
        setShowConfirmModal(false)
        
        try {
            // Optimistic UI update
            setIsUpdating(true)
            setError(null)
            setSuccess(null)

            // Show immediate feedback
            setSuccess(SUCCESS_MESSAGES.UPDATE_STARTED(pendingUpdateApps.length))

            const result = await storeAppService.updateSelectedApps(pendingUpdateApps, false)

            if (result.success) {
                setBatchId(result.batch_installation_id)
                setExecutionTrackerId(result.execution_tracker_id)
                setPendingUpdateApps([])
                setSelectedApps(new Set()) // Clear selections after successful update
                // Success message already shown above
            } else {
                setError(result.error || ERROR_MESSAGES.UPDATE_APPS_FAILED)
                setIsUpdating(false)
            }
        } catch (err) {
            console.error('[App] Update failed:', err)
            setError(ERROR_MESSAGES.UPDATE_APPS_FAILED)
            setIsUpdating(false)
        }
    }, [pendingUpdateApps, setError, setSuccess])

    const handleCancelUpdate = useCallback(() => {
        setShowConfirmModal(false)
        setPendingUpdateApps([])
    }, [])

    const handleUpdateAll = useCallback(async () => {
        // Show confirmation modal with all available apps (exclude unavailable ones)
        setPendingUpdateApps(apps.filter(app => !app.is_unavailable))
        setShowConfirmModal(true)
    }, [apps])

    const handleCheckUpdates = useCallback(async () => {
        setShowCheckUpdatesConfirm(true)
    }, [])

    const handleConfirmCheckUpdates = useCallback(async () => {
        setShowCheckUpdatesConfirm(false)

        try {
            setIsCheckingUpdates(true)
            setError(null)
            setSuccess(null)

            const result = await storeAppService.checkForUpdates()

            if (result.success) {
                setSuccess(result.message)
                // Refresh the list after checking for updates
                setTimeout(() => {
                    void loadApps()
                }, TIMING.REFRESH_AFTER_UPDATE_DELAY)
            } else {
                setError(result.message || ERROR_MESSAGES.CHECK_UPDATES_FAILED)
            }
        } catch (err) {
            console.error('[App] Check updates failed:', err)
            setError(ERROR_MESSAGES.CHECK_UPDATES_FAILED)
        } finally {
            setIsCheckingUpdates(false)
        }
    }, [loadApps, setError, setSuccess])

    const handleProgressComplete = useCallback(() => {
        setIsUpdating(false)
        setSuccess(SUCCESS_MESSAGES.UPDATE_COMPLETED)
        // Keep the progress tracker visible for 3 more seconds before clearing
        setTimeout(() => {
            setBatchId(null)
            setExecutionTrackerId(null)
            setSelectedApps(new Set()) // Clear selections when update completes
            void loadApps()
            setBatchHistoryRefreshTrigger(prev => prev + 1)
        }, TIMING.REFRESH_AFTER_UPDATE_DELAY)
    }, [loadApps, setSuccess])

    const handleCancelBatch = useCallback(async () => {
        const currentBatchId = batchId || batchInProgress?.batchId
        if (!currentBatchId) return

        try {
            const result = await storeAppService.cancelBatchInstallation(currentBatchId)
            if (result.success) {
                setSuccess(result.message || SUCCESS_MESSAGES.BATCH_CANCELLED)
                setBatchId(null)
                setExecutionTrackerId(null)
                await checkForBatchInProgress()
                setIsUpdating(false)
                void loadApps()
                setBatchHistoryRefreshTrigger(prev => prev + 1)
            } else {
                setError(result.message || ERROR_MESSAGES.CANCEL_BATCH_FAILED)
            }
        } catch (err) {
            console.error('[App] Cancel batch failed:', err)
            setError(ERROR_MESSAGES.CANCEL_BATCH_FAILED)
        }
    }, [batchId, batchInProgress, loadApps, checkForBatchInProgress, setError, setSuccess])

    const unavailableCount = useMemo(() => {
        return apps.filter(app => app.is_unavailable).length
    }, [apps])

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <h1>Store App Update Manager</h1>
                    <p className="subtitle">Bulk update ServiceNow store applications</p>
                    <p className="author-credit">
                        Created by <a href="https://www.linkedin.com/in/danielaagrenmadsen/da/" target="_blank" rel="noopener noreferrer">Daniel Aagren Seehartrai Madsen</a> • ServiceNow Rising Star 2025
                    </p>
                </div>
            </header>

            <main className="app-content">
                {/* Confirmation Modal for app updates */}
                <ConfirmationModal
                    apps={pendingUpdateApps}
                    onConfirm={handleConfirmUpdate}
                    onCancel={handleCancelUpdate}
                    isVisible={showConfirmModal}
                />
                
                {/* Confirmation Alert Modal for check updates */}
                <ConfirmationAlertModal
                    title="Check for Updates"
                    message="Checking for updates may take several minutes. The page will remain responsive. Continue?"
                    onConfirm={handleConfirmCheckUpdates}
                    onCancel={() => setShowCheckUpdatesConfirm(false)}
                    isVisible={showCheckUpdatesConfirm}
                    confirmText="Check for Updates"
                    cancelText="Cancel"
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
                        onCancel={handleCancelBatch}
                    />
                )}

                {error && (
                    <div className="message error">
                        <span className="message-icon">⚠</span>
                        <span className="message-text">{error}</span>
                        <button className="message-close" onClick={dismissMessages} type="button" aria-label="Dismiss error message">
                            ×
                        </button>
                    </div>
                )}

                {success && (
                    <div className="message success">
                        <span className="message-icon">✓</span>
                        <span className="message-text">{success}</span>
                        <button className="message-close" onClick={dismissMessages} type="button" aria-label="Dismiss success message">
                            ×
                        </button>
                    </div>
                )}

                <ActionBar
                    appsCount={apps.filter(app => !app.is_unavailable).length}
                    selectedCount={selectedApps.size}
                    isUpdating={isUpdating || batchInProgress?.inProgress || false}
                    isCheckingUpdates={isCheckingUpdates}
                    isRefreshing={isRefreshing}
                    onUpdateSelected={handleUpdateSelected}
                    onUpdateAll={handleUpdateAll}
                    onCheckUpdates={handleCheckUpdates}
                    onRefresh={handleRefresh}
                    unavailableCount={unavailableCount}
                    showUnavailableApps={showUnavailableApps}
                    onToggleUnavailable={setShowUnavailableApps}
                />

                {loading ? (
                    <SkeletonTable rows={10} />
                ) : (
                    <>
                        <AppListTable
                            apps={apps}
                            selectedApps={selectedApps}
                            onSelectApp={handleSelectApp}
                            onSelectAll={handleSelectAll}
                            showUnavailableApps={showUnavailableApps}
                        />
                        
                        <BatchHistory refreshTrigger={batchHistoryRefreshTrigger} />
                    </>
                )}
            </main>
        </div>
    )
}
