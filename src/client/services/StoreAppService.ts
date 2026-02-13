import { StoreApp, BatchInstallResponse, BatchStatusResponse, UpdateCheckResponse, BatchInProgressResponse, BatchHistory, CancelBatchResponse } from '../types'
import { AJAX_PARAMS } from '../constants'

/**
 * Custom error class for service errors
 */
class ServiceError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly originalError?: unknown
    ) {
        super(message)
        this.name = 'ServiceError'
    }
}

/**
 * Singleton service for Store App management operations
 */
export class StoreAppService {
    private static instance: StoreAppService
    private scriptInclude = 'x_1118332_store_ap.StoreAppManager'

    private constructor() {
        // Private constructor to prevent direct instantiation
    }

    /**
     * Get the singleton instance
     */
    static getInstance(): StoreAppService {
        if (!StoreAppService.instance) {
            StoreAppService.instance = new StoreAppService()
        }
        return StoreAppService.instance
    }

    /**
     * Generic method to make GlideAjax calls with error handling
     */
    private async callGlideAjax<T>(
        methodName: string,
        params?: Record<string, string>
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            try {
                const ga = new GlideAjax(this.scriptInclude)
                ga.addParam(AJAX_PARAMS.NAME, methodName)
                
                if (params) {
                    Object.entries(params).forEach(([key, value]) => {
                        ga.addParam(key, value)
                    })
                }

                ga.getXMLAnswer((response: string) => {
                    try {
                        const result = JSON.parse(response)
                        console.log(`[StoreAppService] ${methodName} response:`, result)
                        resolve(result)
                    } catch (e) {
                        console.error(`[StoreAppService] ${methodName} parse error:`, e)
                        reject(new ServiceError(
                            `Failed to parse response from ${methodName}`,
                            'PARSE_ERROR',
                            e
                        ))
                    }
                })
            } catch (e) {
                console.error(`[StoreAppService] ${methodName} error:`, e)
                reject(new ServiceError(
                    `Failed to execute ${methodName}`,
                    'EXECUTION_ERROR',
                    e
                ))
            }
        })
    }

    /**
     * Get all store apps that need updates
     */
    async getAppsNeedingUpdate(): Promise<StoreApp[]> {
        try {
            const apps = await this.callGlideAjax<StoreApp[]>('getAppsNeedingUpdate')
            return apps
        } catch (e) {
            console.error('[StoreAppService] getAppsNeedingUpdate error:', e)
            throw new ServiceError(
                'Failed to load applications',
                'LOAD_APPS_FAILED',
                e
            )
        }
    }

    /**
     * Check for available updates from the ServiceNow store
     */
    async checkForUpdates(): Promise<UpdateCheckResponse> {
        try {
            return await this.callGlideAjax<UpdateCheckResponse>('checkForUpdates')
        } catch (e) {
            console.error('[StoreAppService] checkForUpdates error:', e)
            throw new ServiceError(
                'Failed to check for updates',
                'CHECK_UPDATES_FAILED',
                e
            )
        }
    }

    /**
     * Check if there's a batch installation in progress
     */
    async checkBatchInProgress(): Promise<BatchInProgressResponse> {
        try {
            return await this.callGlideAjax<BatchInProgressResponse>('checkBatchInProgress')
        } catch (e) {
            console.error('[StoreAppService] checkBatchInProgress error:', e)
            throw new ServiceError(
                'Failed to check batch status',
                'BATCH_STATUS_FAILED',
                e
            )
        }
    }

    /**
     * Update selected apps in batch
     * @param apps - Array of StoreApp objects to update
     * @param loadDemoData - Whether to load demo data during install
     */
    async updateSelectedApps(apps: StoreApp[], loadDemoData: boolean): Promise<BatchInstallResponse> {
        try {
            return await this.callGlideAjax<BatchInstallResponse>('updateSelectedApps', {
                [AJAX_PARAMS.APPS_DATA]: JSON.stringify(apps),
                [AJAX_PARAMS.LOAD_DEMO_DATA]: loadDemoData.toString(),
            })
        } catch (e) {
            console.error('[StoreAppService] updateSelectedApps error:', e)
            throw new ServiceError(
                'Failed to update applications',
                'UPDATE_APPS_FAILED',
                e
            )
        }
    }

    /**
     * Get batch installation status
     * @param batchId - sys_batch_install_plan sys_id
     */
    async getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
        try {
            return await this.callGlideAjax<BatchStatusResponse>('getBatchStatus', {
                [AJAX_PARAMS.BATCH_ID]: batchId,
            })
        } catch (e) {
            console.error('[StoreAppService] getBatchStatus error:', e)
            throw new ServiceError(
                'Failed to get batch status',
                'BATCH_STATUS_FAILED',
                e
            )
        }
    }

    /**
     * Get batch installation history
     */
    async getBatchHistory(): Promise<BatchHistory[]> {
        try {
            return await this.callGlideAjax<BatchHistory[]>('getBatchHistory')
        } catch (e) {
            console.error('[StoreAppService] getBatchHistory error:', e)
            throw new ServiceError(
                'Failed to get batch history',
                'BATCH_HISTORY_FAILED',
                e
            )
        }
    }

    /**
     * Cancel a batch installation
     * @param batchId - sys_batch_install_plan sys_id
     */
    async cancelBatchInstallation(batchId: string): Promise<CancelBatchResponse> {
        try {
            return await this.callGlideAjax<CancelBatchResponse>('cancelBatchInstallation', {
                [AJAX_PARAMS.BATCH_ID]: batchId,
            })
        } catch (e) {
            console.error('[StoreAppService] cancelBatchInstallation error:', e)
            throw new ServiceError(
                'Failed to cancel batch installation',
                'CANCEL_BATCH_FAILED',
                e
            )
        }
    }

    /**
     * Get URL to sys_batch_install_plan record
     */
    getBatchInstallUrl(batchId: string): string {
        return `/nav_to.do?uri=sys_batch_install_plan.do?sys_id=${batchId}`
    }

    /**
     * Get URL to sys_progress_worker record
     */
    getExecutionTrackerUrl(executionTrackerId: string): string {
        return `/nav_to.do?uri=sys_progress_worker.do?sys_id=${executionTrackerId}`
    }
}

// Export singleton instance
export const storeAppService = StoreAppService.getInstance()
