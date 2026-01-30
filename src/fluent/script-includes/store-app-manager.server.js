// @fluent-disable-sync
var StoreAppManager = Class.create();
StoreAppManager.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
    
    /**
     * Check if there's a batch installation currently in progress
     * Returns JSON with status information
     */
    checkBatchInProgress: function() {
        try {
            var grBatch = new GlideRecord('sys_batch_install_plan');
            grBatch.addQuery('state', 'IN', 'pending,in_progress');
            grBatch.orderByDesc('sys_created_on');
            grBatch.setLimit(1);
            grBatch.query();
            
            if (grBatch.next()) {
                return JSON.stringify({
                    inProgress: true,
                    batchId: grBatch.getUniqueValue(),
                    batchName: grBatch.getValue('name') || 'Batch Installation',
                    state: grBatch.getValue('state'),
                    createdOn: grBatch.getValue('sys_created_on'),
                    link: gs.getProperty('glide.servlet.uri') + 'sys_batch_install_plan.do?sys_id=' + grBatch.getUniqueValue()
                });
            }
            
            return JSON.stringify({
                inProgress: false
            });
            
        } catch (e) {
            gs.error('StoreAppManager - checkBatchInProgress error: ' + e.message);
            return JSON.stringify({
                inProgress: false,
                error: e.message
            });
        }
    },
    
    /**
     * Get all store apps that need updates
     * Returns JSON array of apps with version information
     */
    getAppsNeedingUpdate: function() {
        var appsArray = [];
        var prevName = '';
        
        var grSSA = new GlideRecord('sys_store_app');
        grSSA.addEncodedQuery('install_dateISNOTEMPTY^hide_on_ui=false^vendor=ServiceNow^ORvendorISEMPTY');
        grSSA.orderBy('name');
        grSSA.orderBy('version');
        grSSA.query();
        
        while (grSSA.next()) {
            var curName = grSSA.getValue('name');
            
            // Skip duplicates (same app, different versions installed)
            if (curName == prevName) {
                continue;
            }
            
            var installedVersion = grSSA.getValue('version');
            var latestVersion = grSSA.getValue('latest_version');
            
            if (this._updateAvailable(installedVersion, latestVersion)) {
                prevName = curName;
                
                var appObject = {
                    sys_id: grSSA.getUniqueValue(),
                    name: curName,
                    version: installedVersion,
                    latest_version: latestVersion,
                    vendor: grSSA.getValue('vendor') || 'ServiceNow',
                    install_date: grSSA.getValue('install_date'),
                    needs_update: true
                };
                
                appsArray.push(appObject);
            }
        }
        
        return JSON.stringify(appsArray);
    },
    
    /**
     * Check for available updates from the store
     * This can take some time to run
     */
    checkForUpdates: function() {
        try {
            new sn_appclient.UpdateChecker().checkAvailableUpdates();
            return JSON.stringify({
                success: true,
                message: 'Successfully checked for updates. Refresh the list to see new updates.'
            });
        } catch (e) {
            return JSON.stringify({
                success: false,
                message: 'Error checking for updates: ' + e.message
            });
        }
    },
    
    /**
     * Update selected apps in batch
     * @param appsDataJson - JSON array of StoreApp objects from frontend
     * @param loadDemoData - boolean, whether to load demo data
     */
    updateSelectedApps: function() {
        var appsDataJson = this.getParameter('sysparm_apps_data');
        var loadDemoData = this.getParameter('sysparm_load_demo_data') === 'true';
        
        try {
            var appsData = JSON.parse(appsDataJson);
            var appsArray = [];
            
            // Use the app data passed from frontend directly
            for (var i = 0; i < appsData.length; i++) {
                var app = appsData[i];
                var appObject = {
                    displayName: app.name,
                    id: app.sys_id,
                    load_demo_data: loadDemoData,
                    type: 'application',
                    requested_version: app.latest_version
                };
                appsArray.push(appObject);
            }
            
            if (appsArray.length === 0) {
                return JSON.stringify({
                    success: false,
                    error: 'No apps provided to update'
                });
            }
            
            var appsPackages = {
                packages: appsArray,
                name: 'Store App Updates'
            };
            
            var data = new global.JSON().encode(appsPackages);
            var update = new sn_appclient.AppUpgrader().installBatch(data);
            
            // Validate response
            if (!update) {
                return JSON.stringify({
                    success: false,
                    error: 'AppUpgrader.installBatch() returned null. There may be another batch installation already in progress.'
                });
            }
            
            var updateObj;
            try {
                updateObj = JSON.parse(update);
            } catch (parseError) {
                gs.error('StoreAppManager - Failed to parse installBatch response: ' + update);
                return JSON.stringify({
                    success: false,
                    error: 'Failed to parse batch installation response: ' + parseError.message
                });
            }
            
            // Validate parsed object
            if (!updateObj || !updateObj.batch_installation_id) {
                gs.error('StoreAppManager - Invalid installBatch response: ' + update);
                return JSON.stringify({
                    success: false,
                    error: 'Invalid batch installation response. Missing batch_installation_id. Response: ' + update
                });
            }
            
            // Add helpful notes to the batch install plan
            var grSBIP = new GlideRecord('sys_batch_install_plan');
            if (grSBIP.get(updateObj.batch_installation_id)) {
                grSBIP.setValue('notes', 
                    'It may take some time for the apps to all populate in the related list below. ' +
                    'You can refresh the list as needed to see them populating.\n\n' +
                    'After all apps have populated, the install will start and the State will change to In progress.\n\n' +
                    'When the batch is done, the state will update to Installed.'
                );
                grSBIP.update();
            }
            
            return JSON.stringify({
                success: true,
                batch_installation_id: updateObj.batch_installation_id,
                execution_tracker_id: updateObj.execution_tracker_id
            });
            
        } catch (e) {
            gs.error('StoreAppManager - updateSelectedApps error: ' + e.message);
            return JSON.stringify({
                success: false,
                error: 'Error updating apps: ' + e.message
            });
        }
    },
    
    /**
     * Get batch install status
     * @param batchId - sys_batch_install_plan sys_id
     */
    getBatchStatus: function() {
        var batchId = this.getParameter('sysparm_batch_id');
        
        try {
            var grSBIP = new GlideRecord('sys_batch_install_plan');
            if (grSBIP.get(batchId)) {
                var state = grSBIP.getValue('state');
                var errorMessage = grSBIP.getValue('error_message');
                
                // Query sys_batch_install_item for all items in this batch
                var grItems = new GlideRecord('sys_batch_install_item');
                grItems.addQuery('batch_install_plan', batchId);
                grItems.query();
                var totalApps = grItems.getRowCount();
                
                // Count installed items
                var grInstalled = new GlideRecord('sys_batch_install_item');
                grInstalled.addQuery('batch_install_plan', batchId);
                grInstalled.addQuery('state', 'installed');
                grInstalled.query();
                var completedApps = grInstalled.getRowCount();
                
                // Calculate progress
                var progress = 0;
                if (totalApps > 0) {
                    progress = Math.round((completedApps / totalApps) * 100);
                }
                
                // If state is installed but progress isn't 100, set it to 100
                if (state === 'installed' && progress < 100) {
                    progress = 100;
                    completedApps = totalApps;
                }
                
                gs.info('StoreAppManager - getBatchStatus: Batch ' + batchId + 
                       ' - State: ' + state + 
                       ', Progress: ' + progress + '% (' + completedApps + '/' + totalApps + ')');
                
                return JSON.stringify({
                    state: state,
                    progress: progress,
                    total_apps: totalApps,
                    completed_apps: completedApps,
                    error_message: errorMessage
                });
            }
            
            return JSON.stringify({
                state: 'not_found',
                progress: 0,
                total_apps: 0,
                completed_apps: 0
            });
            
        } catch (e) {
            return JSON.stringify({
                state: 'error',
                progress: 0,
                total_apps: 0,
                completed_apps: 0,
                error_message: e.message
            });
        }
    },
    
    /**
     * Internal method to compare versions
     * @param installedVersion - current installed version
     * @param latestVersion - latest available version
     * @returns boolean - true if update is available
     */
    _updateAvailable: function(installedVersion, latestVersion) {
        if (!latestVersion) {
            return false;
        }
        
        var installedArray = installedVersion.split('.');
        var latestArray = latestVersion.split('.');
        var len = Math.max(installedArray.length, latestArray.length);
        
        for (var i = 0; i < len; i++) {
            var installed = installedArray[i] ? parseInt(installedArray[i]) : 0;
            var latest = latestArray[i] ? parseInt(latestArray[i]) : 0;
            
            if (installed < latest) {
                return true;
            } else if (installed > latest) {
                return false;
            }
        }
        
        return false;
    },
    
    type: 'StoreAppManager'
});
