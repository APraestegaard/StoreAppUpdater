import React, { useState, useEffect, useMemo } from 'react'
import { StoreApp } from './types'
import { StoreAppService } from './services/StoreAppService'
import AppListTable from './components/AppListTable'
import ActionBar from './components/ActionBar'
import ProgressTracker from './components/ProgressTracker'
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
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadApps()
    }, [])

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

        if (!confirm(`Are you sure you want to update ${selectedApps.size} application(s)?`)) {
            return
        }

        try {
            setIsUpdating(true)
            setError(null)
            setSuccess(null)

            const appIds = Array.from(selectedApps)
            const result = await service.updateSelectedApps(appIds, false)

            if (result.success) {
                setBatchId(result.batch_installation_id)
                setExecutionTrackerId(result.execution_tracker_id)
                setSuccess(
                    `Update batch created successfully! ${selectedApps.size} application(s) will be updated. Check progress below.`
                )
            } else {
                setError(result.error || 'Failed to start update process')
                setIsUpdating(false)
            }
        } catch (err) {
            setError('Failed to update applications. Please try again.')
            console.error(err)
            setIsUpdating(false)
        }
    }

    const handleUpdateAll = async () => {
        if (apps.length === 0) return

        if (!confirm(`Are you sure you want to update all ${apps.length} application(s)?`)) {
            return
        }

        try {
            setIsUpdating(true)
            setError(null)
            setSuccess(null)

            const appIds = apps.map((app) => app.sys_id)
            const result = await service.updateSelectedApps(appIds, false)

            if (result.success) {
                setBatchId(result.batch_installation_id)
                setExecutionTrackerId(result.execution_tracker_id)
                setSuccess(
                    `Update batch created successfully! All ${apps.length} application(s) will be updated. Check progress below.`
                )
            } else {
                setError(result.error || 'Failed to start update process')
                setIsUpdating(false)
            }
        } catch (err) {
            setError('Failed to update applications. Please try again.')
            console.error(err)
            setIsUpdating(false)
        }
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
            console.error(err)
        } finally {
            setIsCheckingUpdates(false)
        }
    }

    const handleProgressComplete = () => {
        setIsUpdating(false)
        setBatchId(null)
        setExecutionTrackerId(null)
        setSuccess('Installation completed! Refreshing application list...')
        setTimeout(() => {
            void loadApps()
        }, 2000)
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
                </div>
            </header>

            <main className="app-content">
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

                {batchId && <ProgressTracker batchId={batchId} executionTrackerId={executionTrackerId} onComplete={handleProgressComplete} />}

                <ActionBar
                    appsCount={apps.length}
                    selectedCount={selectedApps.size}
                    isUpdating={isUpdating}
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
                    <AppListTable
                        apps={apps}
                        selectedApps={selectedApps}
                        onSelectApp={handleSelectApp}
                        onSelectAll={handleSelectAll}
                    />
                )}
            </main>
        </div>
    )
}
