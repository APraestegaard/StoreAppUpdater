import { useState, useCallback } from 'react'
import { useAutoHideMessage } from './useAutoHideMessage'
import { TIMING } from '../constants'

interface UseMessagesReturn {
  error: string | null
  success: string | null
  setError: (message: string | null) => void
  setSuccess: (message: string | null) => void
  dismissMessages: () => void
}

/**
 * Custom hook for managing error and success messages with auto-dismiss
 */
export function useMessages(): UseMessagesReturn {
  const [error, setErrorState] = useState<string | null>(null)
  const [success, setSuccessState] = useState<string | null>(null)

  const setError = useCallback((message: string | null) => {
    setErrorState(message)
    if (message) {
      setSuccessState(null) // Clear success when showing error
    }
  }, [])

  const setSuccess = useCallback((message: string | null) => {
    setSuccessState(message)
    if (message) {
      setErrorState(null) // Clear error when showing success
    }
  }, [])

  const dismissMessages = useCallback(() => {
    setErrorState(null)
    setSuccessState(null)
  }, [])

  // Auto-hide messages after timeout
  useAutoHideMessage(error, TIMING.ERROR_MESSAGE_DURATION, () => setErrorState(null))
  useAutoHideMessage(success, TIMING.SUCCESS_MESSAGE_DURATION, () => setSuccessState(null))

  return {
    error,
    success,
    setError,
    setSuccess,
    dismissMessages,
  }
}
