import { useEffect, useRef } from 'react'

/**
 * Automatically hides a message after a specified duration
 * @param message - The message to auto-hide (or null if no message)
 * @param duration - Duration in milliseconds before hiding
 * @param onHide - Callback to hide the message
 */
export function useAutoHideMessage(
  message: string | null,
  duration: number,
  onHide: () => void
): void {
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (message) {
      timeoutRef.current = setTimeout(() => {
        onHide()
      }, duration)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [message, duration, onHide])
}
