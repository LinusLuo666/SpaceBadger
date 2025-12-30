# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SpaceBadger** is a macOS storage analysis tool built with Electron, React, and TypeScript. The application helps users visualize disk space usage through interactive charts (Treemap, Sunburst) and track storage changes over time by comparing historical snapshots. Unlike cleaning tools, SpaceBadger is read-only and focuses on providing insights.

## Development Commands

### Setup
```bash
pnpm install
```

### Development
```bash
pnpm dev          # Start development server with hot reload
pnpm start        # Start Electron in preview mode
```

### Type Checking
```bash
pnpm typecheck         # Check both node and web TypeScript
pnpm typecheck:node    # Check main/preload process types
pnpm typecheck:web     # Check renderer process types
```

### Code Quality
```bash
pnpm lint              # Run ESLint
pnpm format            # Format code with Prettier
```

### Building
```bash
pnpm build             # Type check + build all processes
pnpm build:unpack      # Build without packaging (for testing)
pnpm build:mac         # Build macOS .dmg installer
pnpm build:win         # Build Windows installer
pnpm build:linux       # Build Linux packages (AppImage, snap, deb)
```

## Architecture

### Three-Process Model

This is a standard Electron application with three separate processes:

1. **Main Process** (`src/main/`)
   - Node.js environment running Electron
   - Manages application lifecycle, native OS interactions
   - Handles file system operations, window management
   - Will host: Scanner workers, SQLite database, IPC handlers

2. **Preload Scripts** (`src/preload/`)
   - Bridge between main and renderer processes
   - Exposes safe APIs to renderer via `contextBridge`
   - Type definitions in `index.d.ts`

3. **Renderer Process** (`src/renderer/`)
   - React application running in Chromium
   - UI components, state management, visualizations
   - Uses TypeScript and Vite for bundling
   - Alias `@renderer` points to `src/renderer/src`

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop Framework | Electron 39 | Cross-platform desktop runtime |
| UI Framework | React 19 | Component-based UI |
| Language | TypeScript 5.9 | Type safety |
| State Management | Zustand | Lightweight global state |
| Visualization | D3.js, ECharts | Interactive charts (Treemap, Sunburst) |
| Database | better-sqlite3 | Local snapshot storage |
| Build Tool | electron-vite | Fast Vite-based builds |
| Bundler | Vite 7 | Development and production bundling |
| Code Quality | ESLint, Prettier | Linting and formatting |

### Key Dependencies

- **better-sqlite3**: Synchronous SQLite3 bindings for storing scan snapshots
- **d3**: Data visualization library for Treemap rendering
- **echarts**: Charting library for Sunburst and trend visualizations
- **zustand**: State management (planned for UI state)
- **@electron-toolkit/***: Electron utilities, configs, and preload helpers

## Project Structure

```
src/
├── main/           # Main Electron process (Node.js)
│   └── index.ts    # App entry, window creation, IPC handlers
├── preload/        # Preload scripts (bridge layer)
│   ├── index.ts    # API exposure via contextBridge
│   └── index.d.ts  # Type definitions for renderer
└── renderer/       # React renderer process
    └── src/
        ├── App.tsx         # Root component
        ├── main.tsx        # React entry point
        ├── components/     # React components
        └── assets/         # Static assets
```

### TypeScript Configuration

- `tsconfig.json`: Root config with project references
- `tsconfig.node.json`: Main process + preload config
- `tsconfig.web.json`: Renderer process config

Builds are isolated: main/preload cannot import renderer code and vice versa.

## Core Planned Features

Based on the PRD (`mac-storage-analyzer-prd.md`):

1. **Directory Scanning**
   - Recursive file system traversal using Worker Threads
   - Permission handling for macOS protected directories
   - Progress tracking during scans
   - Store results as timestamped snapshots in SQLite

2. **Visualization**
   - **Treemap**: Nested rectangles showing directory hierarchy and sizes
   - **Sunburst Chart**: Radial hierarchy visualization
   - **Sorted List**: Quick access to largest directories
   - Color coding by directory type (system, user, media, etc.)

3. **Historical Comparison** (Differentiator)
   - Save multiple scan snapshots with timestamps
   - Compare two snapshots to identify growth/shrinkage
   - Highlight directories with significant size changes
   - Track storage trends over time

4. **Data Model**
   - SQLite tables: `snapshots`, `folder_nodes`, `settings`
   - Snapshots store: scan metadata, timestamp, directory tree
   - Folder nodes: flattened for efficient querying

## Development Guidelines

### IPC Communication

When adding main ↔ renderer communication:
1. Define handlers in `src/main/index.ts` using `ipcMain.on()` or `ipcMain.handle()`
2. Expose safe APIs in `src/preload/index.ts` via `exposeInMainWorld()`
3. Add TypeScript types in `src/preload/index.d.ts`
4. Access in renderer via `window.electron.*`

### Working with File System

- File scanning MUST run in Worker Threads to avoid blocking the UI
- Handle permission errors gracefully (many macOS directories are restricted)
- Consider memory constraints when scanning large directories
- Implement incremental rendering for large directory trees

### Database Schema

The SQLite schema is defined in the PRD. Key tables:
- `snapshots`: Scan metadata (id, name, scan_path, total_size, created_at)
- `folder_nodes`: Flattened directory structure (snapshot_id, path, name, size, depth)
- `settings`: Application preferences

Index on `snapshot_id`, `path`, and `size DESC` for performance.

### Visualization Implementation

- Use D3.js for Treemap layout (`d3.treemap()`)
- Implement virtual rendering for large node counts (only render visible depth levels)
- Color scale should differentiate directory types and highlight changes
- Support interactions: hover (tooltip), click (zoom in), breadcrumb navigation

### macOS Permissions

The app requests access to Documents and Downloads folders (see `electron-builder.yml`). When implementing scanning:
- Detect permission denial gracefully
- Provide user-friendly permission request dialogs
- Skip inaccessible directories without crashing
- Mark nodes as `isAccessible: false` in data model

## Build Configuration

- **electron-builder.yml**: Packaging configuration for all platforms
- **electron.vite.config.ts**: Build configuration (Vite for renderer, esbuild for main/preload)
- Output directory: `out/`
- Resources: `resources/` (icon.png, etc.)
- macOS entitlements: `build/entitlements.mac.plist`

## Important Notes

- This is a **read-only tool** - no file deletion or modification features
- Target platform is primarily macOS, but architecture supports cross-platform
- Performance is critical: scanning a 256GB SSD should complete in <30 seconds
- Memory usage should stay under 500MB during scans
- The PRD is in Chinese but contains comprehensive technical specifications
