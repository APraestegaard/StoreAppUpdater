import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

export const storeAppManager = ScriptInclude({
    $id: Now.ID['si.store_app_manager'],
    name: 'StoreAppManager',
    apiName: 'x_1118332_store_ap.StoreAppManager',
    script: Now.include('./store-app-manager.server.js'),
    description: 'Manages ServiceNow store app updates and batch installations',
    callerAccess: 'tracking',
    clientCallable: true,
    mobileCallable: true,
    sandboxCallable: true,
    accessibleFrom: 'public',
    active: true,
})
