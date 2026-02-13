import { useEffect, useRef } from 'react'

/**
 * Custom hook for setInterval with automatic cleanup
 * @param callback - Function to call on each interval
 * @param delay - Delay in milliseconds, or null to pause
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef<() => void>()

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval
  useEffect(() => {
    if (delay === null) {
      return
    }

    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current()
      }
    }

    const id = setInterval(tick, delay)
    return () => clearInterval(id)
  }, [delay])
}
