import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '4d3bb1a71f444eeb871aa1f44b59fb7e'
                    }
                    'menu.store_app_manager': {
                        table: 'sys_app_application'
                        id: '971934a537334638a0ef32e0d14bc0b3'
                    }
                    'module.store_app_updater': {
                        table: 'sys_app_module'
                        id: 'dcd3aed8c3b142dc9251334f4dc7a148'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'f450ee7483944befbec2d5128e0ce68d'
                    }
                    'page.store_app_updater': {
                        table: 'sys_ui_page'
                        id: 'd4c6b77a4880435ba23f0021bd91376e'
                    }
                    'si.store_app_manager': {
                        table: 'sys_script_include'
                        id: 'e0ff7c35a77f4e149d7c7715f7e4c21f'
                    }
                    'x_1118332_store_ap/main': {
                        table: 'sys_ux_lib_asset'
                        id: '639a193415e149339d04e43b22feb9be'
                    }
                    'x_1118332_store_ap/main.js.map': {
                        table: 'sys_ux_lib_asset'
                        id: 'c1afea9a5c214f54b7b0f592f52a5faa'
                    }
                }
            }
        }
    }
}
