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
            gs.error('StoreAppManager - checkBatchInProgress: ' + e.message);
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
            grBatch.setLimit(10);
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
            gs.error('StoreAppManager - getBatchHistory: ' + e.message);
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
                
                if (seenApps.hasOwnProperty(appTitle)) {
                    continue;
                }
                
                var storeSysId = appQuery.getUniqueValue();
                var installedVer = appQuery.getValue('version');
                var latestVer = appQuery.getValue('latest_version');
                
                if (installedVer === latestVer) {
                    continue;
                }

                var indicators = this._parseJSON(appQuery.getValue('indicators'), []);
                
                if (this._hasIndicatorWithId(indicators, 'not_licensed')) {
                    continue;
                }
                
                var productFamilies = this._extractProductFamilies(appQuery.getValue('products'));
                var updateType = this._determineUpdateType(installedVer, latestVer);
                
                var criticalIndicators = [
                    'not_available_for_instance_type',
                    'incompatible',
                    'entitlement_revoked',
                    'trial_deactivation_requested'
                ];
                
                var unavailableReasons = [];
                for (var idx = 0; idx < criticalIndicators.length; idx++) {
                    if (this._hasIndicatorWithId(indicators, criticalIndicators[idx])) {
                        var reason = this._getIndicatorMessage(indicators, criticalIndicators[idx]);
                        if (reason) {
                            unavailableReasons.push(reason);
                        }
                    }
                }
                
                var dependencies = this._getAppDependencies(storeSysId, appQuery);
                
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
                    is_unavailable: unavailableReasons.length > 0,
                    unavailable_reason: unavailableReasons.length > 0 ? unavailableReasons.join('; ') : null,
                    product_families: productFamilies,
                    dependencies: dependencies
                });
            }
            
            if (result.length > 0) {
                var appIds = result.map(function(app) { return app.sys_id; });
                
                var blockedQuery = new GlideRecord('sys_app_version');
                blockedQuery.addQuery('source_app_id', 'IN', appIds.join(','));
                blockedQuery.addQuery('block_install', true);
                blockedQuery.query();
                
                var blockedMap = {};
                while (blockedQuery.next()) {
                    var sId = blockedQuery.getValue('source_app_id');
                    var ver = blockedQuery.getValue('version');
                    var blockMsg = blockedQuery.getValue('block_message') || 'This version is blocked from installation';
                    if (!blockedMap[sId]) blockedMap[sId] = {};
                    blockedMap[sId][ver] = blockMsg;
                }
                
                for (var j = 0; j < result.length; j++) {
                    var item = result[j];
                    if (blockedMap[item.sys_id] && blockedMap[item.sys_id][item.latest_version]) {
                        item.is_unavailable = true;
                        var blockReason = blockedMap[item.sys_id][item.latest_version];
                        if (blockReason && typeof blockReason === 'string' && blockReason.trim()) {
                            var trimmedReason = blockReason.trim();
                            item.unavailable_reason = item.unavailable_reason ? 
                                item.unavailable_reason + '; ' + trimmedReason : trimmedReason;
                        } else if (!item.unavailable_reason) {
                            item.unavailable_reason = 'This version cannot be installed';
                        }
                    }
                }
            }
            
            return JSON.stringify(result);
        } catch (e) {
            gs.error('StoreAppManager - getAppsNeedingUpdate: ' + e.message);
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
            gs.error('StoreAppManager - checkForUpdates: ' + e.message);
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
            
            gs.info('StoreAppManager - updateSelectedApps: Starting batch update for ' + appsToUpdate.length + ' app(s)');
            
            var packages = [];
            var appSysIds = appsToUpdate.map(function(app) { return app.sys_id; }).filter(function(id) { return id; });
            var currentVersions = {};
            var unavailableApps = {};
            var targetVersions = {};
            
            if (appSysIds.length > 0) {
                var storeAppGr = new GlideRecord('sys_store_app');
                storeAppGr.addQuery('sys_id', 'IN', appSysIds.join(','));
                storeAppGr.query();
                
                while (storeAppGr.next()) {
                    var sId = storeAppGr.getUniqueValue();
                    currentVersions[sId] = (storeAppGr.getValue('version') || '').toString().trim();
                    
                    var indicators = this._parseJSON(storeAppGr.getValue('indicators'), []);
                    var criticalIndicators = [
                        'not_available_for_instance_type',
                        'incompatible',
                        'entitlement_revoked',
                        'trial_deactivation_requested'
                    ];
                    
                    for (var ci = 0; ci < criticalIndicators.length; ci++) {
                        if (this._hasIndicatorWithId(indicators, criticalIndicators[ci])) {
                            unavailableApps[sId] = this._getIndicatorMessage(indicators, criticalIndicators[ci]) || 'App unavailable for update';
                            break;
                        }
                    }
                }
                
                for (var tv = 0; tv < appsToUpdate.length; tv++) {
                    if (appsToUpdate[tv].sys_id && appsToUpdate[tv].latest_version) {
                        targetVersions[appsToUpdate[tv].sys_id] = appsToUpdate[tv].latest_version;
                    }
                }
                
                if (Object.keys(targetVersions).length > 0) {
                    var blockedQuery = new GlideRecord('sys_app_version');
                    blockedQuery.addQuery('source_app_id', 'IN', Object.keys(targetVersions).join(','));
                    blockedQuery.addQuery('block_install', true);
                    blockedQuery.query();
                    
                    while (blockedQuery.next()) {
                        var appId = blockedQuery.getValue('source_app_id');
                        if (targetVersions[appId] === blockedQuery.getValue('version')) {
                            var blockMsg = blockedQuery.getValue('block_message') || 'Target version is blocked from installation';
                            unavailableApps[appId] = blockMsg;
                        }
                    }
                }
            }
            
            for (var i = 0; i < appsToUpdate.length; i++) {
                var app = appsToUpdate[i];
                
                if (!app.sys_id || !app.name || !app.latest_version) {
                    gs.warn('StoreAppManager - Invalid app object: ' + app.name);
                    continue;
                }

                var installedVersion = currentVersions[app.sys_id];
                var requestedVersion = (app.latest_version || '').toString().trim();
                
                if (unavailableApps[app.sys_id]) {
                    gs.info('StoreAppManager - Skipping unavailable app: ' + app.name);
                    continue;
                }
                
                if (app.is_unavailable === true) {
                    gs.info('StoreAppManager - Skipping app marked unavailable: ' + app.name);
                    continue;
                }

                if (installedVersion && installedVersion === requestedVersion) {
                    gs.info('StoreAppManager - Skipping app already current: ' + app.name);
                    continue;
                }
                
                packages.push({
                    displayName: app.name,
                    id: app.sys_id,
                    load_demo_data: withDemoData,
                    type: 'application',
                    requested_version: app.latest_version
                });
            }
            
            if (packages.length === 0) {
                return JSON.stringify({
                    success: false,
                    error: 'No valid applications found to update after validation.'
                });
            }
            
            var batchPayload = new global.JSON().encode({
                packages: packages,
                name: 'Store App Updates - ' + packages.length + ' app(s)'
            });
            
            var upgradeResponse = new sn_appclient.AppUpgrader().installBatch(batchPayload);
            
            if (!upgradeResponse) {
                return JSON.stringify({
                    success: false,
                    error: 'Failed to start batch installation. Another batch may be in progress.'
                });
            }
            
            var responseData;
            try {
                responseData = JSON.parse(upgradeResponse);
            } catch (err) {
                gs.error('StoreAppManager - Failed to parse installBatch response: ' + err.message);
                return JSON.stringify({
                    success: false,
                    error: 'Failed to parse batch installation response.'
                });
            }
            
            var batchId = responseData && responseData.batch_installation_id;
            if (!batchId) {
                return JSON.stringify({
                    success: false,
                    error: 'Invalid batch installation response. Missing batch ID.'
                });
            }
            
            gs.info('StoreAppManager - Batch installation started: ' + batchId);
            
            var planRecord = new GlideRecord('sys_batch_install_plan');
            if (planRecord.get(batchId)) {
                var appList = packages.map(function(pkg) { 
                    return '  - ' + pkg.displayName + ' (v' + pkg.requested_version + ')'; 
                }).join('\n');
                
                planRecord.setValue('notes', 
                    'Batch installation created by Store App Manager.\n\n' +
                    'Applications in this batch:\n' + appList
                );
                planRecord.update();
            }
            
            return JSON.stringify({
                success: true,
                batch_installation_id: batchId,
                execution_tracker_id: responseData.execution_tracker_id
            });
            
        } catch (ex) {
            gs.error('StoreAppManager - updateSelectedApps: ' + ex.message);
            return JSON.stringify({
                success: false,
                error: 'An unexpected error occurred: ' + ex.message
            });
        }
    },
    
    getBatchStatus: function() {
        try {
            var batchSysId = this.getParameter('sysparm_batch_id');
            
            if (!batchSysId || !this._isValidSysId(batchSysId)) {
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
                return JSON.stringify({
                    state: this.BATCH_STATES.NOT_FOUND,
                    progress: 0,
                    total_apps: 0,
                    completed_apps: 0,
                    error_message: 'Batch installation plan not found'
                });
            }
            
            var totalItems = this._countBatchItems(batchSysId);
            var doneItems = this._countBatchItems(batchSysId, this.ITEM_STATES.INSTALLED);
            var currentApp = this._getCurrentInstallingApp(batchSysId);
            var state = planQuery.getValue('state');
            
            var progressPct = (totalItems > 0) ? Math.round((doneItems * 100) / totalItems) : 0;
            
            if (state === this.BATCH_STATES.INSTALLED) {
                progressPct = 100;
                doneItems = totalItems;
                currentApp = null;
            }
            
            return JSON.stringify({
                state: state,
                progress: progressPct,
                total_apps: totalItems,
                completed_apps: doneItems,
                current_app_name: currentApp ? currentApp.name : null,
                current_app_display: currentApp ? currentApp.display : null,
                error_message: planQuery.getValue('error_message')
            });
            
        } catch (ex) {
            gs.error('StoreAppManager - getBatchStatus: ' + ex.message);
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
     * Check if indicators array contains specific ID
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
     * Get the message from a specific indicator
     */
    _getIndicatorMessage: function(indicators, id) {
        if (!indicators || !Array.isArray(indicators)) {
            return null;
        }
        for (var i = 0; i < indicators.length; i++) {
            if (indicators[i] && indicators[i].id === id) {
                return indicators[i].message || indicators[i].tooltip || id;
            }
        }
        return null;
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
            gs.warn('StoreAppManager - _determineUpdateType error: ' + e.message);
            return 'Patch';
        }
    },
    
    /**
     * Parse JSON string safely with fallback
     * @param jsonString - JSON string to parse
     * @param defaultValue - Value to return if parsing fails
     * @returns parsed object or defaultValue
     */
    _parseJSON: function(jsonString, defaultValue) {
        if (!jsonString) return defaultValue;
        try {
            var parsed = JSON.parse(jsonString);
            return Array.isArray(parsed) ? parsed : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },
    
    /**
     * Extract product families from products JSON
     * @param productsStr - JSON string of products
     * @returns array of product family names
     */
    _extractProductFamilies: function(productsStr) {
        var products = this._parseJSON(productsStr, []);
        var families = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i].productFamily) {
                families.push(products[i].productFamily);
            }
        }
        return families;
    },
    
    /**
     * Get dependency information for an app with enhanced debugging
     * @param appSysId - sys_store_app sys_id
     * @param appGr - GlideRecord of sys_store_app (optional, for performance)
     * @returns array of dependency objects [{name, id, status}]
     */
    _getAppDependencies: function(appSysId, appGr) {
        var dependencies = [];
        try {
            var storeApp;
            if (appGr && appGr.getUniqueValue() === appSysId) {
                storeApp = appGr;
            } else {
                storeApp = new GlideRecord('sys_store_app');
                if (!storeApp.get(appSysId)) {
                    return dependencies;
                }
            }
            
            // Try multiple possible dependency field names
            var depsStr = storeApp.getValue('dependencies');
            if (!depsStr || depsStr.trim() === '') {
                depsStr = storeApp.getValue('requires') || storeApp.getValue('prerequisite_apps');
            }
            
            if (!depsStr || depsStr.trim() === '') {
                return dependencies;
            }
            
            gs.info('StoreAppManager - Raw dependencies for ' + storeApp.getValue('name') + ': ' + depsStr);
            
            // Parse dependencies - handle multiple formats intelligently
            var deps = [];
            var cleanStr = depsStr.trim();
            
            // Check if it's JSON
            if (cleanStr.startsWith('[') || cleanStr.startsWith('{')) {
                deps = this._parseJSON(cleanStr, []);
            }
            // Detect most likely separator by counting occurrences
            else {
                var separators = [
                    {char: '/', count: (cleanStr.match(/\//g) || []).length},
                    {char: '|', count: (cleanStr.match(/\|/g) || []).length},
                    {char: ';', count: (cleanStr.match(/;/g) || []).length},
                    {char: ',', count: (cleanStr.match(/,/g) || []).length}
                ];
                
                // Find separator with highest count (if count > 0)
                var bestSep = null;
                var maxCount = 0;
                for (var i = 0; i < separators.length; i++) {
                    if (separators[i].count > maxCount) {
                        maxCount = separators[i].count;
                        bestSep = separators[i].char;
                    }
                }
                
                // Split by detected separator
                if (bestSep && maxCount > 0) {
                    var parts = cleanStr.split(bestSep);
                    for (var p = 0; p < parts.length; p++) {
                        var part = parts[p].trim();
                        // Remove version numbers if present (e.g., "app:1.0.0" -> "app")
                        if (part.indexOf(':') > -1) {
                            var colonParts = part.split(':');
                            part = colonParts[0].trim();
                        }
                        if (part && part.length > 0) {
                            deps.push({id: part});
                        }
                    }
                }
                // No separator found, check for concatenated name:version format
                else if (cleanStr.match(/[a-z_]+:\d+\.\d+/i)) {
                    var matches = cleanStr.match(/([a-z_]+):\d+\.\d+/gi);
                    if (matches) {
                        for (var m = 0; m < matches.length; m++) {
                            var matchParts = matches[m].split(':');
                            if (matchParts[0]) {
                                deps.push({id: matchParts[0].trim()});
                            }
                        }
                    }
                }
                // Single dependency
                else if (cleanStr.length > 0) {
                    deps.push({id: cleanStr});
                }
            }
            
            gs.debug('StoreAppManager - Parsed ' + deps.length + ' dependencies');
            
            // Process each dependency
            for (var i = 0; i < deps.length; i++) {
                var dep = deps[i];
                if (!dep || !dep.id) {
                    continue;
                }
                
                var depId = dep.id.toString().trim();
                if (!depId || depId.length === 0) {
                    continue;
                }
                
                var depName = dep.name || depId;
                var status = 'will_activate';
                
                // Look up dependency in sys_store_app - try multiple strategies
                var depApp = new GlideRecord('sys_store_app');
                var found = false;
                
                // Try 1: Match by sys_code
                depApp.addQuery('sys_code', depId);
                depApp.setLimit(1);
                depApp.query();
                if (depApp.next()) {
                    found = true;
                } else {
                    // Try 2: Match by scope
                    depApp = new GlideRecord('sys_store_app');
                    depApp.addQuery('scope', depId);
                    depApp.setLimit(1);
                    depApp.query();
                    if (depApp.next()) {
                        found = true;
                    } else {
                        // Try 3: Match by name (case-insensitive)
                        depApp = new GlideRecord('sys_store_app');
                        depApp.addQuery('name', 'LIKE', depId);
                        depApp.setLimit(1);
                        depApp.query();
                        if (depApp.next()) {
                            found = true;
                        }
                    }
                }
                
                if (found) {
                    depName = depApp.getValue('name') || depName;
                    if (depApp.getValue('install_date')) {
                        status = 'installed';
                    }
                } else {
                    // Clean up the ID for display if no match found
                    // Convert "com.snc.app_name" to "App Name"
                    depName = depId
                        .replace(/^com\.snc\./i, '')
                        .replace(/^sn_/i, '')
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map(function(word) {
                            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                        })
                        .join(' ');
                }
                
                dependencies.push({
                    name: depName,
                    id: depId,
                    status: status
                });
            }
            
        } catch (e) {
            gs.error('StoreAppManager - _getAppDependencies error for ' + appSysId + ': ' + e.message);
        }
        return dependencies;
    },
    
    type: 'StoreAppManager'
});
