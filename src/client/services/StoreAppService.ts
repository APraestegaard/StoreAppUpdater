import { StoreApp, BatchInstallResponse, BatchStatusResponse, UpdateCheckResponse, BatchInProgressResponse } from '../types'

export class StoreAppService {
    private scriptInclude = 'x_1118332_store_ap.StoreAppManager'

    /**
     * Get all store apps that need updates
     */
    async getAppsNeedingUpdate(): Promise<StoreApp[]> {
        return new Promise((resolve, reject) => {
            const ga = new GlideAjax(this.scriptInclude)
            ga.addParam('sysparm_name', 'getAppsNeedingUpdate')
            ga.getXMLAnswer((response: string) => {
                try {
                    const apps = JSON.parse(response)
                    resolve(apps)
                } catch (e) {
                    reject(new Error('Failed to parse apps response'))
                }
            })
        })
    }

    /**
     * Check for available updates from the ServiceNow store
     */
    async checkForUpdates(): Promise<UpdateCheckResponse> {
        return new Promise((resolve, reject) => {
            const ga = new GlideAjax(this.scriptInclude)
            ga.addParam('sysparm_name', 'checkForUpdates')
            ga.getXMLAnswer((response: string) => {
                try {
                    const result = JSON.parse(response)
                    resolve(result)
                } catch (e) {
                    reject(new Error('Failed to check for updates'))
                }
            })
        })
    }

    /**
     * Check if there's a batch installation in progress
     */
    async checkBatchInProgress(): Promise<BatchInProgressResponse> {
        return new Promise((resolve, reject) => {
            const ga = new GlideAjax(this.scriptInclude)
            ga.addParam('sysparm_name', 'checkBatchInProgress')
            ga.getXMLAnswer((response: string) => {
                try {
                    resolve(JSON.parse(response))
                } catch (e) {
                    reject(new Error('Failed to parse batch status response'))
                }
            })
        })
    }

    /**
     * Update selected apps in batch
     * @param apps - Array of StoreApp objects to update
     * @param loadDemoData - Whether to load demo data during install
     */
    async updateSelectedApps(apps: StoreApp[], loadDemoData: boolean): Promise<BatchInstallResponse> {
        return new Promise((resolve, reject) => {
            const ga = new GlideAjax(this.scriptInclude)
            ga.addParam('sysparm_name', 'updateSelectedApps')
            ga.addParam('sysparm_apps_data', JSON.stringify(apps))
            ga.addParam('sysparm_load_demo_data', loadDemoData.toString())
            ga.getXMLAnswer((response: string) => {
                try {
                    const result = JSON.parse(response)
                    resolve(result)
                } catch (e) {
                    reject(new Error('Failed to update apps'))
                }
            })
        })
    }

    /**
     * Get batch installation status
     * @param batchId - sys_batch_install_plan sys_id
     */
    async getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
        return new Promise((resolve, reject) => {
            const ga = new GlideAjax(this.scriptInclude)
            ga.addParam('sysparm_name', 'getBatchStatus')
            ga.addParam('sysparm_batch_id', batchId)
            ga.getXMLAnswer((response: string) => {
                try {
                    const result = JSON.parse(response)
                    resolve(result)
                } catch (e) {
                    reject(new Error('Failed to get batch status'))
                }
            })
        })
    }

    /**
     * Get batch installation history
     */
    async getBatchHistory(): Promise<import('../types').BatchHistory[]> {
        return new Promise((resolve, reject) => {
            const ga = new GlideAjax(this.scriptInclude)
            ga.addParam('sysparm_name', 'getBatchHistory')
            ga.getXMLAnswer((response: string) => {
                try {
                    const result = JSON.parse(response)
                    resolve(result)
                } catch (e) {
                    reject(new Error('Failed to get batch history'))
                }
            })
        })
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
