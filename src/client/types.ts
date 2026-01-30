export interface StoreApp {
    sys_id: string
    name: string
    version: string
    latest_version: string
    vendor: string
    install_date: string
    needs_update: boolean
}

export interface BatchInstallResponse {
    batch_installation_id: string
    execution_tracker_id: string
    success: boolean
    error?: string
}

export interface BatchStatusResponse {
    state: string
    progress: number
    total_apps: number
    completed_apps: number
    error_message?: string
}

export interface UpdateCheckResponse {
    success: boolean
    message: string
}

export interface BatchInProgressResponse {
    inProgress: boolean
    batchId?: string
    batchName?: string
    state?: string
    createdOn?: string
    link?: string
    error?: string
}
