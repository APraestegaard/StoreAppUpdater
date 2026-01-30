# Store App Update Manager

![Version](https://img.shields.io/badge/version-0.0.1-blue) ![ServiceNow](https://img.shields.io/badge/ServiceNow-Fluent%20SDK-green) ![React](https://img.shields.io/badge/React-19-blue)

A modern, full-stack React application for ServiceNow that simplifies the management and updating of store applications. Built with the ServiceNow Fluent SDK, this tool provides a centralized interface for keeping your instance up to date with minimal effort.

## Overview

Managing store app updates in ServiceNow can be tedious and time-consuming. **Store App Update Manager** solves this problem by automatically identifying apps with available updates and enabling bulk updates with real-time progress tracking.

**Key Benefits:**
- Automatically scans your instance for apps needing updates
- Update multiple apps with a single click
- Real-time progress monitoring with auto-polling
- Native ServiceNow UI that feels integrated, not bolted on

## Installation & Usage

### Prerequisites

- ServiceNow instance (current release)
- Node.js 14.x or higher
- ServiceNow CLI (`@servicenow/sdk`)

### Quick Start

1. Clone and install dependencies:
```bash
git clone https://github.com/yourusername/StoreAppUpdater.git
cd StoreAppUpdater
npm install
```

2. Authenticate with your ServiceNow instance:
```bash
now-sdk auth
```

3. Build and deploy:
```bash
npm run build
npm run deploy
```

4. Access the application:
   - Navigate to **Store App Manager > Update Manager** in ServiceNow
   - Or go directly to: `https://your-instance.service-now.com/x_1118332_store_ap_updater.do`

### Recommended Workflow

**For individual apps:**
1. Review the list of apps with available updates
2. Select apps using checkboxes
3. Click **Update Selected** and confirm
4. Monitor progress in the Progress Tracker

**For bulk updates:**
1. Click **Update All** to update every app
2. Confirm the bulk action
3. Track real-time progress as installations proceed

**To refresh from store:**
- Click **Check for Updates** to query the ServiceNow store
- Wait for completion (may take several minutes)
- List refreshes automatically with new updates

## Features

### Intelligent Version Management
- Automatic discovery of apps with available updates
- Semantic version comparison (e.g., 2.1.3 vs 2.2.0)
- Duplicate handling for multiple installed versions
- Vendor filtering (ServiceNow apps)

### Flexible Update Options
- **Selective Updates**: Choose specific apps to update
- **Bulk Updates**: Update all apps with one click
- **Store Refresh**: Query for latest available versions
- **Progress Tracking**: Real-time status with auto-polling

### Native Integration
- UI matches ServiceNow's design system
- Seamless Application Navigator integration
- Direct links to Batch Install Plans and Execution Trackers
- Confirmation dialogs and error handling

## Architecture

Built with modern web technologies and ServiceNow best practices.

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript |
| UI Components | AppListTable, ActionBar, ProgressTracker |
| Service Layer | GlideAjax client wrapper |
| Backend | ServiceNow Fluent SDK |
| Server Logic | ScriptInclude with clientCallable |
| APIs | sn_appclient.AppUpgrader, UpdateChecker |

### How It Works

```
User Action → React Component → StoreAppService (GlideAjax)
     ↓
StoreAppManager (ScriptInclude) → ServiceNow APIs
     ↓
sys_store_app query → Batch Install → Progress Polling
     ↓
UI Update with real-time status
```

**Version Comparison:**
```javascript
installedVersion = "2.1.3" → [2, 1, 3]
latestVersion = "2.2.0"    → [2, 2, 0]
// Component-by-component: 2===2, 1<2 → Update Available
```

## Project Structure

```
src/
├── client/                         # React application
│   ├── app.tsx                    # Main component
│   ├── app.css                    # ServiceNow-aligned styles
│   ├── types.ts                   # TypeScript interfaces
│   ├── components/
│   │   ├── AppListTable.tsx       # App list with selection
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
