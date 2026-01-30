# Store App Update Manager

> A modern, full-stack React application for ServiceNow that simplifies the management and updating of store applications. Built with the ServiceNow Fluent SDK, this tool provides a centralized interface for keeping your instance up to date with minimal effort.

## Why This Matters

Managing store app updates in ServiceNow can be tedious and time-consuming. Administrators often need to check each application individually, determine if updates are available, and install them one by one. **Store App Update Manager** solves this problem by:

- Automatically identifying all apps with available updates
- Enabling bulk updates with a single click
- Providing real-time progress tracking during installations
- Offering a clean, intuitive interface that feels native to ServiceNow

Whether you're managing a handful of apps or dozens, this tool will save you hours of manual work.

---

## Key Features

### Intelligent App Discovery
Automatically scans your ServiceNow instance to identify store applications with available updates. The smart filtering system:
- Detects version differences using semantic version comparison
- Removes duplicate entries when multiple versions exist
- Filters by vendor and installation status
- Displays current vs. latest version for easy comparison

### Flexible Update Options
Choose the update strategy that fits your workflow:
- **Selective Updates** - Pick specific apps using checkboxes
- **Bulk Updates** - Update everything with one click
- **Store Refresh** - Query ServiceNow store for the latest available versions
- **Progress Monitoring** - Real-time status updates with auto-polling every 3 seconds

### Native ServiceNow Experience
Designed to feel like an integral part of the ServiceNow platform:
- UI styling matches ServiceNow's design system
- Seamless integration with Application Navigator
- Direct links to Batch Install Plans and Execution Trackers
- Responsive feedback with loading states and notifications

### Safety First
Built-in safeguards to prevent mistakes:
- Confirmation dialogs before bulk operations
- Clear status indicators throughout the process
- Comprehensive error handling and messaging
- Empty state guidance when everything is up to date

---

## Screenshots

> Coming soon - screenshots of the application in action

---

## Quick Start

### Prerequisites

| Requirement | Version |
|------------|---------|
| ServiceNow Instance | Current release |
| Node.js | 14.x or higher |
| ServiceNow CLI | Latest |

### Installation

**1. Clone and Install**
```bash
git clone https://github.com/yourusername/StoreAppUpdater.git
cd StoreAppUpdater
npm install
```

**2. Authenticate with ServiceNow**
```bash
now-sdk auth
```
Follow the prompts to connect to your instance.

**3. Build and Deploy**
```bash
npm run build
npm run deploy
```

**4. Access the Application**

Navigate to **Store App Manager > Update Manager** in your ServiceNow navigator, or go directly to:
```
https://your-instance.service-now.com/x_1118332_store_ap_updater.do
```

---

## How to Use

### Basic Workflow

**Check for Apps Needing Updates**
1. Open the Store App Update Manager from the navigation menu
2. The application automatically lists all apps with available updates
3. Review the current and latest versions displayed in the table

**Update Specific Apps**
1. Check the boxes next to apps you want to update
2. Click **Update Selected**
3. Confirm when prompted
4. Monitor real-time progress in the Progress Tracker

**Update All Apps at Once**
1. Click **Update All** to update every app in the list
2. Confirm the bulk update action
3. Track progress as the batch installation proceeds
4. The list automatically refreshes when complete

**Refresh from Store**
1. Click **Check for Updates** to query the ServiceNow store
2. Wait for the operation to complete (may take a few minutes)
3. New updates will appear in the refreshed list

---

## Technical Architecture

Built with modern web technologies and ServiceNow best practices:

### Frontend Stack
- **React 19** with functional components and hooks
- **TypeScript** for type safety and better developer experience
- **Modular Component Architecture** for maintainability
- **Service Layer Pattern** for clean API abstraction

### Backend Stack
- **ServiceNow Fluent SDK** for metadata-driven development
- **GlideAjax** for efficient client-server communication
- **ScriptInclude** with proper security flags
- **Batch Installation API** for reliable update processing

### Application Structure

```
src/
├── client/                              # React frontend
│   ├── app.tsx                         # Main application component
│   ├── app.css                         # ServiceNow-aligned styles
│   ├── types.ts                        # TypeScript interfaces
│   ├── components/
│   │   ├── AppListTable.tsx           # App list with selection
│   │   ├── ActionBar.tsx              # Update action buttons
│   │   └── ProgressTracker.tsx        # Real-time progress display
│   └── services/
│       └── StoreAppService.ts         # GlideAjax client wrapper
└── fluent/                             # ServiceNow Fluent metadata
    ├── application-menu.now.ts        # Application menu definition
    ├── navigation-module.now.ts       # Navigator module
    ├── ui-pages/
    │   └── store-app-updater.now.ts  # UI Page definition
    └── script-includes/
        ├── store-app-manager.now.ts   # ScriptInclude metadata
        └── store-app-manager.server.js # Server-side logic
```



## How It Works

### Version Comparison Algorithm
The application uses semantic version comparison to determine if updates are available:
- Splits versions into numeric components (e.g., "2.1.3" → [2, 1, 3])
- Compares each component left-to-right
- Returns true if any installed component is less than the latest

### Batch Installation Process
1. Constructs a batch install payload with selected apps
2. Calls `sn_appclient.AppUpgrader().installBatch()` API
3. Receives batch_installation_id and execution_tracker_id
4. Polls `sys_batch_install_plan` for status updates
5. Updates progress bar based on completed vs. total apps
6. Provides direct links to monitor detailed progress

### Data Flow
```
User Action → React Component → StoreAppService (GlideAjax) 
→ StoreAppManager (ScriptInclude) → ServiceNow APIs 
→ Response → State Update → UI Refresh
```

---

## Configuration

### Application Details

| Property | Value |
|----------|-------|
| Scope Name | `x_1118332_store_ap` |
| Scope ID | `19b7e260b6f948499ce7e3e2de0e06af` |
| App Name | Store App Update Manager |
| UI Endpoint | `x_1118332_store_ap_updater.do` |

### Query Filters

The application uses the following filters when querying `sys_store_app`:

---

## Development

### Available NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile the Fluent application |
| `npm run deploy` | Deploy to your ServiceNow instance |
| `npm run transform` | Sync remote metadata to local files |
| `npm run types` | Download ServiceNow type definitions |

### Development Workflow

**Making Changes**
```bash
# Edit source files in src/client or src/fluent
# Then rebuild and deploy

npm run build
npm run deploy
```

**Syncing from Instance**
```bash
# Pull changes made directly in ServiceNow
now-sdk transform --auth <alias>
```

**Type Definitions**
```bash
# Get latest ServiceNow API types
npm run types
```

### Project Structure Deep Dive

```
StoreAppUpdater/
├── src/
│   ├── client/                    # React application
│   │   ├── app.tsx               # Main app component
│   │   ├── app.css               # ServiceNow-aligned styles
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── AppListTable.tsx      # App list with selection
│   │   │   ├── ActionBar.tsx         # Update controls
│   │   │   └── ProgressTracker.tsx   # Real-time progress
│   │   └── services/
│   │       └── StoreAppService.ts    # API client
│   │
│   └── fluent/                    # ServiceNow metadata
│       ├── index.now.ts              # Main export
│       ├── application-menu.now.ts   # Navigator menu
│       ├── navigation-module.now.ts  # Menu module
│       ├── ui-pages/
│       │   └── store-app-updater.now.ts
│       └── script-includes/
│           ├── store-app-manager.now.ts
│           └── store-app-manager.server.js
│
├── dist/                          # Build output
├── now.config.json               # SDK configuration
└── package.json                  # Dependencies
### Building from Source

```bash
# Build only
now-sdk build

# Build and install
now-sdk build && now-sdk install --auth <alias>

# Transform remote changes
now-sdk transform --auth <alias>
---
---

## Roadmap

We're continuously improving the Store App Update Manager. Here's what's planned:

### Planned Features

**Analytics Dashboard**
- Visual charts showing update history
- Statistics on update frequency and success rates
- Trend analysis over time

**Enhanced Filtering**
- Filter by vendor, version, or install date
- Search functionality for app names
- Custom filter presets

**Notification System**
- Email notifications when updates complete
- Configurable alerts for failed updates
- Summary reports for administrators

**Advanced Configuration**
- Per-app demo data preferences
- Scheduled automatic updates
- Update policies and approval workflows

**History Tracking**
- Complete audit log of all updates
- Rollback capabilities
- Version history comparison

### Contributing

We welcome contributions! Whether it's:
- Bug reports and feature requests
- Code contributions via pull requests
- Documentation improvements
- Sharing your use cases and experiences

**To contribute:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code patterns
- Use TypeScript for new client code
- Add comments for complex logic
- Test your changes thoroughly

---

## License

This project is licensed under the terms included in the [LICENSE](LICENSE) file.

---

## Acknowledgments

Built with the ServiceNow Fluent SDK and modern web technologies. Special thanks to the ServiceNow developer community for inspiration and best practices.

---

## Support and Community

**Found a bug?** Open an issue on GitHub with details about your environment and steps to reproduce.

**Have a question?** Check the troubleshooting section first, then open a discussion on GitHub.

**Want to share your experience?** We'd love to hear how you're using the Store App Update Manager!

---

**Made with care for the ServiceNow community**
The update process follows these steps:

1. **Payload Construction** - Builds a batch install request with app metadata
2. **API Invocation** - Calls `sn_appclient.AppUpgrader().installBatch()`
3. **Tracking Setup** - Receives batch_installation_id and execution_tracker_id
4. **Status Polling** - Queries `sys_batch_install_plan` every 3 seconds
5. **Progress Display** - Updates UI with completion percentage
6. **Auto Refresh** - Reloads app list when installation completes

### Data Architecture

```
┌─────────────────┐
│  React Frontend │
│   (TypeScript)  │
└────────┬────────┘
         │ GlideAjax
         ▼
┌─────────────────┐
│ StoreAppService │
│  (Client Layer) │
└────────┬────────┘
         │ AJAX Call
         ▼
┌─────────────────┐
│ StoreAppManager │
│ (ScriptInclude) │
└────────┬────────┘
         │ GlideRecord / APIs
         ▼
┌─────────────────┐
│ ServiceNow APIs │
│  sys_store_app  │
└─────────────────┘d

## Future Enhancements

Potential features for future releases:
- Visual analytics and charts
- Update history tracking
- Advanced filtering options
- Configurable demo data per app
- Email notifications on completion
- Scheduled automatic updates

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here]

## Support

For issues or questions, [add support contact information]
