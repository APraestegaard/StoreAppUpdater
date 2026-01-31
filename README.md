# Store App Update Manager

![Version](https://img.shields.io/badge/version-0.0.1-blue) ![ServiceNow](https://img.shields.io/badge/ServiceNow-Fluent%20SDK%204.2-green) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue) ![License](https://img.shields.io/badge/license-GPL--3.0-blue)

Stop manually updating ServiceNow Store apps one-by-one. **Store App Update Manager** brings batch operations, real-time progress tracking, and smart conflict detection to your ServiceNow instance—all in a modern React interface.

## Why Use This?

Managing store app updates in ServiceNow is tedious: navigating multiple screens, manually checking versions, and babysitting installations. This tool solves that.

**What You Get:**
- **Batch Updates**: Update multiple apps with one click—no more repetitive manual work
- **Live Progress**: Real-time tracking shows exactly what's happening during updates
- **Smart Search**: Instantly filter hundreds of apps by name, vendor, or version
- **Conflict Detection**: Automatically detects and prevents conflicting batch installations
- **Installation History**: Full audit trail of past batch updates with timestamps and status
- **Native Design**: Seamlessly integrated with ServiceNow's UI—feels like it belongs there

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

## Key Features

### Batch Operations
Select multiple apps and update them all at once. Choose specific apps with checkboxes or use **Update All** for maintenance windows. The confirmation modal shows version changes and update types (Major/Minor/Patch) before you commit.

### Real-Time Progress Tracking
Watch updates happen live with a progress bar, completion counter, and direct links to batch plans and execution trackers. The interface automatically refreshes when installations complete—no more guessing if it's done.

### Installation History
View all past batch operations with timestamps, app counts, completion status, and creation details. Perfect for audits and troubleshooting.

### Intelligent Search & Filtering
Type to instantly search across app names, vendors, and versions. The search works in real-time with "No results" feedback. Handle large app portfolios with pagination (5-100 items per page).

### Conflict Prevention
The app automatically detects when another batch installation is running and disables update buttons with a clear info banner. No more mysterious failures from conflicting operations.

### Store Update Checker
Trigger ServiceNow's store checker to query for the latest versions available. The app notifies you when it's done and automatically refreshes the list with new updates.

## Architecture

Built with **React 19**, **TypeScript 5.5**, and **ServiceNow Fluent SDK 4.2**. The frontend uses React hooks for state management, while the backend leverages ServiceNow's `sn_appclient` APIs (AppUpgrader, UpdateChecker) through a GlideAjax service layer.

**Tech Stack:**
- Frontend: React 19, TypeScript, Custom CSS (ServiceNow design system)
- Backend: ScriptInclude extending AbstractAjaxProcessor
- Communication: GlideAjax with type-safe async wrappers
- ServiceNow APIs: GlideRecord, GlideAggregate, sn_appclient

## Development

```bash
npm run build        # Compile Fluent metadata and React app
npm run deploy       # Deploy to ServiceNow instance  
npm run transform    # Sync remote changes locally
npm run types        # Download ServiceNow type definitions
```

**Standard workflow:** Make changes → `npm run build && npm run deploy` → Test in instance

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No apps showing | Verify apps are installed, `hide_on_ui=false`, and vendor is ServiceNow. Try "Check for Updates". |
| Updates not starting | Check for in-progress batch (blue banner), verify admin permissions, review browser console and System Logs. |
| Progress stuck | Verify batch plan state in ServiceNow, check `sys_batch_install_item` records, ensure polling is running. |
| Build failures | Run `npm install`, check Node.js version (14.x+), verify `now.config.json` syntax. |
| Deploy failures | Verify authentication (`now-sdk auth`), check instance connectivity and scope permissions. |

## Contributing

Contributions welcome! Fork the repo, create a feature branch, test thoroughly, and open a pull request.

**When reporting bugs, include:**
- ServiceNow release version
- Steps to reproduce
- Error messages (console + System Logs)
- Screenshots if applicable

## License

Licensed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE) for details.

## Author

**Daniel Aagren Seehartrai Madsen**

Built with ServiceNow Fluent SDK, React, TypeScript, and a passion for making ServiceNow administration easier.

---

**Star this repo if it saves you time!**
