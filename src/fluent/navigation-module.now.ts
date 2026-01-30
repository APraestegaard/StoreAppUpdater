import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core'
import { storeAppMenu } from './application-menu.now'

export const storeAppModule = Record({
    $id: Now.ID['module.store_app_updater'],
    table: 'sys_app_module',
    data: {
        title: 'Update Manager',
        application: storeAppMenu.$id,
        active: true,
        link_type: 'DIRECT',
        query: 'x_1118332_store_ap_updater.do',
        order: 100,
        hint: 'View and update store applications',
        roles: 'admin',
    },
})
