/**
 * Application constants for Store App Update Manager
 */

/**
 * Batch installation states
 */
export const BATCH_STATES = {
  PENDING: 'pending',
  READY: 'ready',
  IN_PROGRESS: 'in_progress',
  INSTALLED: 'installed',
  ERROR: 'error',
  INVALID: 'invalid',
  PARTIAL_INSTALL: 'partial_install',
  CANCELLED: 'cancelled',
} as const

export type BatchState = typeof BATCH_STATES[keyof typeof BATCH_STATES]

/**
 * Update types for applications
 */
export const UPDATE_TYPES = {
  MAJOR: 'Major',
  MINOR: 'Minor',
  PATCH: 'Patch',
} as const

export type UpdateType = typeof UPDATE_TYPES[keyof typeof UPDATE_TYPES]

/**
 * Indicator IDs for app status
 */
export const INDICATOR_IDS = {
  NOT_LICENSED: 'not_licensed',
  NOT_AVAILABLE_FOR_INSTANCE_TYPE: 'not_available_for_instance_type',
  INCOMPATIBLE: 'incompatible',
} as const

/**
 * ServiceNow roles
 */
export const ROLES = {
  ADMIN: 'admin',
} as const

/**
 * Timing constants (in milliseconds)
 */
export const TIMING = {
  SUCCESS_MESSAGE_DURATION: 5000,
  ERROR_MESSAGE_DURATION: 8000,
  BATCH_POLL_INTERVAL: 3000,
  PROGRESS_COMPLETE_DELAY: 2000,
  REFRESH_AFTER_UPDATE_DELAY: 3000,
  DEBOUNCE_SEARCH: 300,
} as const

/**
 * UI constants
 */
export const UI = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_BATCH_HISTORY_ITEMS: 10,
} as const

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  LOAD_APPS_FAILED: 'Failed to load applications. Please try again.',
  UPDATE_APPS_FAILED: 'Failed to update applications. Please try again.',
  CHECK_UPDATES_FAILED: 'Failed to check for updates. Please try again.',
  CANCEL_BATCH_FAILED: 'Failed to cancel batch installation. Please try again.',
  BATCH_HISTORY_FAILED: 'Failed to load batch history. Please try again.',
  PARSE_ERROR: 'Failed to parse response from server.',
  BATCH_IN_PROGRESS: (batchName: string, state: string) => 
    `Cannot start new update: Batch installation "${batchName}" is currently ${state}. Please wait for it to complete.`,
} as const

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  UPDATE_STARTED: (count: number) =>
    `Update batch created successfully! ${count} application(s) will be updated. Check progress above.`,
  UPDATE_COMPLETED: 'Installation completed! Refreshing application list...',
  BATCH_CANCELLED: 'Batch installation cancelled',
} as const

/**
 * ServiceNow table names
 */
export const TABLES = {
  BATCH_INSTALL_PLAN: 'sys_batch_install_plan',
  PROGRESS_WORKER: 'sys_progress_worker',
  STORE_APP: 'sys_store_app',
  APP_VERSION: 'sys_app_version',
} as const

/**
 * GlideAjax parameter names
 */
export const AJAX_PARAMS = {
  NAME: 'sysparm_name',
  APPS_DATA: 'sysparm_apps_data',
  LOAD_DEMO_DATA: 'sysparm_load_demo_data',
  BATCH_ID: 'sysparm_batch_id',
} as const
