# Store App Update Manager

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![ServiceNow](https://img.shields.io/badge/ServiceNow-Fluent%20SDK%204.2-green) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue) ![License](https://img.shields.io/badge/license-GPL--3.0-blue)

Update multiple ServiceNow Store apps with one click. **Store App Update Manager** brings batch operations, real-time progress tracking, and intelligent safety checks to your instance—built with React, TypeScript, and ServiceNow Fluent SDK.

## Why Use This?

Updating apps manually wastes time: clicking through screens, checking versions one-by-one, waiting for installations. This tool automates the entire workflow.

**Key Benefits:**
- **Batch Updates**: Update 5, 10, or 50 apps at once—saves hours during maintenance windows
- **Safety First**: Detects unavailable apps, blocked versions, and installation conflicts before you click update
- **Live Progress**: Real-time tracking with completion percentages and direct links to batch plans
- **Smart Filtering**: Instant search across names, vendors, versions—plus filter by update type (Major/Minor/Patch)
- **Audit Trail**: Complete history of all batch operations with timestamps and detailed notes

## Quick Start

**Prerequisites:** ServiceNow instance with admin rights, Node.js 14.x+, ServiceNow SDK 4.2.0+

```bash
# 1. Clone and install
git clone https://github.com/yourusername/StoreAppUpdater.git
cd StoreAppUpdater
npm install

# 2. Authenticate with ServiceNow
now-sdk auth

# 3. Build and deploy
npm run build
npm run deploy
```

**Access the app:** Navigate to **Store App Manager > Update Manager** in your instance.

## Features

### Batch Operations
Select multiple apps and update them simultaneously. Checkboxes for precise control or **Update All** for full maintenance. Confirmation modal shows version changes (1.0 → 2.0), update types (Major/Minor/Patch), and dependencies before execution.

### Intelligent Safety Checks
Automatically detects and prevents problematic updates:
- **Unavailable Apps**: Identifies apps blocked by licensing, compatibility, or instance type
- **Blocked Versions**: Flags versions marked with `block_install` in ServiceNow
- **Conflict Detection**: Prevents new batches when another installation is in progress
- **Dependency Resolution**: Shows app dependencies with installation status

### Real-Time Progress Tracking
Live updates with progress bar, completion counter, and current app name. Direct links to batch install plans and execution trackers. Automatic refresh when complete—plus the ability to cancel in-progress batches.

### Smart Search & Filters
Instant search across app names, vendors, product families, and versions. Filter by update type (Major/Minor/Patch) or toggle unavailable apps. Pagination supports 5-100 items per view—handles large app portfolios smoothly.

### Complete Audit Trail
View all batch installations with timestamps, app counts, states, and detailed notes. Perfect for compliance audits and troubleshooting failed updates.

### Store Update Checker
One-click trigger for ServiceNow's update checker to query the latest store versions. Auto-refreshes your app list when complete.

## Architecture

Built with **React 19** + **TypeScript 5.5** + **ServiceNow Fluent SDK 4.2**. Modular server-side architecture with four utility classes handling validation, batch management, package preparation, and dependency resolution.

**Tech Stack:**
- **Frontend**: React hooks, custom ServiceNow-styled CSS, type-safe GlideAjax service layer
- **Backend**: Modular ScriptIncludes (363-line main orchestrator + 693 lines of focused utilities)
- **ServiceNow APIs**: GlideRecord, GlideAggregate, sn_appclient (AppUpgrader, UpdateChecker)
- **Error Handling**: Multi-layer null-safety checks, comprehensive error boundaries

## Development

```bash
npm run build        # Compile Fluent metadata + React bundle
npm run deploy       # Deploy to ServiceNow (or use now-sdk install)
npm run transform    # Sync remote changes to local
```

**Workflow:** Edit → `npm run build && npm run deploy` → Test in instance

**Files to know:**
- `src/fluent/script-includes/*.server.js` - ServiceNow server logic
- `src/client/` - React application (TypeScript)
- `src/server/` - Utility classes (validation, batch, package, dependencies)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No apps showing | Verify apps are installed, `hide_on_ui=false`, and vendor is ServiceNow. Try "Check for Updates". |
| Updates not starting | Check for in-progress batch (blue banner), verify admin permissions, review browser console and System Logs. |
| Progress stuck | Verify batch plan state in ServiceNow, check `sys_batch_install_item` records, ensure polling is running. |
| Build failures | Run `npm install`, check Node.js version (14.x+), verify `now.config.json` syntax. |
| Deploy failures | Verify authentication (`now-sdk auth`), check instance connectivity and scope permissions. |

## Contributing

Fork → Feature branch → Test → Pull request. When reporting bugs, include ServiceNow version, reproduction steps, error messages (console + System Logs), and screenshots.

## License

Licensed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE) for details.

## Author

**Daniel Aagren Seehartrai Madsen** • ServiceNow Rising Star 2025

Built with ServiceNow Fluent SDK, React, TypeScript, and a passion for making ServiceNow administration easier.

---

**Star this repo if it saves you time!**
