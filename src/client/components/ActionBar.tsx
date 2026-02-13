import React, { memo } from 'react'

interface ActionBarProps {
    appsCount: number
    selectedCount: number
    isUpdating: boolean
    isCheckingUpdates: boolean
    isRefreshing: boolean
    onUpdateSelected: () => void
    onUpdateAll: () => void
    onCheckUpdates: () => void
    onRefresh: () => void
    unavailableCount: number
    showUnavailableApps: boolean
    onToggleUnavailable: (show: boolean) => void
}

const ActionBar = memo(function ActionBar({
    appsCount,
    selectedCount,
    isUpdating,
    isCheckingUpdates,
    isRefreshing,
    onUpdateSelected,
    onUpdateAll,
    onCheckUpdates,
    onRefresh,
    unavailableCount,
    showUnavailableApps,
    onToggleUnavailable,
}: ActionBarProps) {
    return (
        <div className="action-bar">
            <div className="action-group">
                <button
                    onClick={onUpdateSelected}
                    disabled={selectedCount === 0 || isUpdating}
                    className="btn btn-primary"
                    title={selectedCount === 0 ? 'Select apps to update' : `Update ${selectedCount} selected app(s)`}
                    type="button"
                >
                    Update Selected {selectedCount > 0 && `(${selectedCount})`}
                </button>
                <button
                    onClick={onUpdateAll}
                    disabled={appsCount === 0 || isUpdating}
                    className="btn btn-primary"
                    title={appsCount === 0 ? 'No apps to update' : `Update all ${appsCount} app(s)`}
                    type="button"
                >
                    Update All {appsCount > 0 && `(${appsCount})`}
                </button>
                <button
                    onClick={onCheckUpdates}
                    disabled={isCheckingUpdates || isUpdating}
                    className="btn btn-secondary"
                    title="Check ServiceNow store for new updates"
                    type="button"
                    aria-busy={isCheckingUpdates}
                >
                    {isCheckingUpdates ? '⟳ Checking...' : 'Check for Updates'}
                </button>
                <button
                    onClick={onRefresh}
                    disabled={isUpdating || isRefreshing}
                    className="btn btn-secondary"
                    title="Refresh app list"
                    type="button"
                    aria-busy={isRefreshing}
                >
                    {isRefreshing ? '⟳ Refreshing...' : 'Refresh'}
                </button>
            </div>
            <div className="action-group filters">
                <label className="toggle-label" title="Show applications that cannot be installed on this instance type">
                    <input
                        type="checkbox"
                        checked={showUnavailableApps}
                        onChange={(e) => onToggleUnavailable(e.target.checked)}
                        className="toggle-input"
                    />
                    Show Unavailable Apps {unavailableCount > 0 && `(${unavailableCount})`}
                </label>
            </div>
        </div>
    )
})

export default ActionBar
