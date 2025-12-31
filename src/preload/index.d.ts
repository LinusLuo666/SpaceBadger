import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  Snapshot,
  SnapshotMetadata,
  ScanProgress,
  ComparisonResult,
  TrendData
} from '../types'

// 扩展 ElectronAPI
interface CustomElectronAPI {
  // Scanner API
  scanner: {
    start: (path: string, excludePatterns?: string[]) => void
    cancel: () => void
    onProgress: (callback: (data: ScanProgress) => void) => void
    onComplete: (callback: (data: { snapshot: Snapshot }) => void) => void
    onError: (callback: (data: { error: string }) => void) => void
  }

  // Database API
  database: {
    saveSnapshot: (payload: { snapshot: Snapshot }) => Promise<void>
    loadSnapshots: (payload?: {
      limit?: number
      offset?: number
    }) => Promise<{ snapshots: SnapshotMetadata[]; total: number }>
    loadSnapshotById: (payload: { id: string }) => Promise<Snapshot | null>
    deleteSnapshot: (payload: { id: string }) => Promise<void>
    renameSnapshot: (payload: { id: string; name: string }) => Promise<void>
    getSetting: (payload: { key: string }) => Promise<string | null>
    setSetting: (payload: { key: string; value: string }) => Promise<void>
  }

  // Comparison API
  comparison: {
    compareSnapshots: (payload: {
      snapshotIdA: string
      snapshotIdB: string
    }) => Promise<ComparisonResult>
    analyzeTrend: (payload: { snapshotIds: string[]; targetPath: string }) => Promise<TrendData>
  }

  // System API
  system: {
    selectFolder: () => Promise<string | undefined>
    openInFinder: (path: string) => void
    copyPath: (path: string) => void
    getVersion: () => Promise<string>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI & CustomElectronAPI
    api: unknown
  }
}
