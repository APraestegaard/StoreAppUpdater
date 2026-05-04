import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import storeAppUpdaterPage from '../../client/index.html'

export const storeAppUpdaterUiPage = UiPage({
    $id: Now.ID['page.store_app_updater'],
    endpoint: 'x_961692_store_ap_updater.do',
    description: 'Store App Update Manager UI Page',
    category: 'general',
    html: storeAppUpdaterPage,
    direct: true,
})
