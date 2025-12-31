import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../types/ipc'
import type {
  ScanStartPayload,
  ScanProgressPayload,
  ScanCompletePayload,
  ScanErrorPayload,
  SaveSnapshotPayload,
  LoadSnapshotsPayload,
  LoadSnapshotsResponse,
  LoadSnapshotByIdPayload,
  DeleteSnapshotPayload,
  RenameSnapshotPayload,
  CompareSnapshotsPayload,
  CompareSnapshotsResponse,
  AnalyzeTrendPayload,
  AnalyzeTrendResponse,
  OpenInFinderPayload,
  CopyPathPayload,
  GetSettingPayload,
  SetSettingPayload
} from '../types/ipc'
import type { Snapshot } from '../types'

// Custom APIs for renderer
const api = {
  // ========== Scanner 扫描相关 ==========
  scanner: {
    start: (path: string, excludePatterns?: string[]): void => {
      const payload: ScanStartPayload = { path, excludePatterns }
      ipcRenderer.send(IPC_CHANNELS.SCAN_START, payload)
    },

    cancel: (): void => {
      ipcRenderer.send(IPC_CHANNELS.SCAN_CANCEL)
    },

    onProgress: (callback: (data: ScanProgressPayload) => void): void => {
      ipcRenderer.on(IPC_CHANNELS.SCAN_PROGRESS, (_, data) => callback(data))
    },

    onComplete: (callback: (data: ScanCompletePayload) => void): void => {
      ipcRenderer.on(IPC_CHANNELS.SCAN_COMPLETE, (_, data) => callback(data))
    },

    onError: (callback: (data: ScanErrorPayload) => void): void => {
      ipcRenderer.on(IPC_CHANNELS.SCAN_ERROR, (_, data) => callback(data))
    }
  },

  // ========== Database 数据库相关 ==========
  database: {
    saveSnapshot: (payload: SaveSnapshotPayload): Promise<void> => {
      return ipcRenderer.invoke(IPC_CHANNELS.DB_SAVE_SNAPSHOT, payload)
    },

    loadSnapshots: (payload?: LoadSnapshotsPayload): Promise<LoadSnapshotsResponse> => {
      return ipcRenderer.invoke(IPC_CHANNELS.DB_LOAD_SNAPSHOTS, payload)
    },

    loadSnapshotById: (payload: LoadSnapshotByIdPayload): Promise<Snapshot | null> => {
      return ipcRenderer.invoke(IPC_CHANNELS.DB_LOAD_SNAPSHOT_BY_ID, payload)
    },

    deleteSnapshot: (payload: DeleteSnapshotPayload): Promise<void> => {
      return ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_SNAPSHOT, payload)
    },

    renameSnapshot: (payload: RenameSnapshotPayload): Promise<void> => {
      return ipcRenderer.invoke(IPC_CHANNELS.DB_RENAME_SNAPSHOT, payload)
    },

    getSetting: (payload: GetSettingPayload): Promise<string | null> => {
      return ipcRenderer.invoke(IPC_CHANNELS.DB_GET_SETTING, payload)
    },

    setSetting: (payload: SetSettingPayload): Promise<void> => {
      return ipcRenderer.invoke(IPC_CHANNELS.DB_SET_SETTING, payload)
    }
  },

  // ========== Comparison 对比分析相关 ==========
  comparison: {
    compareSnapshots: (payload: CompareSnapshotsPayload): Promise<CompareSnapshotsResponse> => {
      return ipcRenderer.invoke(IPC_CHANNELS.COMPARE_SNAPSHOTS, payload)
    },

    analyzeTrend: (payload: AnalyzeTrendPayload): Promise<AnalyzeTrendResponse> => {
      return ipcRenderer.invoke(IPC_CHANNELS.ANALYZE_TREND, payload)
    }
  },

  // ========== System 系统相关 ==========
  system: {
    selectFolder: (): Promise<string | undefined> => {
      return ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SELECT_FOLDER)
    },

    openInFinder: (path: string): void => {
      const payload: OpenInFinderPayload = { path }
      ipcRenderer.send(IPC_CHANNELS.SYSTEM_OPEN_IN_FINDER, payload)
    },

    copyPath: (path: string): void => {
      const payload: CopyPathPayload = { path }
      ipcRenderer.send(IPC_CHANNELS.SYSTEM_COPY_PATH, payload)
    },

    getVersion: (): Promise<string> => {
      return ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_VERSION)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', { ...electronAPI, ...api })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = { ...electronAPI, ...api }
  // @ts-ignore (define in dts)
  window.api = api
}
