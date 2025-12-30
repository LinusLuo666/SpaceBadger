/**
 * IPC 通信协议定义
 * 定义 Main Process 和 Renderer Process 之间的通信接口
 */

import type { Snapshot, SnapshotMetadata, ScanProgress, ComparisonResult, TrendData } from './index'

/**
 * IPC 频道名称常量
 */
export const IPC_CHANNELS = {
  // ========== Scanner 扫描相关 ==========
  /** 开始扫描 */
  SCAN_START: 'scan:start',
  /** 扫描进度更新 */
  SCAN_PROGRESS: 'scan:progress',
  /** 扫描完成 */
  SCAN_COMPLETE: 'scan:complete',
  /** 扫描错误 */
  SCAN_ERROR: 'scan:error',
  /** 取消扫描 */
  SCAN_CANCEL: 'scan:cancel',

  // ========== Database 数据库相关 ==========
  /** 保存快照 */
  DB_SAVE_SNAPSHOT: 'db:saveSnapshot',
  /** 加载快照列表 */
  DB_LOAD_SNAPSHOTS: 'db:loadSnapshots',
  /** 根据 ID 加载完整快照 */
  DB_LOAD_SNAPSHOT_BY_ID: 'db:loadSnapshotById',
  /** 删除快照 */
  DB_DELETE_SNAPSHOT: 'db:deleteSnapshot',
  /** 重命名快照 */
  DB_RENAME_SNAPSHOT: 'db:renameSnapshot',
  /** 获取设置 */
  DB_GET_SETTING: 'db:getSetting',
  /** 保存设置 */
  DB_SET_SETTING: 'db:setSetting',

  // ========== Comparison 对比分析相关 ==========
  /** 对比两个快照 */
  COMPARE_SNAPSHOTS: 'compare:snapshots',
  /** 分析趋势 */
  ANALYZE_TREND: 'analyze:trend',

  // ========== System 系统相关 ==========
  /** 选择文件夹对话框 */
  SYSTEM_SELECT_FOLDER: 'system:selectFolder',
  /** 在 Finder 中打开 */
  SYSTEM_OPEN_IN_FINDER: 'system:openInFinder',
  /** 复制路径到剪贴板 */
  SYSTEM_COPY_PATH: 'system:copyPath',
  /** 获取应用版本 */
  SYSTEM_GET_VERSION: 'system:getVersion',
} as const

/**
 * IPC 频道类型
 */
export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

// ========== Payload 类型定义 ==========

/**
 * 扫描开始 Payload
 */
export interface ScanStartPayload {
  path: string
  excludePatterns?: string[]
}

/**
 * 扫描进度 Payload
 */
export type ScanProgressPayload = ScanProgress

/**
 * 扫描完成 Payload
 */
export interface ScanCompletePayload {
  snapshot: Snapshot
}

/**
 * 扫描错误 Payload
 */
export interface ScanErrorPayload {
  error: string
  path?: string
}

/**
 * 保存快照 Payload
 */
export interface SaveSnapshotPayload {
  snapshot: Snapshot
}

/**
 * 加载快照列表 Payload
 */
export interface LoadSnapshotsPayload {
  limit?: number
  offset?: number
}

/**
 * 加载快照列表 Response
 */
export interface LoadSnapshotsResponse {
  snapshots: SnapshotMetadata[]
  total: number
}

/**
 * 根据 ID 加载快照 Payload
 */
export interface LoadSnapshotByIdPayload {
  id: string
}

/**
 * 删除快照 Payload
 */
export interface DeleteSnapshotPayload {
  id: string
}

/**
 * 重命名快照 Payload
 */
export interface RenameSnapshotPayload {
  id: string
  name: string
}

/**
 * 对比快照 Payload
 */
export interface CompareSnapshotsPayload {
  snapshotIdA: string
  snapshotIdB: string
}

/**
 * 对比快照 Response
 */
export type CompareSnapshotsResponse = ComparisonResult

/**
 * 分析趋势 Payload
 */
export interface AnalyzeTrendPayload {
  /** 快照 ID 列表（按时间排序） */
  snapshotIds: string[]
  /** 目标路径 */
  targetPath: string
}

/**
 * 分析趋势 Response
 */
export type AnalyzeTrendResponse = TrendData

/**
 * 在 Finder 中打开 Payload
 */
export interface OpenInFinderPayload {
  path: string
}

/**
 * 复制路径 Payload
 */
export interface CopyPathPayload {
  path: string
}

/**
 * 获取设置 Payload
 */
export interface GetSettingPayload {
  key: string
}

/**
 * 保存设置 Payload
 */
export interface SetSettingPayload {
  key: string
  value: string
}

// ========== IPC 方法类型映射 ==========

/**
 * IPC Invoke 方法（Main Process -> Renderer Process，需要返回值）
 */
export interface IPCInvokeAPI {
  [IPC_CHANNELS.SYSTEM_SELECT_FOLDER]: () => Promise<string | undefined>
  [IPC_CHANNELS.DB_SAVE_SNAPSHOT]: (payload: SaveSnapshotPayload) => Promise<void>
  [IPC_CHANNELS.DB_LOAD_SNAPSHOTS]: (payload?: LoadSnapshotsPayload) => Promise<LoadSnapshotsResponse>
  [IPC_CHANNELS.DB_LOAD_SNAPSHOT_BY_ID]: (payload: LoadSnapshotByIdPayload) => Promise<Snapshot | null>
  [IPC_CHANNELS.DB_DELETE_SNAPSHOT]: (payload: DeleteSnapshotPayload) => Promise<void>
  [IPC_CHANNELS.DB_RENAME_SNAPSHOT]: (payload: RenameSnapshotPayload) => Promise<void>
  [IPC_CHANNELS.DB_GET_SETTING]: (payload: GetSettingPayload) => Promise<string | null>
  [IPC_CHANNELS.DB_SET_SETTING]: (payload: SetSettingPayload) => Promise<void>
  [IPC_CHANNELS.COMPARE_SNAPSHOTS]: (payload: CompareSnapshotsPayload) => Promise<CompareSnapshotsResponse>
  [IPC_CHANNELS.ANALYZE_TREND]: (payload: AnalyzeTrendPayload) => Promise<AnalyzeTrendResponse>
  [IPC_CHANNELS.SYSTEM_GET_VERSION]: () => Promise<string>
}

/**
 * IPC Send 方法（Renderer Process -> Main Process，无返回值）
 */
export interface IPCSendAPI {
  [IPC_CHANNELS.SCAN_START]: (payload: ScanStartPayload) => void
  [IPC_CHANNELS.SCAN_CANCEL]: () => void
  [IPC_CHANNELS.SYSTEM_OPEN_IN_FINDER]: (payload: OpenInFinderPayload) => void
  [IPC_CHANNELS.SYSTEM_COPY_PATH]: (payload: CopyPathPayload) => void
}

/**
 * IPC On 方法（Main Process -> Renderer Process 监听事件）
 */
export interface IPCOnAPI {
  [IPC_CHANNELS.SCAN_PROGRESS]: (callback: (data: ScanProgressPayload) => void) => void
  [IPC_CHANNELS.SCAN_COMPLETE]: (callback: (data: ScanCompletePayload) => void) => void
  [IPC_CHANNELS.SCAN_ERROR]: (callback: (data: ScanErrorPayload) => void) => void
}
