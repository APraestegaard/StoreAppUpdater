import '@servicenow/sdk/global'
import { ApplicationMenu } from '@servicenow/sdk/core'

export const storeAppMenu = ApplicationMenu({
    $id: Now.ID['menu.store_app_manager'],
    title: 'Store App Update Manager',
    hint: 'Bulk update ServiceNow store applications',
    roles: ['admin'],
})
