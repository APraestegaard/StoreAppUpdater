# Store App Update Manager

![Version](https://img.shields.io/badge/version-0.0.1-blue) ![ServiceNow](https://img.shields.io/badge/ServiceNow-Fluent%20SDK%204.2-green) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue) ![License](https://img.shields.io/badge/license-GPL--3.0-blue)

A modern, enterprise-grade React application for ServiceNow that revolutionizes store application management. Built entirely with the ServiceNow Fluent SDK, this tool transforms complex update workflows into a streamlined, intelligent experience.

## Overview

Managing store app updates in ServiceNow traditionally involves navigating multiple screens, manually checking versions, and coordinating batch installations. **Store App Update Manager** eliminates this friction by providing:

**Key Benefits:**
- 🔍 **Intelligent Detection**: Automatically identifies apps needing updates with semantic version comparison
- 🎯 **Batch Operations**: Update multiple apps simultaneously with a single action
- 📊 **Real-Time Monitoring**: Live progress tracking with automatic batch detection
- 🔎 **Advanced Search**: Filter apps instantly by name, vendor, or version
- 📄 **Smart Pagination**: Handle large app portfolios with configurable page sizes
- 🚨 **Conflict Prevention**: Detects existing batch installations to prevent conflicts
- 🎨 **Native UI**: Seamlessly integrated ServiceNow design system
- 🔗 **Direct Navigation**: Quick access to Batch Install Plans and Execution Trackers

## Installation & Usage

### Prerequisites

- **ServiceNow Instance**: Any supported release with store app access
- **Node.js**: Version 14.x or higher (16.x+ recommended)
- **ServiceNow SDK**: `@servicenow/sdk` 4.2.0+
- **Permissions**: Admin or equivalent rights for app installation

### Quick Start

1. **Clone and install dependencies:**
```bash
git clone https://github.com/yourusername/StoreAppUpdater.git
cd StoreAppUpdater
npm install
```

2. **Authenticate with your ServiceNow instance:**
```bash
now-sdk auth
# Follow prompts to enter instance URL and credentials
# Creates auth profile in ~/.now/config
```

3. **Download type definitions (optional but recommended):**
```bash
npm run types
# Downloads ServiceNow APIs to @types/servicenow/
# Enables IntelliSense and type-ahead
```

4. **Build and deploy:**
```bash
npm run build    # Compiles Fluent metadata and React app
npm run deploy   # Installs to ServiceNow instance
```

5. **Access the application:**
   - Navigate to **Store App Manager > Update Manager** in the Application Navigator
   - Or go directly to: `https://your-instance.service-now.com/x_1118332_store_ap_updater.do`
   - Bookmark for quick access!

### Recommended Workflows

#### Updating Individual Apps
1. **Search**: Use the search box to quickly locate specific apps
   - Searches across: App Name, Vendor, Current Version, Latest Version
   - Real-time filtering as you type
2. **Select**: Check boxes next to apps you want to update
   - Selections persist across pages and searches
   - "Select All" checkbox targets current page only
3. **Update**: Click **Update Selected** and confirm the batch
4. **Monitor**: Progress Tracker shows real-time status with live polling

#### Bulk Update All Apps
1. **Review**: Scan the list to confirm all apps should be updated
2. **Update**: Click **Update All** and confirm
3. **Track**: Monitor the batch installation progress
4. **Auto-Complete**: List automatically refreshes when installation completes

#### Managing Large App Portfolios
- **Search**: Filter by name, vendor, or version to narrow results
- **Paginate**: Choose page size (5, 10, 25, 50, 100) based on preference
- **Navigate**: Use page controls while maintaining selections across pages
- **Status Display**: Shows "X-Y of Z (filtered from N) applications" for clarity

#### Checking for Store Updates
1. **Initiate**: Click **Check for Updates** (runs `UpdateChecker.checkAvailableUpdates()`)
2. **Wait**: Process may take several minutes (UI remains responsive)
3. **Confirm**: Success message indicates completion
4. **Refresh**: List automatically reloads with newly detected updates

#### Handling Conflicts
- **Detection**: App automatically detects existing batch installations
- **Warning**: Blue info bar displays when batch is in progress
- **Prevention**: Update buttons disabled until existing batch completes
- **Links**: Direct access to in-progress batch for monitoring

## Features

### Intelligent Version Management
- Automatic discovery of apps with available updates
- Semantic version comparison (e.g., 2.1.3 vs 2.2.0)
- Duplicate handling for multiple installed versions
- Vendor filtering (ServiceNow apps)

### Flexible Update Operations
- **Selective Updates**: Choose specific apps via checkboxes
  - Update Selected button shows count: "Update Selected (N)"
  - Confirmation dialog before executing
  - Full control over what gets updated
- **Bulk Updates**: Update entire list with one action
  - "Update All" button for complete batch updates
  - Confirmation with app count display
  - Efficient for maintenance windows
- **Store Refresh**: Query ServiceNow store for latest versions
  - Runs `sn_appclient.UpdateChecker.checkAvailableUpdates()`
  - Async operation with status notifications
  - Auto-refresh list on completion
- **Progress Tracking**: Dual-mode monitoring system
  - **User-Initiated Mode**: For updates started in this session
    - Real-time progress bar with percentage
    - Completed/Total apps counter
    - Auto-refresh list on completion
    - Direct links to Batch Install Plan and Execution Tracker
  - **Detection Mode**: For external/existing batch installations
    - Discovers in-progress batches on page load
    - Shows batch name, state, and creation time
    - Prevents new updates until completion
    - Manual refresh required when detected batch completes

### Advanced List Management
- **Search Filtering**: Real-time text search across multiple fields
  - Searches: Application Name, Vendor, Current Version, Latest Version
  - Case-insensitive partial matching
  - Instant results with "No results found" feedback
  - Clear button (×) to reset filter
A modern, production-ready architecture built with React 19, TypeScript 5.5, and ServiceNow Fluent SDK 4.2.

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend Framework** | React | 19.x | Component-based UI with hooks |
| **Language** | TypeScript | 5.5.4 | Type-safe client and server code |
| **Build System** | ServiceNow Fluent SDK | 4.2.0 | Metadata compilation and deployment |
| **UI Components** | Custom React | - | AppListTable, ActionBar, ProgressTracker |
| **Service Layer** | GlideAjax Wrapper | - | Type-safe async service calls |
| **Backend** | ScriptInclude | - | Server-side business logic |
| **ServiceNow APIs** | sn_appclient | - | AppUpgrader, UpdateChecker |
| **State Management** | React Hooks | - | useState, useEffect, useMemo |
| **Styling** | CSS3 | - | ServiceNow design system aligned |

### Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  App.tsx (State Management + Orchestration)                 │
│  ├─ ActionBar.tsx (Update controls)                         │
│  ├─ AppListTable.tsx (Search, Pagination, Selection)        │
│  └─ ProgressTracker.tsx (Live status polling)               │
└────────────────────┬────────────────────────────────────────┘
                     │ GlideAjax Calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer (Client)                    │
│  StoreAppService.ts                                          │
│  ├─ getAppsNeedingUpdate()                                  │
│  ├─ updateSelectedApps(apps, loadDemoData)                  │
│  ├─ checkForUpdates()                                       │
│  ├─ checkBatchInProgress()                                  │
│  └─ getBatchStatus(batchId)                                 │
└────────────────────┬────────────────────────────────────────┘
                     │ sysparm_name parameter routing
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend ScriptInclude (Server)                  │
│  StoreAppManager.server.js (extends AbstractAjaxProcessor)  │
│  ├─ getAppsNeedingUpdate() → Query sys_store_app            │
│  ├─ updateSelectedApps() → Call AppUpgrader.installBatch()  │
│  ├─ checkForUpdates() → Call UpdateChecker                  │
│  ├─ checkBatchInProgress() → Query sys_batch_install_plan   │
│  └─ getBatchStatus() → Poll batch and item records          │
└────────────────────┬────────────────────────────────────────┘
                     │ ServiceNow Platform APIs
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    ServiceNow Tables                         │
│  ├─ sys_store_app (installed apps and versions)             │
│  ├─ sys_batch_install_plan (batch operations)               │
StoreAppUpdater/
├── src/
│   ├── client/                              # React Frontend (TypeScript)
│   │   ├── index.html                       # HTML entry with <sdk:now-ux-globals>
│   │   ├── main.tsx                         # React bootstrap (createRoot)
│   │   ├── app.tsx                          # Root component (state + orchestration)
│   │   ├── app.css                          # ServiceNow design system styles
│   │   ├── types.ts                         # TypeScript interfaces/types
│   │   ├── global.d.ts                      # Global type declarations (GlideAjax, Window)
│   │   ├── components/
│   │   │   ├── AppListTable.tsx             # Table with search, pagination, selection
│   │   │   ├── ActionBar.tsx                # Action buttons (Update, Check, Refresh)
│   │   │   └── ProgressTracker.tsx          # Live batch status with auto-polling
│   │   └── services/
│   │       └── StoreAppService.ts           # GlideAjax wrapper (typed async methods)
│   │
│   ├── fluent/                              # ServiceNow Fluent Metadata
│   │   ├── index.now.ts                     # Main entry point (exports all)
│   │   ├── application-menu.now.ts          # ApplicationMenu definition
│   │   ├── navigation-module.now.ts         # sys_app_module (Navigator entry)
│   │   ├── tsconfig.json                    # TypeScript config (project references)
│   │   ├── tsconfig.server.json             # Server-side TS config
│   │   ├── tsconfig.client.json             # Client-side TS config
│   │   ├── generated/
│   │   │   └── keys.ts                      # Auto-generated $id tracking
│   │   ├── ui-pages/
│   │   │   └── store-app-updater.now.ts     # UiPage (React app mount point)
│   │   └── script-includes/
│   │       ├── store-app-manager.now.ts     # ScriptInclude metadata
│   │       └── store-app-manager.server.js  # Server logic (GlideRecord, APIs)
│   │
│   └── server/                              # TypeScript Server Modules (if needed)
│       └── tsconfig.json                    # Server TS compilation config
│
├── dist/                                    # Build output (generated)
│   └── app/                                 # Compiled application bundle
│
├── @types/                                  # Type Definitions (from now-sdk dependencies)
│   └── servicenow/                          # ServiceNow APIs, schemas, tables
│       ├── glide.server.d.ts                # GlideRecord, GlideAggregate, gs, etc.
│       ├── glide.client.d.ts                # g_form, g_user, GlideAjax, etc.
│       └── schema/                          # Table definitions with full metadata
│
├── .now/                                    # SDK metadata (generated)
├── .vscode/                                 # VS Code workspace settings
├── node_modules/                            # NPM dependencies
├── now.config.json                          # Fluent SDK configuration
├── now.prebuild.mjs                         # Pre-build scripts/hooks
├── package.json                             # NPM package definition
├── package-lock.json                        # Dependency lock file
├── .eslintrc                                # ESLint configuration
├── .gitignore                               # Git ignore rules
├── LICENSE                                  # GPL-3.0 License
└── README.md                                # This file
```

### Key Files Explained

| File | Purpose | Notes |
|------|---------|-------|
| `src/client/app.tsx` | Main React component | Central state management, orchestrates child components |
| `src/client/types.ts` | TypeScript interfaces | `StoreApp`, `BatchInstallResponse`, `BatchStatusResponse`, etc. |
| `src/client/services/StoreAppService.ts` | Backend communication | Wraps GlideAjax in typed async methods |
| `src/fluent/script-includes/store-app-manager.server.js` | Server-side logic | Extends `AbstractAjaxProcessor`, queries tables, calls APIs |
| `src/fluent/application-menu.now.ts` | Application menu | Creates "Store App Manager" in Navigator |
| `src/fluent/navigation-module.now.ts` | Module entry | "Update Manager" link under application menu |
| `src/fluent/ui-pages/store-app-updater.now.ts` | UI page definition | Mounts React app at `x_1118332_store_ap_updater.do` |
| `now.config.json` | SDK configuration | Scope, app name, paths |
| `package.json` | NPM scripts | `build`, `deploy`, `transform`, `types` |**Transformation**: ScriptInclude converts to AppUpgrader format:
   ```javascript
   {
     packages: [
       { id: sys_id, displayName: name, requested_version: latest_version, 
         type: 'application', load_demo_data: false }
     ],
     name: 'Store App Updates'
   }
   ```
3. **Execution**: `sn_appclient.AppUpgrader().installBatch(data)`
4. **Response**: Returns `{ batch_installation_id, execution_tracker_id }`
5. **Polling**: Frontend polls `getBatchStatus()` every 3 seconds
6. **Completion**: Auto-refresh on terminal states (installed/error/invalid)

#### Conflict Detection & Prevention
- **On Page Load**: Queries `sys_batch_install_plan` for pending/in_progress batches
- **Detection Logic**: 
  ```sql
  state IN ('pending', 'in_progress')
  ORDER BY sys_created_on DESC
  LIMIT 1
  ```
- **UI Response**: Disables update buttons, displays info banner with batch details
- **User Action**: Must wait for completion or manually cancel existing batch

#### State Management Hierarchy
```
App.tsx (Root State)
├─ apps: StoreApp[]                    (App list data)
├─ selectedApps: Set<string>           (Selection state)
├─ loading: boolean                    (Initial load)
├─ isUpdating: boolean                 (Update in progress)
├─ isCheckingUpdates: boolean          (Store query running)
├─ batchId: string | null              (User-initiated batch)
├─ executionTrackerId: string | null   (Progress tracking)
├─ batchInProgress: object | null      (Detected external batch)
├─ error: string | null                (Error messages)
└─ success: string | null              (Success messages)
| APIs | sn_appclient.AppUpgrader, UpdateChecker |

### How It Works Description |
|----------|-------|-------------|
| **Scope** | `x_1118332_store_ap` | Application namespace |
| **Scope ID** | `19b7e260b6f948499ce7e3e2de0e06af` | Unique scope identifier |
| **App Name** | Store App Update Manager | Display name |
| **UI Endpoint** | `x_1118332_store_ap_updater.do` | Direct URL access |
| **ScriptInclude** | `x_1118332_store_ap.StoreAppManager` | Full scoped API name |
| **Menu Location** | Store App Manager > Update Manager | Application Navigator path |

### Query Filters & Logic

#### App Discovery Query
```sql
-- sys_store_app table query
install_date IS NOT EMPTY          -- Only installed apps
^hide_on_ui = false                -- Exclude hidden apps
^vendor = ServiceNow               -- ServiceNow apps only
^OR vendor IS EMPTY                -- Include apps without vendor
ORDER BY name, version             -- Group by name, then version
```

#### Duplicate Handling
- **Problem**: Multiple versions of same app may be installed
- **Solution**: Skip duplicates by tracking `prevName` in iteration
- **Result**: Only shows latest installed version per app
NPM Scripts

| Command | Alias | Purpose | When to Use |
|---------|-------|---------|-------------|
| `npm run build` | `now-sdk build` | Compile Fluent metadata and bundle React app | After any code changes |
| `npm run deploy` | `now-sdk install` | Deploy built application to instance | After successful build |
| `npm run transform` | `now-sdk transform` | Pull metadata from instance to local | Sync changes made in ServiceNow |
| `npm run types` | `now-sdk dependencies` | Download type definitions and schemas | First-time setup or after table changes |

### Development Workflow

#### Standard Development Cycle
```bash
# 1. Make changes to source files (*.tsx, *.ts, *.now.ts, *.server.js)
# 2. Build and deploy
npm run build && npm run deploy

# OR use individual commands for debugging
npm run build      # Check for compilation errors
npm run deploy     # Deploy if build succeeds
```

### Common Issues & Solutions

| Issue | Symptoms | Solution | Details |
|-------|----------|----------|---------|
| **No apps showing** | Empty list or "All up to date" | • Verify apps meet filter criteria<br>• Check `vendor = ServiceNow`<br>• Ensure `hide_on_ui = false`<br>• Run "Check for Updates" | Query filters may exclude apps. Check System Logs for query errors. |
| **Search not filtering** | Results unchanged when typing | • Clear browser cache<br>• Check browser console for errors<br>• Verify React state updates | Use DevTools to inspect `searchQuery` state. |
| **Pagination broken** | Incorrect page counts or navigation | • Check `filteredApps.length` calculation<br>• Verify `totalPages` math<br>• Inspect page boundaries in console | Look for off-by-one errors in startIndex/endIndex. |
| **Updates not starting** | Button click does nothing | • Check for in-progress batch (blue banner)<br>• Verify permissions (admin role)<br>• Review browser console for errors<br>• Check System Logs for server errors | GlideAjax may be failing silently. |
| **Progress stuck** | Percentage not changing | • Verify `batchId` is valid sys_id<br>• Check batch plan state in ServiceNow<br>• Ensure polling interval is running<br>• Review `sys_batch_install_item` records | Batch may be stuck server-side. |
| **Build failures** | `now-sdk build` errors | • Run `npm install`<br>• Delete `node_modules/` and reinstall<br>• Check Node.js version (14.x+)<br>• Verify `now.config.json` syntax | Check error message for specific file/line. |
| **Deploy failures** | `now-sdk install` errors | • Verify authentication: `now-sdk auth`<br>• Check instance connectivity<br>• Review scope permissions<br>• Check for duplicate metadata | May need to delete conflicting records in instance. |
| **GlideAjax errors** | "HTTP Processor class not found" | • Verify ScriptInclude is `clientCallable: true`<br>• Check full scoped name in service<br>• Confirm ScriptInclude deployed<br>• Test in Scripts - Background | ScriptInclude must extend `AbstractAjaxProcessor`. |
| **Type errors** | IntelliSense not working | • Run `npm run types`<br>• Check `tsconfig.json` paths<br>• Restart VS Code<br>• Verify `@types/servicenow/` exists | Type definitions may be missing or outdated. |

### Error Message Decoder

#### Client-Side Errors
- **"Failed to parse apps response"**: ScriptInclude returned non-JSON or error
- **"Failed to update apps"**: Server-side error or invalid parameters
- **"Cannot start new update"**: Another batch is in progress (check banner)

#### Server-Side Errors (Check System Logs)
- **"AppUpgrader.installBatch() returned null"**: Another batch may be running
- **"Failed to parse installBatch response"**: Unexpected API response format
- **"Invalid batch installation response"**: Missing `batch_installation_id` in response

### Validation Checklist

Before reporting an issue, verify:
- [ ] Running latest code (`git pull && npm install && npm run build`)
- [ ] ServiceNow instance is accessible
- [ ] User has admin or app_installer role
- [ ] No browser console errors
- [ ] System Logs checked for server errors
- [ ] Batch install plan state reviewed (if applicable)
- [ ] `sys_store_app` table has data
- [ ] Application is deployed (`now-sdk install` succeeded)

### Getting Help

1. **Check System Logs**: Filter by `Source = StoreAppManager`
2. **Browser Console**: Look for React/GlideAjax errors
3. **Network Tab**: Verify `xmlhttp.do` requests/responses
4. **Test Server Methods**: Use Scripts - Background
   ```javascript
   var sam = new x_1118332_store_ap.StoreAppManager();
   gs.info(sam.getAppsNeedingUpdate());
   ```
5. **GitHub Issues**: Report bugs with logs and steps to reproduce

#### Type Definitions Setup
```bash
# Download ServiceNow APIs and table schemas
npm run types

# This creates:
# - @types/servicenow/glide.server.d.ts (GlideRecord, gs, etc.)
# -Future Enhancements

Potential features for future releases:

- 🌍 **Multi-Instance Support**: Manage apps across multiple instances
- 📧 **Email Notifications**: Alert on update availability or completion
- 📅 **Scheduled Updates**: Automated updates during maintenance windows
- 📊 **Analytics Dashboard**: Track update history and success rates
- 🔔 **Update Policies**: Define rules for auto-approval/rejection
- 🧪 **Test Mode**: Simulate updates without execution
- 📝 **Update Notes**: Add comments/justifications to batch operations
- 🔐 **Role-Based Views**: Limit visibility based on user permissions
- 📦 **Custom Package Groups**: Define app bundles for coordinated updates
- 🌓 **Dark Mode**: Toggle UI theme preference

## Contributing

Contributions are welcome! Whether it's bug reports, feature requests, code contributions, or documentation improvements.

### How to Contribute

1. **Fork the repository** on GitHub
2. **Clone your fork** locally: `git clone https://github.com/yourusername/StoreAppUpdater.git`
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Make your changes** with clear, descriptive commits
5. **Test thoroughly**: Build and deploy to test instance
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to your fork**: `git push origin feature/amazing-feature`
8. **Open a Pull Request** with detailed description

### Code Contribution Guidelines

- Follow existing code style and patterns
- Add TypeScript types for new interfaces
- Update README if adding features or changing behavior
- Test on ServiceNow instance before submitting
- Include comments for complex logic
- Keep commits focused and atomic

### Reporting Issues

When reporting bugs, please include:
- ServiceNow release/version
- Node.js version
- Browser and version (if UI issue)
- Steps to reproduce
- Expected vs actual behavior
- Error messages (console + System Logs)
- Screenshots if applicable

## License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for full details.

**Summary**: You are free to use, modify, and distribute this software under the terms of the GPL-3.0 license. Any derivative works must also be licensed under GPL-3.0.

## Author & Acknowledgments

**Author**: Daniel Aagren Seehartrai Madsen

**Mission**: Simplifying ServiceNow administration through modern development practices and developer-friendly tooling.

**Built With**:
- ServiceNow Fluent SDK (4.2.0)
- React 19
- TypeScript 5.5
- Love for automation and clean code

## Support

For questions, issues, or feature requests:
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/StoreAppUpdater/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/StoreAppUpdater/discussions)
- 📧 **Contact**: [Your contact method]

---

**⭐ If this tool saves you time, consider starring the repository!**
   gs.info('Result: ' + result);
   ```

#### Common Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist/ .now/

# Rebuild from scratch
npm run build
```

### Code Style & Best Practices

#### React/TypeScript
- Use functional components with hooks (no class components)
- Prefer `const` over `let`, avoid `var`
- Use TypeScript interfaces for props and state
- Extract reusable logic into custom hooks
- Keep components focused (single responsibility)

#### ServiceNow Server-Side
- Always use `try-catch` blocks in ScriptInclude methods
- Return JSON strings (use `JSON.stringify()`)
- Log errors with `gs.error()` for troubleshooting
- Validate input parameters before processing
- Use `GlideRecord` with proper query encoding

#### Fluent Metadata
- Use `$id` constants for all records
- Reference parent objects via `parent.$id`, not `Now.ID[...]`
- Add comments explaining complex configurations
- Keep metadata files focused on single domains*Auto-Refresh Delay** | 3000ms | `app.tsx` | Delay after update check before refresh |
| **Completion Delay** | 3000ms | `app.tsx` | Time to show success before clearing |

### ServiceNow APIs Used

| API | Method | Purpose |
|-----|--------|---------|
| `sn_appclient.UpdateChecker` | `checkAvailableUpdates()` | Query store for latest versions |
| `sn_appclient.AppUpgrader` | `installBatch(data)` | Create batch installation plan |
| `GlideRecord` | CRUD operations | Query/update sys_store_app, sys_batch_install_plan |
| `GlideAjax` | Client-server communication | Async calls from React to ScriptInclude |
| `AbstractAjaxProcessor` | Base class | Enables client-callable server methods
src/
├── client/                         # React application
│   ├── app.tsx                    # Main component with state management
│   ├── app.css                    # ServiceNow-aligned styles
│   ├── types.ts                   # TypeScript interfaces
│   ├── components/
│   │   ├── AppListTable.tsx       # Searchable, paginated app list
│   │   ├── ActionBar.tsx          # Update controls
│   │   └── ProgressTracker.tsx    # Real-time progress
│   └── services/
│       └── StoreAppService.ts     # GlideAjax client
│
└── fluent/                         # ServiceNow metadata
    ├── application-menu.now.ts    # Application menu
    ├── navigation-module.now.ts   # Navigator module
    ├── ui-pages/
    │   └── store-app-updater.now.ts
    └── script-includes/
        ├── store-app-manager.now.ts
        └── store-app-manager.server.js
```

## Configuration

### Application Details

| Property | Value |
|----------|-------|
| Scope | `x_1118332_store_ap` |
| App Name | Store App Update Manager |
| UI Endpoint | `x_1118332_store_ap_updater.do` |

### Query Filters

Apps are filtered by:
- `install_date IS NOT EMPTY` (installed apps only)
- `hide_on_ui = false` (visible apps)
- `vendor = ServiceNow OR vendor IS EMPTY`

### Customization

| Setting | Default | Location |
|---------|---------|----------|
| Demo Data | `false` | `StoreAppService.ts` |
| Polling Interval | 3 seconds | `ProgressTracker.tsx` |
| Default Page Size | 10 items | `AppListTable.tsx` |
| Page Size Options | 5, 10, 25, 50, 100 | `AppListTable.tsx` |
| Batch Name | "Store App Updates" | `store-app-manager.server.js` |

## Development

### Available Commands

```bash
npm run build        # Build the Fluent application
npm run deploy       # Deploy to ServiceNow instance
npm run transform    # Sync remote metadata locally
npm run types        # Download ServiceNow type definitions
```

### Development Workflow

```bash
# Make changes to source files
# Then rebuild and deploy
npm run build && npm run deploy

# Pull changes from instance
now-sdk transform --auth <alias>
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No apps showing | Verify vendor is ServiceNow, `hide_on_ui=false`, and apps are installed. Try "Check for Updates". |
| Search not working | Clear browser cache, verify React state is updating. Check console for errors. |
| Pagination issues | Ensure `filteredApps` length is calculated correctly. Check page calculations in browser console. |
| Updates failing | Check batch install plan, verify permissions, review system logs. |
| Progress not updating | Check browser console, verify GlideAjax calls, ensure batch_installation_id is valid. |
| Build errors | Run `npm install`, verify Node.js 14.x+, check ServiceNow CLI configuration. |

## Contributing

Contributions are welcome! Whether it's bug reports, feature requests, code contributions, or documentation improvements.

**To contribute:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the terms included in the [LICENSE](LICENSE) file.

## Author

Daniel Aagren Seehartrai Madsen

Dedicated to simplifying ServiceNow administration through modern development practices.
