import { useState, useCallback, useEffect } from 'react'
import { storeAppService } from '../services/StoreAppService'
import { useInterval } from './useInterval'
import { TIMING } from '../constants'

interface BatchInProgress {
  inProgress: boolean
  batchName?: string
  state?: string
  link?: string
  batchId?: string
}

interface UseBatchStatusReturn {
  batchInProgress: BatchInProgress | null
  checkForBatchInProgress: () => Promise<void>
}

/**
 * Custom hook for managing batch installation status
 */
export function useBatchStatus(): UseBatchStatusReturn {
  const [batchInProgress, setBatchInProgress] = useState<BatchInProgress | null>(null)

  const checkForBatchInProgress = useCallback(async () => {
    try {
      const status = await storeAppService.checkBatchInProgress()
      if (status.inProgress) {
        setBatchInProgress({
          inProgress: true,
          batchName: status.batchName,
          state: status.state,
          link: status.link,
          batchId: status.batchId,
        })
      } else {
        setBatchInProgress(null)
      }
    } catch (err) {
      // Error handled silently - batch status is non-critical
      console.error('[useBatchStatus] Failed to check batch status:', err)
    }
  }, [])

  return {
    batchInProgress,
    checkForBatchInProgress,
  }
}
