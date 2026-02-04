export interface Indicator {
    id: string
    order: number
    message: string
    tooltip: string
    type: 'error' | 'warning' | 'info'
    show_as_filter: boolean
}

export interface StoreApp {
    sys_id: string
    name: string
    version: string
    latest_version: string
    update_type: 'Major' | 'Minor' | 'Patch'
    vendor: string
    install_date: string
    needs_update: boolean
    indicators: Indicator[]
    is_unavailable: boolean
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
    current_app_name?: string | null
    current_app_display?: string | null
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

export interface BatchHistory {
    sys_id: string
    name: string
    state: string
    sys_created_on: string
    sys_updated_on: string
    notes?: string
    error_message?: string
}

export interface CancelBatchResponse {
    success: boolean
    message?: string
    error?: string
}

export interface ReleaseNotesResponse {
    success: boolean
    version?: string
    short_description?: string
    vendor?: string
    publish_date?: string
    store_link?: string
    app_manager_link?: string
    message?: string
}
