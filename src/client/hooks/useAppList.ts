import { useState, useCallback } from 'react'
import { StoreApp } from '../types'
import { storeAppService } from '../services/StoreAppService'
import { ERROR_MESSAGES } from '../constants'

interface UseAppListReturn {
  apps: StoreApp[]
  loading: boolean
  error: string | null
  loadApps: () => Promise<void>
  refreshApps: () => Promise<void>
}

/**
 * Custom hook for managing the app list state
 */
export function useAppList(): UseAppListReturn {
  const [apps, setApps] = useState<StoreApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadApps = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await storeAppService.getAppsNeedingUpdate()
      setApps(data)
    } catch (err) {
      console.error('[useAppList] Failed to load apps:', err)
      setError(ERROR_MESSAGES.LOAD_APPS_FAILED)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshApps = useCallback(async () => {
    await loadApps()
  }, [loadApps])

  return {
    apps,
    loading,
    error,
    loadApps,
    refreshApps,
  }
}
