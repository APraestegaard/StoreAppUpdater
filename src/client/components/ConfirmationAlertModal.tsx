import React, { useEffect, useRef } from 'react'

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
            aria-labelledby="alert-modal-title"
        >
            <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()}
                role="document"
            >
                <div className="modal-header">
                    <h2 id="alert-modal-title">{title}</h2>
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
                    <p className="modal-message">{message}</p>
                </div>

                <div className="modal-footer">
                    <button 
                        className="btn btn-secondary" 
                        onClick={onCancel}
                        type="button"
                    >
                        {cancelText}
                    </button>
                    <button 
                        ref={confirmButtonRef}
                        className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'}`} 
                        onClick={onConfirm}
                        type="button"
                        autoFocus
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
