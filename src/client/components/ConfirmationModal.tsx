import React from 'react'
import { StoreApp } from '../types'

interface ConfirmationModalProps {
    apps: StoreApp[]
    onConfirm: () => void
    onCancel: () => void
    isVisible: boolean
}

export default function ConfirmationModal({ apps, onConfirm, onCancel, isVisible }: ConfirmationModalProps) {
    if (!isVisible) return null

    const getUpdateTypeColor = (updateType: string) => {
        switch (updateType) {
            case 'Major':
                return '#dc3545'
            case 'Minor':
                return '#fd7e14'
            case 'Patch':
                return '#28a745'
            default:
                return '#6c757d'
        }
    }

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Confirm Application Updates</h2>
                    <button className="modal-close" onClick={onCancel} aria-label="Close">
                        &times;
                    </button>
                </div>
                
                <div className="modal-body">
                    <p className="modal-intro">
                        You are about to update <strong>{apps.length}</strong> application{apps.length !== 1 ? 's' : ''}:
                    </p>
                    
                    <div className="apps-list">
                        {apps.map((app) => (
                            <div key={app.sys_id} className="app-item">
                                <div className="app-name">{app.name}</div>
                                <div className="app-version-info">
                                    <span className="version-label">Current:</span>
                                    <span className="version-value">{app.version}</span>
                                    <span className="version-arrow">→</span>
                                    <span className="version-label">New:</span>
                                    <span className="version-value">{app.latest_version}</span>
                                    <span 
                                        className="update-type-badge"
                                        style={{ backgroundColor: getUpdateTypeColor(app.update_type) }}
                                    >
                                        {app.update_type}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="modal-warning">
                        <strong>⚠️ Important:</strong> Application updates may take several minutes. 
                        The update process cannot be cancelled once started.
                    </div>
                </div>
                
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={onConfirm}>
                        Confirm and Update
                    </button>
                </div>
            </div>
        </div>
    )
}
