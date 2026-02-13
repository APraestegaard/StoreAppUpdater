import React, { useEffect, useRef } from 'react'
import { StoreApp } from '../types'

interface ConfirmationModalProps {
    apps: StoreApp[]
    onConfirm: () => void
    onCancel: () => void
    isVisible: boolean
}

const UPDATE_TYPE_COLORS: Record<string, string> = {
    Major: '#dc3545',
    Minor: '#fd7e14',
    Patch: '#28a745',
}

const getUpdateTypeColor = (updateType: string): string => {
    return UPDATE_TYPE_COLORS[updateType] || '#6c757d'
}

export default function ConfirmationModal({ apps, onConfirm, onCancel, isVisible }: ConfirmationModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const confirmButtonRef = useRef<HTMLButtonElement>(null)

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel()
            }
        }

        if (isVisible) {
            document.addEventListener('keydown', handleEscape)
            // Focus the confirm button when modal opens
            setTimeout(() => confirmButtonRef.current?.focus(), 100)
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isVisible, onCancel])

    if (!isVisible) return null

    return (
        <div 
            className="modal-overlay" 
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                ref={modalRef}
                className="modal-content" 
                onClick={(e) => e.stopPropagation()}
                role="document"
            >
                <div className="modal-header">
                    <h2 id="modal-title">Confirm Application Updates</h2>
                    <button 
                        className="modal-close" 
                        onClick={onCancel} 
                        aria-label="Close modal"
                        type="button"
                    >
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
                    <button 
                        className="btn btn-secondary" 
                        onClick={onCancel}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button 
                        ref={confirmButtonRef}
                        className="btn btn-primary" 
                        onClick={onConfirm}
                        type="button"
                        autoFocus
                    >
                        Confirm and Update
                    </button>
                </div>
            </div>
        </div>
    )
}
