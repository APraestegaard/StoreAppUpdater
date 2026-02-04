import React from 'react'

interface ConfirmationAlertModalProps {
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
    isVisible: boolean
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
}

export default function ConfirmationAlertModal({
    title,
    message,
    onConfirm,
    onCancel,
    isVisible,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false
}: ConfirmationAlertModalProps) {
    if (!isVisible) return null

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onCancel} aria-label="Close">
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    <p className="modal-message">{message}</p>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button 
                        className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'}`} 
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
