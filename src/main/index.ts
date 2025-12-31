import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { IPC_CHANNELS } from '../types/ipc'
import { DatabaseManager } from './database/DatabaseManager'
import { ScannerManager } from './scanner/ScannerManager'
import type {
  ScanStartPayload,
  SaveSnapshotPayload,
  LoadSnapshotsPayload,
  LoadSnapshotByIdPayload,
  DeleteSnapshotPayload,
  RenameSnapshotPayload,
  CompareSnapshotsPayload,
  AnalyzeTrendPayload,
  OpenInFinderPayload,
  CopyPathPayload,
  GetSettingPayload,
  SetSettingPayload
} from '../types/ipc'

// 初始化数据库管理器
let dbManager: DatabaseManager
// 初始化扫描管理器
let scannerManager: ScannerManager

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 初始化扫描管理器
  scannerManager = new ScannerManager(mainWindow)
}

// ========== 设置 IPC 处理器 ==========

function setupIPCHandlers(): void {
  // ========== System 系统相关 ==========

  // 选择文件夹对话框
  ipcMain.handle(IPC_CHANNELS.SYSTEM_SELECT_FOLDER, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.filePaths[0]
  })

  // 在 Finder 中打开
  ipcMain.on(IPC_CHANNELS.SYSTEM_OPEN_IN_FINDER, (_, payload: OpenInFinderPayload) => {
    shell.showItemInFolder(payload.path)
  })

  // 复制路径到剪贴板
  ipcMain.on(IPC_CHANNELS.SYSTEM_COPY_PATH, async (_, payload: CopyPathPayload) => {
    const { clipboard } = await import('electron')
    clipboard.writeText(payload.path)
  })

  // 获取应用版本
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_VERSION, () => {
    return app.getVersion()
  })

  // ========== Database 数据库相关 ==========

  // 保存快照
  ipcMain.handle(IPC_CHANNELS.DB_SAVE_SNAPSHOT, async (_, payload: SaveSnapshotPayload) => {
    try {
      dbManager.saveSnapshot(payload.snapshot)
      console.log('[Main] Snapshot saved:', payload.snapshot.id)
    } catch (error) {
      console.error('[Main] Failed to save snapshot:', error)
      throw error
    }
  })

  // 加载快照列表
  ipcMain.handle(IPC_CHANNELS.DB_LOAD_SNAPSHOTS, async (_, payload?: LoadSnapshotsPayload) => {
    try {
      const result = dbManager.loadSnapshots(payload?.limit, payload?.offset)
      console.log(`[Main] Loaded ${result.snapshots.length} snapshots`)
      return result
    } catch (error) {
      console.error('[Main] Failed to load snapshots:', error)
      throw error
    }
  })

  // 根据 ID 加载快照
  ipcMain.handle(
    IPC_CHANNELS.DB_LOAD_SNAPSHOT_BY_ID,
    async (_, payload: LoadSnapshotByIdPayload) => {
      try {
        const snapshot = dbManager.loadSnapshotById(payload.id)
        console.log('[Main] Loaded snapshot:', payload.id)
        return snapshot
      } catch (error) {
        console.error('[Main] Failed to load snapshot:', error)
        throw error
      }
    }
  )

  // 删除快照
  ipcMain.handle(IPC_CHANNELS.DB_DELETE_SNAPSHOT, async (_, payload: DeleteSnapshotPayload) => {
    try {
      dbManager.deleteSnapshot(payload.id)
      console.log('[Main] Deleted snapshot:', payload.id)
    } catch (error) {
      console.error('[Main] Failed to delete snapshot:', error)
      throw error
    }
  })

  // 重命名快照
  ipcMain.handle(IPC_CHANNELS.DB_RENAME_SNAPSHOT, async (_, payload: RenameSnapshotPayload) => {
    try {
      dbManager.renameSnapshot(payload.id, payload.name)
      console.log('[Main] Renamed snapshot:', payload.id, 'to', payload.name)
    } catch (error) {
      console.error('[Main] Failed to rename snapshot:', error)
      throw error
    }
  })

  // 获取设置
  ipcMain.handle(IPC_CHANNELS.DB_GET_SETTING, async (_, payload: GetSettingPayload) => {
    try {
      const value = dbManager.getSetting(payload.key)
      console.log('[Main] Got setting:', payload.key)
      return value
    } catch (error) {
      console.error('[Main] Failed to get setting:', error)
      throw error
    }
  })

  // 保存设置
  ipcMain.handle(IPC_CHANNELS.DB_SET_SETTING, async (_, payload: SetSettingPayload) => {
    try {
      dbManager.setSetting(payload.key, payload.value)
      console.log('[Main] Set setting:', payload.key)
    } catch (error) {
      console.error('[Main] Failed to set setting:', error)
      throw error
    }
  })

  // ========== Scanner 扫描相关 ==========

  ipcMain.on(IPC_CHANNELS.SCAN_START, (_, payload: ScanStartPayload) => {
    console.log('[Main] Starting scan for path:', payload.path)
    try {
      scannerManager.startScan(payload.path, payload.excludePatterns)
    } catch (error) {
      console.error('[Main] Failed to start scan:', error)
    }
  })

  ipcMain.on(IPC_CHANNELS.SCAN_CANCEL, () => {
    console.log('[Main] Cancelling scan')
    try {
      scannerManager.cancelScan()
    } catch (error) {
      console.error('[Main] Failed to cancel scan:', error)
    }
  })

  // ========== Comparison 对比分析相关（暂未实现，占位）==========

  ipcMain.handle(IPC_CHANNELS.COMPARE_SNAPSHOTS, async (_, payload: CompareSnapshotsPayload) => {
    console.log('[Main] TODO: Implement snapshot comparison:', payload)
    // TODO: 实现 ComparisonEngine 后返回对比结果
    throw new Error('Comparison not yet implemented')
  })

  ipcMain.handle(IPC_CHANNELS.ANALYZE_TREND, async (_, payload: AnalyzeTrendPayload) => {
    console.log('[Main] TODO: Implement trend analysis:', payload)
    // TODO: 实现 TrendAnalyzer 后返回趋势数据
    throw new Error('Trend analysis not yet implemented')
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化数据库
  dbManager = new DatabaseManager()

  // 设置 IPC 处理器
  setupIPCHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
