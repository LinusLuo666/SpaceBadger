# SpaceBadger 开发计划

## 项目概述

基于 `mac-storage-analyzer-prd.md` 产品文档，SpaceBadger 是一个 macOS 存储分析工具，核心差异化功能是**历史对比与增长追踪**。

**当前状态：** 项目已完成基础脚手架搭建，所有核心依赖已安装（better-sqlite3, d3, echarts, zustand），但产品功能为零实现。

**开发周期：** 4周 MVP + 3周完整版 + 2周优化 = 共9周

---

## 开发阶段总览

| 阶段 | 时间 | 核心目标 | 关键交付物 |
|------|------|----------|-----------|
| **阶段 1: 基础架构** | Week 1 (5天) | 搭建技术骨架 | IPC通信、数据库、状态管理 |
| **阶段 2: 扫描引擎** | Week 2 (5天) | 文件系统扫描 | Worker Thread扫描器、进度追踪 |
| **阶段 3: 可视化核心** | Week 3 (5天) | Treemap图表 | D3.js Treemap、交互、导航 |
| **阶段 4: MVP集成** | Week 4 (5天) | 端到端流程 | 扫描→保存→展示完整链路 |
| **阶段 5: 对比分析** | Week 5-6 (10天) | 差异化功能 | 快照对比、增长排名、趋势图 |
| **阶段 6: 高级可视化** | Week 7 (5天) | 增强体验 | Sunburst图、多视图切换 |
| **阶段 7: 优化与发布** | Week 8-9 (10天) | 性能与稳定 | 性能优化、测试、打包 |

---

# 阶段 1: 基础架构 (Week 1 - 5天)

**目标：** 建立三进程通信架构、数据库基础、状态管理框架

## Day 1: 项目配置与类型系统

### 任务 1.1: 安装 Tailwind CSS (1h)
- **文件：** `package.json`, `tailwind.config.js`, `postcss.config.js`
- **操作：**
  ```bash
  pnpm add -D tailwindcss postcss autoprefixer
  pnpm exec tailwindcss init -p
  ```
- **配置 tailwind.config.js：**
  ```js
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}']
  ```
- **修改 `src/renderer/src/assets/index.css`：** 添加 Tailwind directives

### 任务 1.2: 定义 TypeScript 类型系统 (2h)
- **创建文件：** `src/types/index.ts`
- **内容：** 定义核心数据结构（参考 PRD 6.1节）
  ```typescript
  // Snapshot, FolderNode, ComparisonResult, DiffItem 等接口
  export interface Snapshot {
    id: string;
    name: string | null;
    createdAt: Date;
    scanPath: string;
    totalSize: number;
    fileCount: number;
    folderCount: number;
    scanDuration: number;
    rootNode: FolderNode;
  }

  export interface FolderNode {
    path: string;
    name: string;
    size: number;
    fileCount: number;
    children: FolderNode[];
    isAccessible: boolean;
  }

  export interface ComparisonResult {
    snapshotA: Snapshot;
    snapshotB: Snapshot;
    totalDiff: number;
    daysBetween: number;
    topGrowing: DiffItem[];
    topShrinking: DiffItem[];
  }

  export interface DiffItem {
    path: string;
    sizeA: number;
    sizeB: number;
    diff: number;
    diffPercent: number;
    status: 'new' | 'deleted' | 'modified';
  }
  ```

### 任务 1.3: 定义 IPC 通信协议 (2h)
- **创建文件：** `src/types/ipc.ts`
- **内容：** 定义所有 IPC 事件类型
  ```typescript
  // 扫描相关
  export type ScanStartPayload = { path: string };
  export type ScanProgressPayload = { currentPath: string; processedSize: number; percentage: number };
  export type ScanCompletePayload = { snapshot: Snapshot };

  // 数据库相关
  export type SaveSnapshotPayload = { snapshot: Snapshot };
  export type LoadSnapshotsPayload = { limit?: number };
  export type DeleteSnapshotPayload = { id: string };

  // 对比相关
  export type CompareSnapshotsPayload = { snapshotIdA: string; snapshotIdB: string };

  // IPC 频道名称常量
  export const IPC_CHANNELS = {
    // Scanner
    SCAN_START: 'scan:start',
    SCAN_PROGRESS: 'scan:progress',
    SCAN_COMPLETE: 'scan:complete',
    SCAN_ERROR: 'scan:error',
    SCAN_CANCEL: 'scan:cancel',

    // Database
    DB_SAVE_SNAPSHOT: 'db:saveSnapshot',
    DB_LOAD_SNAPSHOTS: 'db:loadSnapshots',
    DB_DELETE_SNAPSHOT: 'db:deleteSnapshot',
    DB_LOAD_SNAPSHOT_BY_ID: 'db:loadSnapshotById',

    // Comparison
    COMPARE_SNAPSHOTS: 'compare:snapshots',

    // System
    SYSTEM_SELECT_FOLDER: 'system:selectFolder',
    SYSTEM_OPEN_IN_FINDER: 'system:openInFinder',
  } as const;
  ```

## Day 2: SQLite 数据库集成

### 任务 1.4: 创建数据库管理器 (3h)
- **创建文件：** `src/main/database/DatabaseManager.ts`
- **功能：**
  - 初始化数据库连接（使用 better-sqlite3）
  - 创建表结构（snapshots, folder_nodes, settings）
  - 添加索引（参考 PRD 6.2节）
  ```typescript
  import Database from 'better-sqlite3';
  import { app } from 'electron';
  import path from 'path';

  export class DatabaseManager {
    private db: Database.Database;

    constructor() {
      const dbPath = path.join(app.getPath('userData'), 'spacebadger.db');
      this.db = new Database(dbPath);
      this.initializeSchema();
    }

    private initializeSchema(): void {
      // CREATE TABLE snapshots ...
      // CREATE TABLE folder_nodes ...
      // CREATE TABLE settings ...
      // CREATE INDEX ...
    }

    saveSnapshot(snapshot: Snapshot): void { /* ... */ }
    loadSnapshots(limit?: number): Snapshot[] { /* ... */ }
    loadSnapshotById(id: string): Snapshot | null { /* ... */ }
    deleteSnapshot(id: string): void { /* ... */ }
    getSetting(key: string): string | null { /* ... */ }
    setSetting(key: string, value: string): void { /* ... */ }
  }
  ```

### 任务 1.5: 数据库 CRUD 操作实现 (2h)
- **完善 DatabaseManager 方法：**
  - `saveSnapshot()`: 保存快照及文件夹节点（扁平化存储）
  - `loadSnapshots()`: 加载快照列表（不包含 rootNode，仅元数据）
  - `loadSnapshotById()`: 加载完整快照（包括重建 rootNode 树）
  - `deleteSnapshot()`: 删除快照及相关 folder_nodes
- **关键点：** 需要将树形 FolderNode 扁平化存储到 folder_nodes 表，加载时重建树

## Day 3: Zustand 状态管理

### 任务 1.6: 创建 Scanner Store (1.5h)
- **创建文件：** `src/renderer/src/store/useScannerStore.ts`
- **状态：**
  ```typescript
  interface ScannerState {
    isScanning: boolean;
    currentPath: string;
    progress: number;
    currentSnapshot: Snapshot | null;
    error: string | null;

    startScan: (path: string) => void;
    cancelScan: () => void;
    updateProgress: (data: ScanProgressPayload) => void;
    setSnapshot: (snapshot: Snapshot) => void;
    setError: (error: string) => void;
    reset: () => void;
  }
  ```

### 任务 1.7: 创建 Snapshot Store (1.5h)
- **创建文件：** `src/renderer/src/store/useSnapshotStore.ts`
- **状态：**
  ```typescript
  interface SnapshotState {
    snapshots: Snapshot[];
    selectedSnapshotId: string | null;
    isLoading: boolean;

    loadSnapshots: () => Promise<void>;
    selectSnapshot: (id: string) => void;
    deleteSnapshot: (id: string) => Promise<void>;
    refreshSnapshots: () => Promise<void>;
  }
  ```

### 任务 1.8: 创建 Comparison Store (1.5h)
- **创建文件：** `src/renderer/src/store/useComparisonStore.ts`
- **状态：**
  ```typescript
  interface ComparisonState {
    snapshotAId: string | null;
    snapshotBId: string | null;
    comparisonResult: ComparisonResult | null;
    isComparing: boolean;

    setSnapshotA: (id: string) => void;
    setSnapshotB: (id: string) => void;
    compare: () => Promise<void>;
    clearComparison: () => void;
  }
  ```

### 任务 1.9: 创建 UI Store (0.5h)
- **创建文件：** `src/renderer/src/store/useUIStore.ts`
- **状态：**
  ```typescript
  interface UIState {
    currentView: 'scan' | 'history' | 'compare' | 'settings';
    visualizationType: 'treemap' | 'sunburst' | 'list';
    currentPath: string; // 当前导航路径（用于面包屑）

    setView: (view: UIState['currentView']) => void;
    setVisualizationType: (type: UIState['visualizationType']) => void;
    navigateToPath: (path: string) => void;
  }
  ```

## Day 4-5: IPC 通信架构

### 任务 1.10: Main Process IPC Handlers (4h)
- **修改文件：** `src/main/index.ts`
- **实现：**
  ```typescript
  import { ipcMain, dialog } from 'electron';
  import { IPC_CHANNELS } from '../types/ipc';
  import { DatabaseManager } from './database/DatabaseManager';

  const dbManager = new DatabaseManager();

  // 文件夹选择
  ipcMain.handle(IPC_CHANNELS.SYSTEM_SELECT_FOLDER, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.filePaths[0];
  });

  // 数据库操作
  ipcMain.handle(IPC_CHANNELS.DB_SAVE_SNAPSHOT, (_, snapshot) => {
    dbManager.saveSnapshot(snapshot);
  });

  ipcMain.handle(IPC_CHANNELS.DB_LOAD_SNAPSHOTS, (_, limit) => {
    return dbManager.loadSnapshots(limit);
  });

  // ... 其他 handlers
  ```

### 任务 1.11: Preload API 暴露 (2h)
- **修改文件：** `src/preload/index.ts`
- **实现：**
  ```typescript
  import { contextBridge, ipcRenderer } from 'electron';
  import { IPC_CHANNELS } from '../types/ipc';

  const api = {
    scanner: {
      start: (path: string) => ipcRenderer.send(IPC_CHANNELS.SCAN_START, path),
      cancel: () => ipcRenderer.send(IPC_CHANNELS.SCAN_CANCEL),
      onProgress: (callback) => ipcRenderer.on(IPC_CHANNELS.SCAN_PROGRESS, (_, data) => callback(data)),
      onComplete: (callback) => ipcRenderer.on(IPC_CHANNELS.SCAN_COMPLETE, (_, data) => callback(data)),
      onError: (callback) => ipcRenderer.on(IPC_CHANNELS.SCAN_ERROR, (_, error) => callback(error)),
    },
    database: {
      saveSnapshot: (snapshot) => ipcRenderer.invoke(IPC_CHANNELS.DB_SAVE_SNAPSHOT, snapshot),
      loadSnapshots: (limit) => ipcRenderer.invoke(IPC_CHANNELS.DB_LOAD_SNAPSHOTS, limit),
      deleteSnapshot: (id) => ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_SNAPSHOT, id),
    },
    system: {
      selectFolder: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SELECT_FOLDER),
      openInFinder: (path) => ipcRenderer.send(IPC_CHANNELS.SYSTEM_OPEN_IN_FINDER, path),
    },
  };

  contextBridge.exposeInMainWorld('electron', api);
  ```

### 任务 1.12: 更新 Preload 类型定义 (1h)
- **修改文件：** `src/preload/index.d.ts`
- **同步 api 类型到 Window 接口**

---

# 阶段 2: 扫描引擎 (Week 2 - 5天)

**目标：** 实现高性能文件系统扫描，支持进度追踪和权限处理

## Day 6: Worker Thread 基础

### 任务 2.1: 创建 Scanner Worker (3h)
- **创建文件：** `src/main/workers/scanner.worker.ts`
- **功能：**
  ```typescript
  import { parentPort, workerData } from 'worker_threads';
  import fs from 'fs/promises';
  import path from 'path';

  interface ScanTask {
    rootPath: string;
  }

  async function scanDirectory(dirPath: string, depth = 0): Promise<FolderNode> {
    const name = path.basename(dirPath);
    const result: FolderNode = {
      path: dirPath,
      name,
      size: 0,
      fileCount: 0,
      children: [],
      isAccessible: true,
    };

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const child = await scanDirectory(fullPath, depth + 1);
          result.children.push(child);
          result.size += child.size;
        } else {
          try {
            const stats = await fs.stat(fullPath);
            result.size += stats.size;
            result.fileCount++;
          } catch {}
        }
      }

      // 定期报告进度（仅顶层目录）
      if (depth <= 2 && parentPort) {
        parentPort.postMessage({
          type: 'progress',
          path: dirPath,
          size: result.size,
        });
      }
    } catch (error) {
      result.isAccessible = false;
    }

    return result;
  }

  async function main() {
    const { rootPath } = workerData as ScanTask;
    const startTime = Date.now();

    try {
      const rootNode = await scanDirectory(rootPath);
      const scanDuration = Date.now() - startTime;

      parentPort?.postMessage({
        type: 'complete',
        rootNode,
        scanDuration,
      });
    } catch (error) {
      parentPort?.postMessage({
        type: 'error',
        error: error.message,
      });
    }
  }

  main();
  ```

### 任务 2.2: Scanner Manager (2h)
- **创建文件：** `src/main/scanner/ScannerManager.ts`
- **功能：** 管理 Worker Thread 生命周期
  ```typescript
  import { Worker } from 'worker_threads';
  import { BrowserWindow } from 'electron';
  import path from 'path';
  import { v4 as uuidv4 } from 'uuid';

  export class ScannerManager {
    private currentWorker: Worker | null = null;
    private mainWindow: BrowserWindow;

    constructor(mainWindow: BrowserWindow) {
      this.mainWindow = mainWindow;
    }

    startScan(scanPath: string): void {
      if (this.currentWorker) {
        this.cancelScan();
      }

      const workerPath = path.join(__dirname, '../workers/scanner.worker.js');
      this.currentWorker = new Worker(workerPath, {
        workerData: { rootPath: scanPath }
      });

      this.currentWorker.on('message', (msg) => {
        if (msg.type === 'progress') {
          this.mainWindow.webContents.send('scan:progress', {
            currentPath: msg.path,
            processedSize: msg.size,
            percentage: 0, // TODO: 计算百分比
          });
        } else if (msg.type === 'complete') {
          const snapshot: Snapshot = {
            id: uuidv4(),
            name: null,
            createdAt: new Date(),
            scanPath,
            totalSize: msg.rootNode.size,
            fileCount: this.countFiles(msg.rootNode),
            folderCount: this.countFolders(msg.rootNode),
            scanDuration: msg.scanDuration,
            rootNode: msg.rootNode,
          };
          this.mainWindow.webContents.send('scan:complete', snapshot);
          this.currentWorker = null;
        } else if (msg.type === 'error') {
          this.mainWindow.webContents.send('scan:error', msg.error);
          this.currentWorker = null;
        }
      });

      this.currentWorker.on('error', (error) => {
        this.mainWindow.webContents.send('scan:error', error.message);
        this.currentWorker = null;
      });
    }

    cancelScan(): void {
      if (this.currentWorker) {
        this.currentWorker.terminate();
        this.currentWorker = null;
      }
    }

    private countFiles(node: FolderNode): number {
      return node.fileCount + node.children.reduce((sum, child) => sum + this.countFiles(child), 0);
    }

    private countFolders(node: FolderNode): number {
      return 1 + node.children.reduce((sum, child) => sum + this.countFolders(child), 0);
    }
  }
  ```

## Day 7: 扫描器集成与优化

### 任务 2.3: 集成 Scanner 到 Main Process (2h)
- **修改文件：** `src/main/index.ts`
- **添加：**
  ```typescript
  import { ScannerManager } from './scanner/ScannerManager';

  let scannerManager: ScannerManager;

  function createWindow(): void {
    const mainWindow = new BrowserWindow({ /* ... */ });
    scannerManager = new ScannerManager(mainWindow);
    // ...
  }

  ipcMain.on(IPC_CHANNELS.SCAN_START, (_, path) => {
    scannerManager.startScan(path);
  });

  ipcMain.on(IPC_CHANNELS.SCAN_CANCEL, () => {
    scannerManager.cancelScan();
  });
  ```

### 任务 2.4: 优化进度计算 (2h)
- **修改 `ScannerManager.ts`：**
  - 预估总大小（通过快速扫描或历史数据）
  - 实现准确的进度百分比计算
  - 添加速度估算和剩余时间

### 任务 2.5: 权限处理优化 (2h)
- **修改 `scanner.worker.ts`：**
  - 捕获 EACCES, EPERM 错误
  - 标记 `isAccessible: false`
  - 记录无法访问的路径列表
  - 在完成消息中返回权限问题摘要

### 任务 2.6: 性能测试与调优 (2h)
- **测试场景：**
  - 小目录（< 1GB）
  - 中等目录（10-50GB）
  - 大目录（100GB+）
  - 包含大量小文件的目录（node_modules）
- **优化点：**
  - 调整进度报告频率（避免过度 IPC 通信）
  - 考虑忽略某些系统目录（.git, .Trash等）
  - 内存占用监控

## Day 8-10: UI 基础组件

### 任务 2.7: 创建扫描控制面板 (3h)
- **创建文件：** `src/renderer/src/components/ScanControl.tsx`
- **功能：**
  - 选择文件夹按钮
  - 开始/取消扫描按钮
  - 进度条显示
  - 当前路径显示
  - 扫描统计（已处理大小、速度、预计剩余时间）
  ```tsx
  import { useScannerStore } from '../store/useScannerStore';

  export function ScanControl() {
    const { isScanning, progress, currentPath, startScan, cancelScan } = useScannerStore();

    const handleSelectFolder = async () => {
      const path = await window.electron.system.selectFolder();
      if (path) {
        startScan(path);
      }
    };

    return (
      <div className="scan-control">
        {!isScanning ? (
          <button onClick={handleSelectFolder}>选择文件夹扫描</button>
        ) : (
          <>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="current-path">{currentPath}</div>
            <button onClick={cancelScan}>取消</button>
          </>
        )}
      </div>
    );
  }
  ```

### 任务 2.8: 实现扫描结果保存流程 (2h)
- **修改 `useScannerStore.ts`：**
  - 监听 `scan:complete` 事件
  - 自动调用 `window.electron.database.saveSnapshot()`
  - 保存成功后刷新快照列表
  - 跳转到可视化视图

### 任务 2.9: 创建基础布局框架 (3h)
- **创建文件：** `src/renderer/src/components/Layout.tsx`
- **结构：**
  ```tsx
  <div className="app-layout">
    <Sidebar />
    <main className="main-content">
      {currentView === 'scan' && <ScanView />}
      {currentView === 'history' && <HistoryView />}
      {currentView === 'compare' && <CompareView />}
    </main>
  </div>
  ```

### 任务 2.10: 创建侧边栏导航 (2h)
- **创建文件：** `src/renderer/src/components/Sidebar.tsx`
- **功能：** 4个导航按钮（扫描/历史/对比/设置）

---

# 阶段 3: 可视化核心 (Week 3 - 5天)

**目标：** 实现 Treemap 可视化、交互、导航

## Day 11-12: Treemap 基础实现

### 任务 3.1: 创建 Treemap 组件 (4h)
- **创建文件：** `src/renderer/src/components/Treemap/Treemap.tsx`
- **使用 D3.js：**
  ```tsx
  import { useEffect, useRef } from 'react';
  import * as d3 from 'd3';
  import { FolderNode } from '../../../types';

  interface TreemapProps {
    data: FolderNode;
    onNodeClick: (node: FolderNode) => void;
  }

  export function Treemap({ data, onNodeClick }: TreemapProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
      if (!svgRef.current || !data) return;

      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;

      // 清空旧内容
      d3.select(svgRef.current).selectAll('*').remove();

      // 创建 treemap 布局
      const treemap = d3.treemap()
        .size([width, height])
        .paddingInner(2)
        .paddingOuter(4)
        .round(true);

      // 构建层级结构
      const root = d3.hierarchy(data)
        .sum(d => d.size)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      treemap(root);

      // 创建 SVG 容器
      const svg = d3.select(svgRef.current);

      // 渲染节点
      const nodes = svg.selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

      // 绘制矩形
      nodes.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => getColorByDepth(d.depth))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('click', (event, d) => {
          event.stopPropagation();
          onNodeClick(d.data);
        })
        .on('mouseenter', (event, d) => {
          // TODO: 显示 tooltip
        });

      // 添加文本标签（仅足够大的节点）
      nodes.append('text')
        .attr('x', 4)
        .attr('y', 16)
        .text(d => {
          const width = d.x1 - d.x0;
          return width > 60 ? d.data.name : '';
        })
        .attr('font-size', 12)
        .attr('fill', '#000');

    }, [data, onNodeClick]);

    return <svg ref={svgRef} className="treemap-svg" />;
  }

  function getColorByDepth(depth: number): string {
    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
    return colors[Math.min(depth, colors.length - 1)];
  }
  ```

### 任务 3.2: 颜色编码系统 (2h)
- **创建文件：** `src/renderer/src/utils/colorUtils.ts`
- **功能：** 根据目录类型返回颜色
  ```typescript
  export function getColorForPath(path: string): string {
    if (path.includes('/Library') || path.includes('/System')) return '#9ca3af'; // 灰色 - 系统
    if (path.includes('/Documents') || path.includes('/Desktop')) return '#3b82f6'; // 蓝色 - 文档
    if (path.includes('/Pictures') || path.includes('/Movies') || path.includes('/Music')) return '#a855f7'; // 紫色 - 媒体
    if (path.includes('/Applications')) return '#10b981'; // 绿色 - 应用
    if (path.includes('/Downloads')) return '#f59e0b'; // 橙色 - 下载
    return '#6b7280'; // 默认灰色
  }
  ```

### 任务 3.3: Tooltip 组件 (2h)
- **创建文件：** `src/renderer/src/components/Treemap/Tooltip.tsx`
- **显示：** 完整路径、精确大小、文件数、占比

## Day 13: 交互功能

### 任务 3.4: Zoom In 功能 (3h)
- **修改 `Treemap.tsx`：**
  - 点击节点时重新渲染以该节点为根的 treemap
  - 添加动画过渡效果
  ```typescript
  const [currentRoot, setCurrentRoot] = useState<FolderNode>(data);

  const handleNodeClick = (node: FolderNode) => {
    setCurrentRoot(node);
    onNodeClick(node);
  };
  ```

### 任务 3.5: 面包屑导航 (2h)
- **创建文件：** `src/renderer/src/components/Breadcrumb.tsx`
- **功能：**
  - 显示当前路径层级
  - 点击任意层级可返回
  ```tsx
  export function Breadcrumb({ currentPath, onNavigate }) {
    const parts = currentPath.split('/').filter(Boolean);

    return (
      <div className="breadcrumb">
        <button onClick={() => onNavigate('/')}>Root</button>
        {parts.map((part, index) => (
          <Fragment key={index}>
            <span>/</span>
            <button onClick={() => onNavigate('/' + parts.slice(0, index + 1).join('/'))}>
              {part}
            </button>
          </Fragment>
        ))}
      </div>
    );
  }
  ```

### 任务 3.6: 右键菜单 (2h)
- **功能：**
  - 在 Finder 中显示
  - 复制路径
  - （可选）排除此目录

## Day 14-15: 列表视图与详情面板

### 任务 3.7: 创建列表视图组件 (3h)
- **创建文件：** `src/renderer/src/components/ListView/ListView.tsx`
- **功能：**
  - 表格形式展示文件夹
  - 支持按大小/名称排序
  - 点击进入子目录
  ```tsx
  export function ListView({ data }: { data: FolderNode }) {
    const [sortedChildren, setSortedChildren] = useState(data.children);

    const handleSort = (key: 'name' | 'size') => {
      const sorted = [...sortedChildren].sort((a, b) => {
        if (key === 'size') return b.size - a.size;
        return a.name.localeCompare(b.name);
      });
      setSortedChildren(sorted);
    };

    return (
      <table className="list-view">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>名称</th>
            <th onClick={() => handleSort('size')}>大小</th>
            <th>文件数</th>
          </tr>
        </thead>
        <tbody>
          {sortedChildren.map(child => (
            <tr key={child.path}>
              <td>{child.name}</td>
              <td>{formatSize(child.size)}</td>
              <td>{child.fileCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  ```

### 任务 3.8: 详情信息面板 (2h)
- **创建文件：** `src/renderer/src/components/DetailPanel.tsx`
- **显示：**
  - 当前路径
  - 总大小
  - 文件数
  - 子文件夹数
  - 最大的前5个子文件夹

### 任务 3.9: 工具函数库 (2h)
- **创建文件：** `src/renderer/src/utils/formatters.ts`
  ```typescript
  export function formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  export function formatDate(date: Date): string {
    return date.toLocaleString('zh-CN');
  }

  export function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分${seconds % 60}秒`;
  }
  ```

---

# 阶段 4: MVP 集成 (Week 4 - 5天)

**目标：** 打通扫描→保存→展示完整流程，形成可用 MVP

## Day 16-17: 视图整合

### 任务 4.1: 创建扫描视图 (3h)
- **创建文件：** `src/renderer/src/views/ScanView.tsx`
- **内容：**
  - 无快照时：显示 `<ScanControl />` + 欢迎引导
  - 扫描中：显示进度条和当前路径
  - 扫描完成：自动切换到可视化展示

### 任务 4.2: 创建历史视图 (3h)
- **创建文件：** `src/renderer/src/views/HistoryView.tsx`
- **功能：**
  - 加载并显示快照列表（卡片形式）
  - 每个卡片显示：名称、路径、时间、总大小
  - 点击卡片加载该快照并显示可视化
  - 删除按钮

### 任务 4.3: 创建可视化容器组件 (2h)
- **创建文件：** `src/renderer/src/components/VisualizationContainer.tsx`
- **功能：**
  - 切换 Treemap / ListView
  - 整合 Breadcrumb + DetailPanel
  ```tsx
  export function VisualizationContainer({ snapshot }: { snapshot: Snapshot }) {
    const { visualizationType } = useUIStore();
    const [currentNode, setCurrentNode] = useState(snapshot.rootNode);

    return (
      <div className="visualization-container">
        <div className="view-switcher">
          <button onClick={() => setVisualizationType('treemap')}>Treemap</button>
          <button onClick={() => setVisualizationType('list')}>列表</button>
        </div>

        <Breadcrumb currentPath={currentNode.path} onNavigate={handleNavigate} />

        {visualizationType === 'treemap' ? (
          <Treemap data={currentNode} onNodeClick={setCurrentNode} />
        ) : (
          <ListView data={currentNode} />
        )}

        <DetailPanel node={currentNode} />
      </div>
    );
  }
  ```

## Day 18: IPC 调试与优化

### 任务 4.4: 端到端测试 (4h)
- **测试流程：**
  1. 启动应用 → 选择文件夹 → 开始扫描
  2. 观察进度条更新
  3. 扫描完成自动保存
  4. Treemap 正确渲染
  5. 交互功能正常（点击、导航、tooltip）
  6. 切换到历史视图查看快照
  7. 删除快照

### 任务 4.5: 错误处理完善 (2h)
- **添加：**
  - 扫描失败的错误提示
  - 数据库操作失败的处理
  - 无权限目录的友好提示

### 任务 4.6: 性能优化 (2h)
- **优化点：**
  - Treemap 仅渲染可见层级（虚拟化）
  - 大数据集的分页加载
  - IPC 数据传输压缩（如果 payload 过大）

## Day 19-20: UI 美化

### 任务 4.7: Tailwind 样式完善 (4h)
- **美化：**
  - 按钮、卡片、输入框统一风格
  - 响应式布局调整
  - 暗色模式支持（使用 Tailwind dark mode）

### 任务 4.8: 动画与过渡效果 (2h)
- **添加：**
  - Treemap zoom 动画
  - 视图切换过渡
  - 进度条流畅更新

### 任务 4.9: 图标与视觉元素 (2h)
- **添加：**
  - 文件夹图标（根据类型）
  - Loading 动画
  - 空状态插画

### 任务 4.10: MVP 测试与修复 (2h)
- **全面测试各功能点，记录并修复 bug**

---

# 阶段 5: 对比分析功能 (Week 5-6 - 10天)

**目标：** 实现核心差异化功能 - 历史快照对比

## Day 21-22: 对比逻辑实现

### 任务 5.1: 创建对比算法 (4h)
- **创建文件：** `src/main/comparison/ComparisonEngine.ts`
- **功能：**
  ```typescript
  export class ComparisonEngine {
    compare(snapshotA: Snapshot, snapshotB: Snapshot): ComparisonResult {
      const pathMapA = this.buildPathMap(snapshotA.rootNode);
      const pathMapB = this.buildPathMap(snapshotB.rootNode);

      const allPaths = new Set([...pathMapA.keys(), ...pathMapB.keys()]);
      const diffs: DiffItem[] = [];

      for (const path of allPaths) {
        const sizeA = pathMapA.get(path)?.size || 0;
        const sizeB = pathMapB.get(path)?.size || 0;
        const diff = sizeB - sizeA;

        if (diff !== 0) {
          diffs.push({
            path,
            sizeA,
            sizeB,
            diff,
            diffPercent: sizeA > 0 ? (diff / sizeA) * 100 : 100,
            status: sizeA === 0 ? 'new' : (sizeB === 0 ? 'deleted' : 'modified'),
          });
        }
      }

      // 按增长量排序
      const topGrowing = diffs
        .filter(d => d.diff > 0)
        .sort((a, b) => b.diff - a.diff)
        .slice(0, 10);

      const topShrinking = diffs
        .filter(d => d.diff < 0)
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 10);

      const daysBetween = Math.floor(
        (snapshotB.createdAt.getTime() - snapshotA.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        snapshotA,
        snapshotB,
        totalDiff: snapshotB.totalSize - snapshotA.totalSize,
        daysBetween,
        topGrowing,
        topShrinking,
      };
    }

    private buildPathMap(node: FolderNode, map = new Map<string, FolderNode>()): Map<string, FolderNode> {
      map.set(node.path, node);
      node.children.forEach(child => this.buildPathMap(child, map));
      return map;
    }
  }
  ```

### 任务 5.2: IPC 对比接口 (2h)
- **修改 `src/main/index.ts`：**
  ```typescript
  import { ComparisonEngine } from './comparison/ComparisonEngine';
  const comparisonEngine = new ComparisonEngine();

  ipcMain.handle(IPC_CHANNELS.COMPARE_SNAPSHOTS, async (_, { snapshotIdA, snapshotIdB }) => {
    const snapshotA = dbManager.loadSnapshotById(snapshotIdA);
    const snapshotB = dbManager.loadSnapshotById(snapshotIdB);

    if (!snapshotA || !snapshotB) {
      throw new Error('Snapshot not found');
    }

    return comparisonEngine.compare(snapshotA, snapshotB);
  });
  ```

## Day 23-24: 对比视图 UI

### 任务 5.3: 创建对比视图 (4h)
- **创建文件：** `src/renderer/src/views/CompareView.tsx`
- **布局：**
  ```tsx
  export function CompareView() {
    const { snapshotAId, snapshotBId, comparisonResult, setSnapshotA, setSnapshotB, compare } = useComparisonStore();
    const { snapshots } = useSnapshotStore();

    return (
      <div className="compare-view">
        <div className="snapshot-selector">
          <div>
            <label>快照 A</label>
            <select value={snapshotAId} onChange={e => setSnapshotA(e.target.value)}>
              {snapshots.map(s => <option key={s.id} value={s.id}>{s.name || formatDate(s.createdAt)}</option>)}
            </select>
          </div>

          <div>VS</div>

          <div>
            <label>快照 B</label>
            <select value={snapshotBId} onChange={e => setSnapshotB(e.target.value)}>
              {snapshots.map(s => <option key={s.id} value={s.id}>{s.name || formatDate(s.createdAt)}</option>)}
            </select>
          </div>

          <button onClick={compare} disabled={!snapshotAId || !snapshotBId}>
            对比
          </button>
        </div>

        {comparisonResult && <ComparisonResult result={comparisonResult} />}
      </div>
    );
  }
  ```

### 任务 5.4: 对比结果展示组件 (4h)
- **创建文件：** `src/renderer/src/components/Comparison/ComparisonResult.tsx`
- **内容：**
  - 头部：快照信息对比卡片
  - 总体变化：总大小差异、间隔天数、增长率
  - 增长 Top 10 表格
  - 减少 Top 10 表格
  ```tsx
  export function ComparisonResult({ result }: { result: ComparisonResult }) {
    return (
      <div className="comparison-result">
        <div className="snapshots-info">
          <SnapshotCard snapshot={result.snapshotA} label="快照 A" />
          <div className="vs-icon">VS</div>
          <SnapshotCard snapshot={result.snapshotB} label="快照 B" />
        </div>

        <div className="total-diff">
          <h3>存储变化</h3>
          <p className={result.totalDiff > 0 ? 'text-red-500' : 'text-green-500'}>
            {result.totalDiff > 0 ? '+' : ''}{formatSize(result.totalDiff)}
          </p>
          <span>({result.daysBetween}天内)</span>
        </div>

        <div className="top-growing">
          <h3>🔺 增长最多的文件夹 (Top 10)</h3>
          <DiffTable items={result.topGrowing} />
        </div>

        <div className="top-shrinking">
          <h3>🔻 减少最多的文件夹 (Top 5)</h3>
          <DiffTable items={result.topShrinking} />
        </div>
      </div>
    );
  }
  ```

### 任务 5.5: 差异表格组件 (2h)
- **创建文件：** `src/renderer/src/components/Comparison/DiffTable.tsx`
- **列：** 排名、路径、增长量、增长率、操作

## Day 25-26: Treemap 对比模式

### 任务 5.6: Treemap 增强 - 高亮变化 (4h)
- **修改 `Treemap.tsx`：**
  - 添加 `comparisonData` prop（可选）
  - 根据 diff 值调整颜色和边框
  ```typescript
  interface TreemapProps {
    data: FolderNode;
    comparisonData?: Map<string, number>; // path -> diff
    onNodeClick: (node: FolderNode) => void;
  }

  // 在渲染中：
  .attr('fill', d => {
    if (comparisonData?.has(d.data.path)) {
      const diff = comparisonData.get(d.data.path)!;
      if (diff > threshold) return '#ef4444'; // 红色 - 显著增长
      if (diff < -threshold) return '#10b981'; // 绿色 - 显著减少
    }
    return getColorByDepth(d.depth);
  })
  .attr('stroke', d => {
    if (comparisonData?.has(d.data.path)) {
      const diff = comparisonData.get(d.data.path)!;
      if (Math.abs(diff) > threshold) return '#000';
    }
    return '#fff';
  })
  ```

### 任务 5.7: 对比模式 Tooltip (2h)
- **在 Tooltip 中显示：**
  - 快照 A 大小
  - 快照 B 大小
  - 差异值和百分比

### 任务 5.8: 快照重命名功能 (2h)
- **功能：** 允许用户给快照命名（便于对比时识别）
- **UI：** 历史视图中每个卡片添加编辑按钮
- **IPC：** `db:renameSnapshot`

## Day 27-30: 趋势分析

### 任务 5.9: 多快照趋势计算 (3h)
- **创建文件：** `src/main/comparison/TrendAnalyzer.ts`
- **功能：**
  ```typescript
  export class TrendAnalyzer {
    analyzeTrend(snapshots: Snapshot[], targetPath: string): TrendData {
      const points = snapshots
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(snapshot => {
          const node = this.findNodeByPath(snapshot.rootNode, targetPath);
          return {
            date: snapshot.createdAt,
            size: node?.size || 0,
          };
        });

      return { path: targetPath, points };
    }

    private findNodeByPath(root: FolderNode, targetPath: string): FolderNode | null {
      if (root.path === targetPath) return root;
      for (const child of root.children) {
        const found = this.findNodeByPath(child, targetPath);
        if (found) return found;
      }
      return null;
    }
  }
  ```

### 任务 5.10: 趋势线图表组件 (4h)
- **创建文件：** `src/renderer/src/components/TrendChart.tsx`
- **使用 ECharts：**
  ```tsx
  import * as echarts from 'echarts';

  export function TrendChart({ trendData }: { trendData: TrendData }) {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!chartRef.current) return;

      const chart = echarts.init(chartRef.current);

      const option = {
        title: { text: `${trendData.path} 大小变化趋势` },
        xAxis: {
          type: 'category',
          data: trendData.points.map(p => formatDate(p.date)),
        },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: (value) => formatSize(value) },
        },
        series: [{
          type: 'line',
          data: trendData.points.map(p => p.size),
          smooth: true,
          areaStyle: {},
        }],
      };

      chart.setOption(option);

      return () => chart.dispose();
    }, [trendData]);

    return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
  }
  ```

### 任务 5.11: 趋势视图集成 (2h)
- **在 DetailPanel 中：**
  - 添加"查看趋势"按钮
  - 点击后弹出模态框显示 `<TrendChart />`

### 任务 5.12: 对比功能测试与优化 (3h)
- **测试场景：**
  - 对比两个相同路径的快照
  - 对比不同路径的快照
  - 对比时间跨度大的快照
  - 查看单个目录趋势

---

# 阶段 6: 高级可视化 (Week 7 - 5天)

**目标：** Sunburst 图、多视图优化

## Day 31-32: Sunburst 实现

### 任务 6.1: 创建 Sunburst 组件 (5h)
- **创建文件：** `src/renderer/src/components/Sunburst/Sunburst.tsx`
- **使用 ECharts：**
  ```tsx
  export function Sunburst({ data }: { data: FolderNode }) {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!chartRef.current) return;

      const chart = echarts.init(chartRef.current);

      const option = {
        series: {
          type: 'sunburst',
          data: [convertToSunburstData(data)],
          radius: [0, '95%'],
          label: {
            rotate: 'radial',
          },
          itemStyle: {
            borderWidth: 2,
            borderColor: '#fff',
          },
        },
      };

      chart.setOption(option);

      return () => chart.dispose();
    }, [data]);

    return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
  }

  function convertToSunburstData(node: FolderNode) {
    return {
      name: node.name,
      value: node.size,
      children: node.children.map(convertToSunburstData),
    };
  }
  ```

### 任务 6.2: Sunburst 交互 (2h)
- **添加：**
  - 点击扇区缩放
  - Tooltip 显示详情
  - 颜色编码一致性（与 Treemap 相同）

### 任务 6.3: 视图切换优化 (1h)
- **在 VisualizationContainer 中：**
  - 添加 Sunburst 选项
  - 平滑切换动画

## Day 33-34: 高级功能

### 任务 6.4: 搜索与过滤 (3h)
- **创建文件：** `src/renderer/src/components/SearchBar.tsx`
- **功能：**
  - 按名称搜索文件夹
  - 按大小范围过滤
  - 搜索结果高亮

### 任务 6.5: 排除规则设置 (3h)
- **创建文件：** `src/renderer/src/views/SettingsView.tsx`
- **功能：**
  - 设置扫描时忽略的目录（如 .git, .Trash, node_modules）
  - 保存到 settings 表
  - 扫描时读取并应用规则

### 任务 6.6: 导出功能 (2h)
- **功能：**
  - 导出快照为 JSON
  - 导出对比结果为 CSV/PDF
- **使用库：** `jsPDF`, `papaparse`

## Day 35: UI/UX 改进

### 任务 6.7: 空状态优化 (2h)
- **为各视图添加空状态：**
  - 无快照时的引导
  - 无对比结果时的提示
  - 加载状态

### 任务 6.8: 快捷键支持 (2h)
- **添加快捷键：**
  - `Cmd+N`: 新建扫描
  - `Cmd+E`: 导出
  - `Cmd+F`: 搜索
  - `Esc`: 返回上一级
  - 使用 `react-hotkeys-hook`

### 任务 6.9: 响应式优化 (2h)
- **调整布局适配不同窗口大小**

---

# 阶段 7: 优化与发布 (Week 8-9 - 10天)

**目标：** 性能优化、测试、打包发布

## Day 36-37: 性能优化

### 任务 7.1: 扫描性能优化 (4h)
- **优化点：**
  - 多线程扫描（分区域并行）
  - 智能跳过系统保护目录
  - 缓存机制（记录上次扫描结果，仅扫描变化部分）

### 任务 7.2: 渲染性能优化 (3h)
- **优化点：**
  - Treemap 虚拟化（仅渲染可见区域）
  - React.memo 和 useMemo 优化
  - 列表虚拟滚动（使用 `react-window`）

### 任务 7.3: 数据库性能优化 (2h)
- **优化点：**
  - 查询索引优化
  - 大快照分页加载
  - 事务批处理

## Day 38-39: 测试

### 任务 7.4: 单元测试 (4h)
- **安装测试框架：** Vitest + Testing Library
- **测试覆盖：**
  - 工具函数（formatSize, colorUtils）
  - ComparisonEngine 对比逻辑
  - TrendAnalyzer 趋势计算

### 任务 7.5: 集成测试 (3h)
- **测试场景：**
  - 扫描 → 保存 → 加载流程
  - 对比计算准确性
  - 数据库读写一致性

### 任务 7.6: 手动测试与 Bug 修复 (3h)
- **测试矩阵：**
  - 不同大小的目录（小/中/大/超大）
  - 权限受限的目录
  - 中断扫描并重新开始
  - 删除正在使用的快照
  - 极端数据（空目录、巨大文件）

## Day 40-42: 打包与发布

### 任务 7.7: 图标与品牌 (2h)
- **设计应用图标：** `resources/icon.png` (1024x1024)
- **更新 About 页面**

### 任务 7.8: macOS 权限申请优化 (2h)
- **完善 `build/entitlements.mac.plist`：**
  - 添加 Full Disk Access 说明
  - 优化权限请求弹窗文案

### 任务 7.9: 打包配置 (3h)
- **修改 `electron-builder.yml`：**
  - 配置签名（如需）
  - 配置自动更新（electron-updater）
  - 优化安装包大小（排除不必要的依赖）

### 任务 7.10: 首次发布 (3h)
- **构建：**
  ```bash
  pnpm build:mac
  ```
- **测试安装包：**
  - 在干净的 macOS 环境测试安装
  - 验证权限请求流程
  - 验证应用功能完整性

### 任务 7.11: 文档编写 (3h)
- **编写：**
  - README.md（中文版）
  - 用户手册（使用指南）
  - 开发文档（架构说明）

### 任务 7.12: 发布准备 (2h)
- **发布清单：**
  - GitHub Release 准备
  - 更新日志
  - 截图与演示视频
  - 发布公告

---

# 可选扩展功能 (Post v1.1)

## 功能增强
1. **自动快照调度：** 使用 node-cron 定期自动扫描
2. **云同步：** 快照数据上传到云端（iCloud/Dropbox）
3. **AI 推荐：** 基于历史数据智能推荐清理目录
4. **多语言支持：** i18n 国际化（英文/中文）
5. **通知系统：** 存储空间低于阈值时通知

## 技术优化
1. **增量扫描：** 仅扫描变化的目录
2. **文件类型分析：** 按文件扩展名分类统计
3. **重复文件检测：** 基于 hash 检测重复文件
4. **网络驱动器支持：** 扫描挂载的网络卷

---

# 关键文件清单

## 核心类型
- `src/types/index.ts` - 数据结构定义
- `src/types/ipc.ts` - IPC 通信协议

## Main Process
- `src/main/index.ts` - 主进程入口
- `src/main/database/DatabaseManager.ts` - 数据库管理
- `src/main/scanner/ScannerManager.ts` - 扫描管理器
- `src/main/workers/scanner.worker.ts` - 扫描工作线程
- `src/main/comparison/ComparisonEngine.ts` - 对比引擎
- `src/main/comparison/TrendAnalyzer.ts` - 趋势分析

## Preload
- `src/preload/index.ts` - Context Bridge API
- `src/preload/index.d.ts` - 类型定义

## Renderer - Stores
- `src/renderer/src/store/useScannerStore.ts`
- `src/renderer/src/store/useSnapshotStore.ts`
- `src/renderer/src/store/useComparisonStore.ts`
- `src/renderer/src/store/useUIStore.ts`

## Renderer - Views
- `src/renderer/src/views/ScanView.tsx`
- `src/renderer/src/views/HistoryView.tsx`
- `src/renderer/src/views/CompareView.tsx`
- `src/renderer/src/views/SettingsView.tsx`

## Renderer - Components
- `src/renderer/src/components/Layout.tsx`
- `src/renderer/src/components/Sidebar.tsx`
- `src/renderer/src/components/ScanControl.tsx`
- `src/renderer/src/components/Treemap/Treemap.tsx`
- `src/renderer/src/components/Treemap/Tooltip.tsx`
- `src/renderer/src/components/Sunburst/Sunburst.tsx`
- `src/renderer/src/components/ListView/ListView.tsx`
- `src/renderer/src/components/Breadcrumb.tsx`
- `src/renderer/src/components/DetailPanel.tsx`
- `src/renderer/src/components/VisualizationContainer.tsx`
- `src/renderer/src/components/Comparison/ComparisonResult.tsx`
- `src/renderer/src/components/Comparison/DiffTable.tsx`
- `src/renderer/src/components/TrendChart.tsx`
- `src/renderer/src/components/SearchBar.tsx`

## Renderer - Utils
- `src/renderer/src/utils/formatters.ts`
- `src/renderer/src/utils/colorUtils.ts`

---

# 开发注意事项

## 性能目标（参考 PRD 第九节）
- 扫描速度：< 30秒 (256GB SSD)
- 内存占用：< 500MB（扫描时）
- 应用大小：< 150MB
- 崩溃率：< 1%

## 设计原则
1. **遵循 macOS 设计语言** - 原生控件和手势
2. **信息密度适中** - 关键信息突出
3. **渐进式展示** - 概览 → 详情
4. **响应式反馈** - 所有操作即时反馈

## 颜色方案（参考 PRD 5.2节）
| 元素 | 亮色模式 | 暗色模式 |
|------|----------|----------|
| 背景 | #FFFFFF | #1E1E1E |
| 主色调 | #007AFF | #0A84FF |
| 增长标记 | #FF3B30 | #FF453A |
| 减少标记 | #34C759 | #32D74B |

## macOS 权限（electron-builder.yml 已配置）
- Documents Folder
- Downloads Folder
- Full Disk Access（需用户手动授予）

---

# 总结

本开发计划将 SpaceBadger 从空白项目发展为全功能的 macOS 存储分析工具，分为7个阶段共45天（9周）：

1. **Week 1**: 基础架构 - IPC、数据库、状态管理
2. **Week 2**: 扫描引擎 - Worker Threads、文件系统遍历
3. **Week 3**: 可视化核心 - Treemap、交互、导航
4. **Week 4**: MVP 集成 - 端到端流程打通
5. **Week 5-6**: 对比分析 - 差异化功能（核心竞争力）
6. **Week 7**: 高级可视化 - Sunburst、搜索、导出
7. **Week 8-9**: 优化与发布 - 性能、测试、打包

每个阶段都有明确的交付物和可测试的里程碑，确保项目稳步推进。核心差异化功能"历史对比与增长追踪"在第5-6周实现，是产品的关键价值所在。
