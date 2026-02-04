// @fluent-disable-sync
var StoreAppManager = Class.create();
StoreAppManager.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
    
    // Constants for batch install plan states
    BATCH_STATES: {
        PENDING: 'pending',
        IN_PROGRESS: 'in_progress',
        INSTALLED: 'installed',
        ERROR: 'error',
        NOT_FOUND: 'not_found'
    },
    
    // Constants for batch install item states
    ITEM_STATES: {
        INSTALLED: 'installed'
    },
    
    // Required role for privileged operations
    REQUIRED_ROLE: 'admin',
    
    /**
     * Check if there's a batch installation currently in progress
     * Returns JSON with status information
     */
    checkBatchInProgress: function() {
        try {
            var grBatch = new GlideRecord('sys_batch_install_plan');
            grBatch.addQuery('state', 'IN', this.BATCH_STATES.PENDING + ',' + this.BATCH_STATES.IN_PROGRESS);
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
            gs.error('StoreAppManager - checkBatchInProgress error: ' + e.message + ' | Stack: ' + e.stack);
            return JSON.stringify({
                inProgress: false,
                error: e.message
            });
        }
    },
    
    /**
     * Get batch installation history
     * Returns JSON array of recent batch installations
     */
    getBatchHistory: function() {
        try {
            var result = [];
            var grBatch = new GlideRecord('sys_batch_install_plan');
            grBatch.orderByDesc('sys_created_on');
            grBatch.setLimit(10); // Get last 10 batch installations
            grBatch.query();
            
            while (grBatch.next()) {
                result.push({
                    sys_id: grBatch.getUniqueValue(),
                    name: grBatch.getValue('name') || 'Batch Installation',
                    state: grBatch.getValue('state'),
                    sys_created_on: grBatch.getValue('sys_created_on'),
                    sys_updated_on: grBatch.getValue('sys_updated_on'),
                    notes: grBatch.getValue('notes'),
                    error_message: grBatch.getValue('error_message')
                });
            }
            
            return JSON.stringify(result);
            
        } catch (e) {
            gs.error('StoreAppManager - getBatchHistory error: ' + e.message + ' | Stack: ' + e.stack);
            return JSON.stringify([]);
        }
    },
    
    /**
     * Get all store apps that need updates
     * Returns JSON array of apps with version information
     */
    getAppsNeedingUpdate: function() {
        try {
            var result = [];
            var seenApps = {};
            
            var appQuery = new GlideRecord('sys_store_app');
            appQuery.addQuery('install_date', '!=', '');
            appQuery.addQuery('hide_on_ui', false);
            appQuery.addQuery('update_available', true);
            appQuery.addActiveQuery();
            
            appQuery.orderBy('name');
            appQuery.query();
            
            while (appQuery.next()) {
                var appTitle = appQuery.getValue('name');
                
                // Skip if already processed
                if (seenApps.hasOwnProperty(appTitle)) {
                    continue;
                }
                
                var storeSysId = appQuery.getUniqueValue();
                var installedVer = appQuery.getValue('version');
                var latestVer = appQuery.getValue('latest_version');
                
                if (installedVer === latestVer) {
                    continue;
                }

                // Parse indicators
                var indicators = [];
                var indicatorsStr = appQuery.getValue('indicators');
                if (indicatorsStr) {
                    try {
                        var parsedIndicators = JSON.parse(indicatorsStr);
                        if (Array.isArray(parsedIndicators)) {
                            indicators = parsedIndicators;
                        }
                    } catch (e) {
                         gs.warn('StoreAppManager - Failed to parse indicators for app: ' + appTitle + ' | Error: ' + e.message);
                    }
                }

                if (this._hasIndicatorWithId(indicators, 'not_licensed')) {
                    continue;
                }
                
                // Parse products field to extract product families
                var productFamilies = [];
                var productsStr = appQuery.getValue('products');
                if (productsStr) {
                    try {
                        var parsedProducts = JSON.parse(productsStr);
                        if (Array.isArray(parsedProducts)) {
                            for (var k = 0; k < parsedProducts.length; k++) {
                                var product = parsedProducts[k];
                                if (product.productFamily) {
                                    productFamilies.push(product.productFamily);
                                }
                            }
                        }
                    } catch (e) {
                        gs.warn('StoreAppManager - Failed to parse products for app: ' + appTitle + ' | Error: ' + e.message);
                    }
                }

                // Determine update type (Major/Minor/Patch)
                var updateType = this._determineUpdateType(installedVer, latestVer);
                
                // Check if app has unavailability indicator (e.g., incompatible or not available for instance type)
                var isUnavailable = this._hasIndicatorWithId(indicators, 'not_available_for_instance_type') || 
                                   this._hasIndicatorWithId(indicators, 'incompatible');
                
                // Mark as processed and build result object
                seenApps[appTitle] = true;
                result.push({
                    sys_id: storeSysId,
                    name: appTitle,
                    version: installedVer,
                    latest_version: latestVer,
                    update_type: updateType,
                    vendor: appQuery.getValue('vendor') || 'ServiceNow',
                    install_date: appQuery.getValue('install_date'),
                    needs_update: true,
                    update_available: true,
                    indicators: indicators,
                    is_unavailable: isUnavailable,
                    product_families: productFamilies,
                    dependencies: appQuery.getValue('dependencies'),
                    is_blocked: false
                });
            }
            
            // Optimization: check for blocked versions in batch
            if (result.length > 0) {
                var appIds = [];
                for (var i = 0; i < result.length; i++) {
                    appIds.push(result[i].sys_id);
                }
                
                var blockedQuery = new GlideRecord('sys_app_version');
                blockedQuery.addQuery('source_app_id', 'IN', appIds.join(','));
                blockedQuery.addQuery('block_install', true);
                blockedQuery.query();
                
                var blockedMap = {};
                while (blockedQuery.next()) {
                    var sId = blockedQuery.getValue('source_app_id');
                    var ver = blockedQuery.getValue('version');
                    if (!blockedMap[sId]) blockedMap[sId] = {};
                    blockedMap[sId][ver] = true;
                }
                
                for (var j = 0; j < result.length; j++) {
                    var item = result[j];
                    if (blockedMap[item.sys_id] && blockedMap[item.sys_id][item.latest_version]) {
                        item.is_blocked = true;
                    }
                }
            }
            
            return JSON.stringify(result);
        } catch (e) {
            gs.error('StoreAppManager - getAppsNeedingUpdate error: ' + e.message + ' | Stack: ' + e.stack);
            return JSON.stringify([]);
        }
    },
    
    /**
     * Check for available updates from the store
     * This can take some time to run
     * Requires admin role
     */
    checkForUpdates: function() {
        // Role check for privileged operation
        if (!gs.hasRole(this.REQUIRED_ROLE)) {
            var userName = gs.getUserName();
            gs.warn('StoreAppManager - checkForUpdates: Access denied for user ' + userName);
            return JSON.stringify({ 
                success: false, 
                message: 'Insufficient privileges. The admin role is required to check for updates.' 
            });
        }
        
        try {
            gs.info('StoreAppManager - checkForUpdates: Starting update check for user ' + gs.getUserName());
            new sn_appclient.UpdateChecker().checkAvailableUpdates(true);
            gs.info('StoreAppManager - checkForUpdates: Successfully completed update check');
            return JSON.stringify({
                success: true,
                message: 'Successfully checked for updates. Refresh the list to see new updates.'
            });
        } catch (e) {
            gs.error('StoreAppManager - checkForUpdates error: ' + e.message + ' | Stack: ' + e.stack);
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
        // Role check for privileged operation
        if (!gs.hasRole(this.REQUIRED_ROLE)) {
            var userName = gs.getUserName();
            gs.warn('StoreAppManager - updateSelectedApps: Access denied for user ' + userName);
            return JSON.stringify({ 
                success: false, 
                error: 'Insufficient privileges. The admin role is required to perform application updates.' 
            });
        }
        
        var appsJson = this.getParameter('sysparm_apps_data');
        var withDemoData = this.getParameter('sysparm_load_demo_data') === 'true';
        
        try {
            // Input validation
            if (!appsJson || appsJson.trim() === '') {
                gs.warn('StoreAppManager - updateSelectedApps: No apps data provided');
                return JSON.stringify({ 
                    success: false, 
                    error: 'No applications data provided. Please select at least one application to update.' 
                });
            }
            
            var appsToUpdate = JSON.parse(appsJson);
            
            // Type and length validation
            if (!Array.isArray(appsToUpdate)) {
                gs.error('StoreAppManager - updateSelectedApps: Invalid apps data format (not array): ' + appsJson);
                return JSON.stringify({ 
                    success: false, 
                    error: 'Invalid application data format. Expected an array of applications.' 
                });
            }
            
            if (appsToUpdate.length === 0) {
                gs.warn('StoreAppManager - updateSelectedApps: Empty apps array provided');
                return JSON.stringify({ 
                    success: false, 
                    error: 'No applications provided to update. Please select at least one application.' 
                });
            }

            // Cleanup any existing pending batch plans to ensure a clean state
            // This prevents merging new apps with old, abandoned batch attempts
            var pendingBatchGr = new GlideRecord('sys_batch_install_plan');
            pendingBatchGr.addQuery('state', 'pending');
            pendingBatchGr.addQuery('sys_created_by', gs.getUserName());
            pendingBatchGr.query();
            
            while (pendingBatchGr.next()) {
                gs.info('StoreAppManager - Cancelling existing pending batch plan: ' + pendingBatchGr.getUniqueValue());
                pendingBatchGr.deleteRecord();
            }
            
            // Check for IN_PROGRESS batches which we cannot interrupt
            var inProgressBatchGr = new GlideRecord('sys_batch_install_plan');
            inProgressBatchGr.addQuery('state', 'in_progress');
            inProgressBatchGr.setLimit(1);
            inProgressBatchGr.query();
            
            if (inProgressBatchGr.next()) {
                 return JSON.stringify({
                    success: false,
                    error: 'A batch installation is currently in progress (' + (inProgressBatchGr.getValue('name') || inProgressBatchGr.getUniqueValue()) + '). Please wait for it to complete.'
                });
            }
            
            gs.info('StoreAppManager - updateSelectedApps: Starting batch update for ' + appsToUpdate.length + ' app(s) by user ' + gs.getUserName());
            
            // Build package list for batch upgrade (AppUpgrader format)
            var packages = [];

            // Optimization: Collect all sys_ids to perform a single batch query for version validation
            var appSysIds = [];
            for (var i = 0; i < appsToUpdate.length; i++) {
                if (appsToUpdate[i].sys_id) {
                    appSysIds.push(appsToUpdate[i].sys_id);
                }
            }
            
            // Map of sys_id -> current installed version
            var currentVersions = {};
            var unavailableApps = {};
            
            if (appSysIds.length > 0) {
                var storeAppGr = new GlideRecord('sys_store_app');
                storeAppGr.addQuery('sys_id', 'IN', appSysIds.join(','));
                storeAppGr.query();
                while (storeAppGr.next()) {
                    var sId = storeAppGr.getUniqueValue();
                    currentVersions[sId] = (storeAppGr.getValue('version') || '').toString().trim();
                    
                    // Check availability
                    var indicatorsStr = storeAppGr.getValue('indicators');
                    if (indicatorsStr) {
                        try {
                            var inds = JSON.parse(indicatorsStr);
                            if (this._hasIndicatorWithId(inds, 'not_available_for_instance_type') || 
                                this._hasIndicatorWithId(inds, 'incompatible')) {
                                unavailableApps[sId] = true;
                            }
                        } catch(e) {
                            gs.warn('StoreAppManager - Failed to parse indicators for validation: ' + e.message);
                        }
                    }
                }
            }
            
            for (var i = 0; i < appsToUpdate.length; i++) {
                var app = appsToUpdate[i];
                
                // Validate each app has required fields
                if (!app.sys_id || !app.name || !app.latest_version) {
                    gs.warn('StoreAppManager - updateSelectedApps: Invalid app object at index ' + i + ': ' + JSON.stringify(app));
                    continue; // Skip invalid apps
                }

                // Verify upgrade necessity against current DB record
                // This prevents "INVALID" batch states caused by including apps that are already up to date
                var installedVersion = currentVersions[app.sys_id];
                var requestedVersion = (app.latest_version || '').toString().trim();
                
                if (unavailableApps[app.sys_id]) {
                    gs.info('StoreAppManager - Skipping unavailable/incompatible app: {0}', app.name);
                    continue;
                }

                if (installedVersion && installedVersion === requestedVersion) {
                    gs.info('StoreAppManager - Skipping app {0} as it is already on version {1}', app.name, installedVersion);
                    continue;
                }
                
                packages.push({
                    displayName: app.name,
                    id: app.sys_id,
                    load_demo_data: withDemoData,
                    type: 'application',
                    requested_version: app.latest_version
                });
                
                gs.info('StoreAppManager - Adding to batch: ' + app.name + ' (' + app.version + ' -> ' + app.latest_version + ')');
            }
            
            if (packages.length === 0) {
                gs.error('StoreAppManager - updateSelectedApps: No valid packages after validation');
                return JSON.stringify({
                    success: false,
                    error: 'No valid applications found to update after validation. Please check the application data.'
                });
            }
            
            // Prepare batch request payload
            var batchPayload = new global.JSON().encode({
                packages: packages,
                name: 'Store App Updates - ' + packages.length + ' app(s)'
            });
            
            gs.debug('StoreAppManager - Batch payload: ' + batchPayload);
            
            // Execute batch upgrade using AppUpgrader (designed for updates)
            var upgradeResponse = new sn_appclient.AppUpgrader().installBatch(batchPayload);
            
            if (!upgradeResponse) {
                gs.error('StoreAppManager - updateSelectedApps: AppUpgrader.installBatch() returned null');
                return JSON.stringify({
                    success: false,
                    error: 'Failed to start batch installation. There may be another batch installation already in progress, or the batch installer service is unavailable.'
                });
            }
            
            // Parse and validate response
            var responseData;
            try {
                responseData = JSON.parse(upgradeResponse);
            } catch (err) {
                gs.error('StoreAppManager - Failed to parse installBatch response: ' + upgradeResponse + ' | Error: ' + err.message);
                return JSON.stringify({
                    success: false,
                    error: 'Failed to parse batch installation response. The installation may have started but status is unclear. Please check sys_batch_install_plan table.'
                });
            }
            
            // Check for required fields
            var batchId = responseData && responseData.batch_installation_id;
            if (!batchId) {
                gs.error('StoreAppManager - Invalid installBatch response (missing batch_installation_id): ' + upgradeResponse);
                return JSON.stringify({
                    success: false,
                    error: 'Invalid batch installation response. Missing batch installation ID. The installation may not have started correctly.'
                });
            }
            
            gs.info('StoreAppManager - Batch installation started successfully. Batch ID: ' + batchId);
            
            // Update batch plan notes with helpful information
            var planRecord = new GlideRecord('sys_batch_install_plan');
            if (planRecord.get(batchId)) {
                planRecord.setValue('notes', [
                    'Batch installation created by Store App Manager.',
                    '',
                    'It may take some time for the apps to all populate in the related list below.',
                    'You can refresh the list as needed to see them populating.',
                    '',
                    'After all apps have populated, the install will start and the State will change to In progress.',
                    '',
                    'When the batch is done, the state will update to Installed.',
                    '',
                    'Applications in this batch:',
                    packages.map(function(pkg) { return '  - ' + pkg.displayName + ' (v' + pkg.requested_version + ')'; }).join('\n')
                ].join('\n'));
                planRecord.update();
                gs.debug('StoreAppManager - Updated batch plan notes for batch ' + batchId);
            } else {
                gs.warn('StoreAppManager - Could not find batch plan record to update notes: ' + batchId);
            }
            
            return JSON.stringify({
                success: true,
                batch_installation_id: batchId,
                execution_tracker_id: responseData.execution_tracker_id
            });
            
        } catch (ex) {
            gs.error('StoreAppManager - updateSelectedApps error: ' + ex.message + ' | Stack: ' + ex.stack);
            return JSON.stringify({
                success: false,
                error: 'An unexpected error occurred while starting the batch installation: ' + ex.message
            });
        }
    },
    
    /**
     * Get batch install status
     * @param batchId - sys_batch_install_plan sys_id
     */
    getBatchStatus: function() {
        try {
            var batchSysId = this.getParameter('sysparm_batch_id');
            
            // Input validation for batch ID
            if (!batchSysId || !this._isValidSysId(batchSysId)) {
                gs.warn('StoreAppManager - getBatchStatus: Invalid batch ID provided: ' + batchSysId);
                return JSON.stringify({
                    state: this.BATCH_STATES.ERROR,
                    progress: 0,
                    total_apps: 0,
                    completed_apps: 0,
                    error_message: 'Invalid batch ID provided'
                });
            }
            
            var planQuery = new GlideRecord('sys_batch_install_plan');
            if (!planQuery.get(batchSysId)) {
                gs.warn('StoreAppManager - getBatchStatus: Batch plan not found: ' + batchSysId);
                return JSON.stringify({
                    state: this.BATCH_STATES.NOT_FOUND,
                    progress: 0,
                    total_apps: 0,
                    completed_apps: 0,
                    error_message: 'Batch installation plan not found'
                });
            }
            
            var statusInfo = {
                state: planQuery.getValue('state'),
                errorMsg: planQuery.getValue('error_message')
            };
            
            // Use GlideAggregate for efficient counting
            var totalItems = this._countBatchItems(batchSysId);
            var doneItems = this._countBatchItems(batchSysId, this.ITEM_STATES.INSTALLED);
            
            // Find the currently installing app
            var currentApp = this._getCurrentInstallingApp(batchSysId);
            
            // Calculate progress percentage
            var progressPct = (totalItems > 0) ? Math.round((doneItems * 100) / totalItems) : 0;
            
            // Force 100% completion when batch state is installed
            if (statusInfo.state === this.BATCH_STATES.INSTALLED) {
                progressPct = 100;
                doneItems = totalItems;
                currentApp = null; // No current app when complete
            }
            
            gs.debug('StoreAppManager - getBatchStatus: Batch ' + batchSysId + 
                   ' - State: ' + statusInfo.state + 
                   ', Progress: ' + progressPct + '% (' + doneItems + '/' + totalItems + ')' +
                   (currentApp ? ', Current: ' + currentApp.display : ''));
            
            return JSON.stringify({
                state: statusInfo.state,
                progress: progressPct,
                total_apps: totalItems,
                completed_apps: doneItems,
                current_app_name: currentApp ? currentApp.name : null,
                current_app_display: currentApp ? currentApp.display : null,
                error_message: statusInfo.errorMsg
            });
            
        } catch (ex) {
            gs.error('StoreAppManager - getBatchStatus error: ' + ex.message + ' | Stack: ' + ex.stack);
            return JSON.stringify({
                state: this.BATCH_STATES.ERROR,
                progress: 0,
                total_apps: 0,
                completed_apps: 0,
                error_message: 'Error retrieving batch status: ' + ex.message
            });
        }
    },

    /**
     * Validate Sys ID format
     * @param sysId - string to check
     * @returns boolean
     */
    _isValidSysId: function(sysId) {
        if (!sysId) return false;
        var sysIdRegex = /^[0-9a-f]{32}$/i;
        return sysIdRegex.test(sysId);
    },
    
    /**
     * Count batch install items using GlideAggregate for better performance
     * @param batchSysId - sys_batch_install_plan sys_id
     * @param state - optional state filter (e.g., 'installed')
     * @returns number - count of items
     */
    _countBatchItems: function(batchSysId, state) {
        var ga = new GlideAggregate('sys_batch_install_item');
        ga.addAggregate('COUNT');
        ga.addQuery('batch_install_plan', batchSysId);
        if (state) {
            ga.addQuery('state', state);
        }
        ga.query();
        if (ga.next()) {
            return parseInt(ga.getAggregate('COUNT'), 10) || 0;
        }
        return 0;
    },
    
    /**
     * Get the currently installing app from batch
     * @param batchSysId - sys_batch_install_plan sys_id
     * @returns object - {name: string, display: string} or null
     */
    _getCurrentInstallingApp: function(batchSysId) {
        try {
            var itemQuery = new GlideRecord('sys_batch_install_item');
            itemQuery.addQuery('batch_install_plan', batchSysId);
            itemQuery.addQuery('state', 'IN', 'pending,in_progress');
            itemQuery.orderBy('order');
            itemQuery.setLimit(1);
            itemQuery.query();
            
            if (itemQuery.next()) {
                return {
                    name: itemQuery.getValue('name'),
                    display: itemQuery.getDisplayValue('name') || itemQuery.getValue('name')
                };
            }
            return null;
        } catch (e) {
            gs.warn('StoreAppManager - _getCurrentInstallingApp error: ' + e.message);
            return null;
        }
    },
    
    /**
     * Helper to check if indicators array contains specific ID
     * @param indicators - array of indicator objects
     * @param id - indicator ID to check
     * @returns boolean
     */
    _hasIndicatorWithId: function(indicators, id) {
        if (!indicators || !Array.isArray(indicators)) {
            return false;
        }
        for (var i = 0; i < indicators.length; i++) {
            if (indicators[i] && indicators[i].id === id) {
                return true;
            }
        }
        return false;
    },

    /**
     * Determine update type based on version comparison
     * @param currentVer - current version string (e.g., "1.2.3")
     * @param newVer - new version string (e.g., "1.3.0")
     * @returns string - "Major", "Minor", or "Patch"
     */
    _determineUpdateType: function(currentVer, newVer) {
        try {
            var currentParts = currentVer.split('.');
            var newParts = newVer.split('.');
            
            // Ensure we have at least 3 parts for both versions
            while (currentParts.length < 3) currentParts.push('0');
            while (newParts.length < 3) newParts.push('0');
            
            // Compare major version (first number)
            if (currentParts[0] !== newParts[0]) {
                return 'Major';
            }
            
            // Compare minor version (second number)
            if (currentParts[1] !== newParts[1]) {
                return 'Minor';
            }
            
            // Compare patch version (third number)
            if (currentParts[2] !== newParts[2]) {
                return 'Patch';
            }
            
            // If all parts are the same, default to Patch (shouldn't happen in normal flow)
            return 'Patch';
            
        } catch (e) {
            gs.warn('StoreAppManager - _determineUpdateType error: ' + e.message + ' | currentVer: ' + currentVer + ', newVer: ' + newVer);
            return 'Patch'; // Default fallback
        }
    },
    
    /**
     * Convert common string representations to boolean
     * @param value - string/boolean/null from GlideRecord
     * @returns boolean true when value represents true, otherwise false
     */
    
    type: 'StoreAppManager'
});
