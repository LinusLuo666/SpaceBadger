/**
 * Scanner Store
 * 管理文件扫描状态
 */

import { create } from 'zustand'
import type { Snapshot, ScanProgress } from '../../../types'

interface ScannerState {
  // 状态
  isScanning: boolean
  currentPath: string
  progress: number
  processedSize: number
  estimatedTimeRemaining: number
  speed: number
  currentSnapshot: Snapshot | null
  error: string | null

  // Actions
  startScan: (path: string, excludePatterns?: string[]) => void
  cancelScan: () => void
  updateProgress: (data: ScanProgress) => void
  setSnapshot: (snapshot: Snapshot) => void
  setError: (error: string) => void
  reset: () => void
}

export const useScannerStore = create<ScannerState>((set, get) => {
  // 设置 IPC 监听器（仅一次）
  if (typeof window !== 'undefined' && window.electron) {
    // 监听扫描进度
    window.electron.scanner.onProgress((data) => {
      get().updateProgress(data)
    })

    // 监听扫描完成
    window.electron.scanner.onComplete((data) => {
      // 设置快照
      set({
        currentSnapshot: data.snapshot,
        isScanning: false,
        progress: 100
      })

      // 自动保存到数据库
      window.electron.database
        .saveSnapshot({ snapshot: data.snapshot })
        .then(() => {
          console.log('[Scanner Store] Snapshot saved successfully')
        })
        .catch((error) => {
          console.error('[Scanner Store] Failed to save snapshot:', error)
          get().setError('保存快照失败')
        })
    })

    // 监听扫描错误
    window.electron.scanner.onError((data) => {
      set({
        isScanning: false,
        error: data.error
      })
    })
  }

  return {
    // 初始状态
    isScanning: false,
    currentPath: '',
    progress: 0,
    processedSize: 0,
    estimatedTimeRemaining: 0,
    speed: 0,
    currentSnapshot: null,
    error: null,

    // Actions
    startScan: (path, excludePatterns) => {
      if (!window.electron) {
        console.error('[Scanner Store] Electron API not available')
        return
      }

      set({
        isScanning: true,
        currentPath: path,
        progress: 0,
        processedSize: 0,
        estimatedTimeRemaining: 0,
        speed: 0,
        currentSnapshot: null,
        error: null
      })

      window.electron.scanner.start(path, excludePatterns)
    },

    cancelScan: () => {
      if (!window.electron) {
        console.error('[Scanner Store] Electron API not available')
        return
      }

      window.electron.scanner.cancel()

      set({
        isScanning: false,
        progress: 0
      })
    },

    updateProgress: (data) => {
      set({
        currentPath: data.currentPath,
        progress: data.percentage,
        processedSize: data.processedSize,
        estimatedTimeRemaining: data.estimatedTimeRemaining || 0,
        speed: data.speed || 0
      })
    },

    setSnapshot: (snapshot) => {
      set({ currentSnapshot: snapshot })
    },

    setError: (error) => {
      set({ error, isScanning: false })
    },

    reset: () => {
      set({
        isScanning: false,
        currentPath: '',
        progress: 0,
        processedSize: 0,
        estimatedTimeRemaining: 0,
        speed: 0,
        currentSnapshot: null,
        error: null
      })
    }
  }
})
