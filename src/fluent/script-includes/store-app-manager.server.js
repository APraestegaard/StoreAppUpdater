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
        try {
            var result = [];
            var seenApps = {};
            var buildName = gs.getProperty('glide.buildname', '');
            
            if (!buildName) {
                gs.warn('StoreAppManager - glide.buildname property is empty. Compatibility filtering may be unreliable.');
            }
            
            var appQuery = new GlideRecord('sys_store_app');
            appQuery.addQuery('install_date', '!=', '');
            appQuery.addQuery('hide_on_ui', false);
            
            // Build OR condition for vendor field
            var vendorFilter = appQuery.addQuery('vendor', 'ServiceNow');
            vendorFilter.addOrCondition('vendor', '');
            
            appQuery.orderBy('name');
            appQuery.orderBy('version');
            appQuery.query();
            
            // Process query results
            while (appQuery.next()) {
                var appTitle = appQuery.getValue('name');
                
                // Skip if already processed
                if (seenApps.hasOwnProperty(appTitle)) {
                    continue;
                }
                
                var installedVer = appQuery.getValue('version');
                var storeSysId = appQuery.getUniqueValue();
                
                // Query sys_app_version for compatible versions
                var versionQuery = new GlideRecord('sys_app_version');
                versionQuery.addQuery('source_app_id', storeSysId);
                if (buildName) {
                    versionQuery.addQuery('compatibilities', 'LIKE', buildName);
                }
                versionQuery.addQuery('version', '!=', installedVer);
                versionQuery.orderByDesc('version');
                versionQuery.query();
                
                // Find the highest compatible version greater than installed
                var bestVersion = installedVer;
                var foundHigher = false;
                
                while (versionQuery.next()) {
                    var candidate = versionQuery.getValue('version');
                    if (this._versionCompare(candidate, bestVersion) === 1) {
                        bestVersion = candidate;
                        foundHigher = true;
                        // Could break here for performance, but continue to find absolute highest
                    }
                }
                
                // If no compatible version found in sys_app_version, fallback to latest_version
                if (!foundHigher) {
                    var latestVer = appQuery.getValue('latest_version');
                    if (latestVer && this._versionCompare(latestVer, installedVer) === 1) {
                        bestVersion = latestVer;
                        foundHigher = true;
                    }
                }
                
                if (foundHigher) {
                    // Mark as processed and build result object
                    seenApps[appTitle] = true;
                    result.push({
                        sys_id: storeSysId,
                        name: appTitle,
                        version: installedVer,
                        latest_version: bestVersion,
                        vendor: appQuery.getValue('vendor') || 'ServiceNow',
                        install_date: appQuery.getValue('install_date'),
                        needs_update: true
                    });
                }
            }
            
            return JSON.stringify(result);
        } catch (e) {
            gs.error('StoreAppManager - getAppsNeedingUpdate error: ' + e.message);
            return JSON.stringify([]);
        }
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
        // Role check for privileged operation
        if (!gs.hasRole(this.REQUIRED_ROLE)) {
            gs.warn('StoreAppManager - updateSelectedApps: Access denied for user ' + gs.getUserName());
            return JSON.stringify({ 
                success: false, 
                error: 'Insufficient privileges. Admin role required.' 
            });
        }
        
        var appsJson = this.getParameter('sysparm_apps_data');
        var withDemoData = this.getParameter('sysparm_load_demo_data') === 'true';
        
        try {
            // Input validation
            if (!appsJson || appsJson.trim() === '') {
                return JSON.stringify({ success: false, error: 'No apps data provided' });
            }
            
            var appsToUpdate = JSON.parse(appsJson);
            
            // Type and length validation
            if (!Array.isArray(appsToUpdate)) {
                return JSON.stringify({ success: false, error: 'Invalid apps data format. Expected an array.' });
            }
            
            if (appsToUpdate.length === 0) {
                return JSON.stringify({ success: false, error: 'No apps provided to update' });
            }
            
            // Build package list for batch upgrade (AppUpgrader format)
            var packages = [];
            
            for (var i = 0; i < appsToUpdate.length; i++) {
                var app = appsToUpdate[i];
                packages.push({
                    displayName: app.name,
                    id: app.sys_id,
                    load_demo_data: withDemoData,
                    type: 'application',
                    requested_version: app.latest_version
                });
            }
            
            // Prepare batch request payload
            var batchPayload = new global.JSON().encode({
                packages: packages,
                name: 'Store App Updates'
            });
            
            // Execute batch upgrade using AppUpgrader (designed for updates)
            var upgradeResponse = new sn_appclient.AppUpgrader().installBatch(batchPayload);
            
            if (!upgradeResponse) {
                return JSON.stringify({
                    success: false,
                    error: 'AppUpgrader.installBatch() returned null. There may be another batch installation already in progress.'
                });
            }
            
            // Parse and validate response
            var responseData;
            try {
                responseData = JSON.parse(upgradeResponse);
            } catch (err) {
                gs.error('StoreAppManager - Failed to parse installBatch response: ' + upgradeResponse);
                return JSON.stringify({
                    success: false,
                    error: 'Failed to parse batch installation response: ' + err.message
                });
            }
            
            // Check for required fields
            var batchId = responseData && responseData.batch_installation_id;
            if (!batchId) {
                gs.error('StoreAppManager - Invalid installBatch response: ' + upgradeResponse);
                return JSON.stringify({
                    success: false,
                    error: 'Invalid batch installation response. Missing batch_installation_id. Response: ' + upgradeResponse
                });
            }
            
            // Update batch plan notes
            var planRecord = new GlideRecord('sys_batch_install_plan');
            if (planRecord.get(batchId)) {
                planRecord.setValue('notes', [
                    'It may take some time for the apps to all populate in the related list below.',
                    'You can refresh the list as needed to see them populating.',
                    '',
                    'After all apps have populated, the install will start and the State will change to In progress.',
                    '',
                    'When the batch is done, the state will update to Installed.'
                ].join('\n'));
                planRecord.update();
            }
            
            return JSON.stringify({
                success: true,
                batch_installation_id: batchId,
                execution_tracker_id: responseData.execution_tracker_id
            });
            
        } catch (ex) {
            gs.error('StoreAppManager - updateSelectedApps error: ' + ex.message);
            return JSON.stringify({
                success: false,
                error: 'Error updating apps: ' + ex.message
            });
        }
    },
    
    /**
     * Get batch install status
     * @param batchId - sys_batch_install_plan sys_id
     */
    getBatchStatus: function() {
        var batchSysId = this.getParameter('sysparm_batch_id');
        
        // Input validation for batch ID
        if (!batchSysId || !this._isValidSysId(batchSysId)) {
            return JSON.stringify({
                state: this.BATCH_STATES.ERROR,
                progress: 0,
                total_apps: 0,
                completed_apps: 0,
                error_message: 'Invalid batch ID provided'
            });
        }
        
        try {
            var planQuery = new GlideRecord('sys_batch_install_plan');
            if (!planQuery.get(batchSysId)) {
                return JSON.stringify({
                    state: this.BATCH_STATES.NOT_FOUND,
                    progress: 0,
                    total_apps: 0,
                    completed_apps: 0
                });
            }
            
            var statusInfo = {
                state: planQuery.getValue('state'),
                errorMsg: planQuery.getValue('error_message')
            };
            
            // Use GlideAggregate for efficient counting
            var totalItems = this._countBatchItems(batchSysId);
            var doneItems = this._countBatchItems(batchSysId, this.ITEM_STATES.INSTALLED);
            
            // Calculate progress percentage
            var progressPct = (totalItems > 0) ? Math.round((doneItems * 100) / totalItems) : 0;
            
            // Force 100% completion when batch state is installed
            if (statusInfo.state === this.BATCH_STATES.INSTALLED) {
                progressPct = 100;
                doneItems = totalItems;
            }
            
            gs.debug('StoreAppManager - getBatchStatus: Batch ' + batchSysId + 
                   ' - State: ' + statusInfo.state + 
                   ', Progress: ' + progressPct + '% (' + doneItems + '/' + totalItems + ')');
            
            return JSON.stringify({
                state: statusInfo.state,
                progress: progressPct,
                total_apps: totalItems,
                completed_apps: doneItems,
                error_message: statusInfo.errorMsg
            });
            
        } catch (ex) {
            gs.error('StoreAppManager - getBatchStatus error: ' + ex.message);
            return JSON.stringify({
                state: this.BATCH_STATES.ERROR,
                progress: 0,
                total_apps: 0,
                completed_apps: 0,
                error_message: ex.message
            });
        }
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
     * Validate sys_id format (32-character hex string)
     * @param sysId - string to validate
     * @returns boolean - true if valid sys_id format
     */
    _isValidSysId: function(sysId) {
        if (!sysId || typeof sysId !== 'string') {
            return false;
        }
        // sys_id is a 32-character hexadecimal string
        return /^[a-f0-9]{32}$/i.test(sysId);
    },
    
    /**
     * Compare dotted version strings with optional lexicographical and zeroExtend options.
     * @param v1 - First version string
     * @param v2 - Second version string
     * @param options - Optional configuration:
     *   - lexicographical: when true, compare parts as strings (e.g., "1a" allowed)
     *   - zeroExtend: when true, pad the shorter version with "0" parts before comparing
     * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2, NaN if invalid input per options
     */
    _versionCompare: function(v1, v2, options) {
        options = options || {};
        var lexicographical = !!options.lexicographical;
        var zeroExtend = !!options.zeroExtend;
        
        // Fast path: identical strings
        if (v1 === v2) {
            return 0;
        }
        
        // Precompile appropriate validator for this call
        var re = lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/;
        
        var a = v1.split('.');
        var b = v2.split('.');
        
        // Validate parts
        var i;
        for (i = 0; i < a.length; i++) {
            if (!re.test(a[i])) {
                return NaN;
            }
        }
        for (i = 0; i < b.length; i++) {
            if (!re.test(b[i])) {
                return NaN;
            }
        }
        
        // Zero-extend to same length if requested
        if (zeroExtend) {
            var diff = a.length - b.length;
            if (diff > 0) {
                for (i = 0; i < diff; i++) {
                    b.push('0');
                }
            } else if (diff < 0) {
                for (i = 0; i < -diff; i++) {
                    a.push('0');
                }
            }
        }
        
        // Compare part-by-part
        var len = Math.max(a.length, b.length);
        for (i = 0; i < len; i++) {
            var ai = a[i];
            var bi = b[i];
            
            // If one version ran out of parts, the longer one is greater
            if (ai === undefined) {
                return -1;
            }
            if (bi === undefined) {
                return 1;
            }
            
            if (lexicographical) {
                if (ai === bi) {
                    continue;
                }
                // ASCII string comparison
                return ai > bi ? 1 : -1;
            } else {
                // Numeric comparison; parse lazily (unary + is fast)
                var na = +ai;
                var nb = +bi;
                if (na === nb) {
                    continue;
                }
                return na > nb ? 1 : -1;
            }
        }
        
        return 0;
    },
    
    type: 'StoreAppManager'
});
