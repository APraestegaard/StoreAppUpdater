import React from 'react'
import { StoreApp } from '../types'

interface AppListTableProps {
    apps: StoreApp[]
    selectedApps: Set<string>
    onSelectApp: (sysId: string, selected: boolean) => void
    onSelectAll: (selected: boolean) => void
}

export default function AppListTable({ apps, selectedApps, onSelectApp, onSelectAll }: AppListTableProps) {
    const allSelected = apps.length > 0 && selectedApps.size === apps.length

    const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelectAll(e.target.checked)
    }

    const handleSelectChange = (sysId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelectApp(sysId, e.target.checked)
    }

    if (apps.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">✓</div>
                <h2>All Applications Up to Date</h2>
                <p>All your ServiceNow store applications are running the latest versions.</p>
                <p className="hint">Click "Check for Updates" to refresh from the store.</p>
            </div>
        )
    }

    return (
        <div className="table-container">
            <table className="sn-table">
                <thead>
                    <tr>
                        <th className="checkbox-col">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={handleSelectAllChange}
                                aria-label="Select all apps"
                            />
                        </th>
                        <th>Application Name</th>
                        <th>Current Version</th>
                        <th>Latest Version</th>
                        <th>Vendor</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {apps.map((app) => (
                        <tr key={app.sys_id} className={selectedApps.has(app.sys_id) ? 'selected' : ''}>
                            <td className="checkbox-col">
                                <input
                                    type="checkbox"
                                    checked={selectedApps.has(app.sys_id)}
                                    onChange={handleSelectChange(app.sys_id)}
                                    aria-label={`Select ${app.name}`}
                                />
                            </td>
                            <td className="app-name">{app.name}</td>
                            <td className="version">{app.version}</td>
                            <td className="version latest">{app.latest_version}</td>
                            <td className="vendor">{app.vendor}</td>
                            <td className="status">
                                <span className="status-badge update-available">Update Available</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
