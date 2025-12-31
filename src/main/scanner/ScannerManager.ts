/**
 * Scanner Manager
 * 管理 Worker Thread 生命周期，协调扫描任务
 */

import { Worker } from 'worker_threads'
import { BrowserWindow } from 'electron'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { IPC_CHANNELS } from '../../types/ipc'
import type { Snapshot, FolderNode, ScanProgress } from '../../types'

interface WorkerProgressMessage {
  type: 'progress'
  currentPath: string
  processedSize: number
  percentage: number
  processedFolders: number
  speed?: number
  estimatedTimeRemaining?: number
}

interface WorkerCompleteMessage {
  type: 'complete'
  rootNode: FolderNode
  scanDuration: number
  totalFolders: number
  totalFiles: number
  inaccessiblePaths: string[]
}

interface WorkerErrorMessage {
  type: 'error'
  error: string
  path?: string
}

type WorkerMessage = WorkerProgressMessage | WorkerCompleteMessage | WorkerErrorMessage

export class ScannerManager {
  private currentWorker: Worker | null = null
  private mainWindow: BrowserWindow
  private currentScanPath: string | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  /**
   * 开始扫描
   */
  startScan(scanPath: string, excludePatterns?: string[]): void {
    // 如果有正在运行的扫描，先取消
    if (this.currentWorker) {
      console.log('[ScannerManager] Cancelling previous scan')
      this.cancelScan()
    }

    this.currentScanPath = scanPath
    console.log(`[ScannerManager] Starting scan of: ${scanPath}`)

    // 创建 Worker
    const workerPath = path.join(__dirname, '../workers/scanner.worker.js')
    this.currentWorker = new Worker(workerPath, {
      workerData: {
        rootPath: scanPath,
        excludePatterns
      }
    })

    // 监听 Worker 消息
    this.currentWorker.on('message', (message: WorkerMessage) => {
      this.handleWorkerMessage(message)
    })

    // 监听 Worker 错误
    this.currentWorker.on('error', (error: Error) => {
      console.error('[ScannerManager] Worker error:', error)
      this.mainWindow.webContents.send(IPC_CHANNELS.SCAN_ERROR, {
        error: error.message,
        path: this.currentScanPath || undefined
      })
      this.cleanup()
    })

    // 监听 Worker 退出
    this.currentWorker.on('exit', (code: number) => {
      if (code !== 0) {
        console.error(`[ScannerManager] Worker stopped with exit code ${code}`)
        if (this.currentWorker) {
          // 只有在非正常退出时才发送错误
          this.mainWindow.webContents.send(IPC_CHANNELS.SCAN_ERROR, {
            error: `Scanner worker exited with code ${code}`,
            path: this.currentScanPath || undefined
          })
        }
      }
      this.cleanup()
    })
  }

  /**
   * 取消扫描
   */
  cancelScan(): void {
    if (!this.currentWorker) {
      console.log('[ScannerManager] No active scan to cancel')
      return
    }

    console.log('[ScannerManager] Cancelling scan')
    this.currentWorker.terminate()
    this.cleanup()
  }

  /**
   * 处理 Worker 消息
   */
  private handleWorkerMessage(message: WorkerMessage): void {
    switch (message.type) {
      case 'progress':
        this.handleProgress(message)
        break

      case 'complete':
        this.handleComplete(message)
        break

      case 'error':
        this.handleError(message)
        break

      default:
        console.warn('[ScannerManager] Unknown message type:', message)
    }
  }

  /**
   * 处理进度更新
   */
  private handleProgress(message: WorkerProgressMessage): void {
    const progressData: ScanProgress = {
      currentPath: message.currentPath,
      processedSize: message.processedSize,
      percentage: message.percentage,
      speed: message.speed,
      estimatedTimeRemaining: message.estimatedTimeRemaining
    }

    this.mainWindow.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, progressData)
  }

  /**
   * 处理扫描完成
   */
  private handleComplete(message: WorkerCompleteMessage): void {
    if (!this.currentScanPath) {
      console.error('[ScannerManager] Scan completed but no scan path recorded')
      return
    }

    console.log('[ScannerManager] Scan completed successfully')
    console.log(
      `[ScannerManager] Total: ${message.totalFiles} files, ${message.totalFolders} folders`
    )
    console.log(`[ScannerManager] Duration: ${message.scanDuration}ms`)
    console.log(`[ScannerManager] Inaccessible: ${message.inaccessiblePaths.length} paths`)

    // 创建 Snapshot 对象
    const snapshot: Snapshot = {
      id: uuidv4(),
      name: null, // 用户可以后续重命名
      createdAt: new Date(),
      scanPath: this.currentScanPath,
      totalSize: message.rootNode.size,
      fileCount: message.totalFiles,
      folderCount: message.totalFolders,
      scanDuration: message.scanDuration,
      rootNode: message.rootNode
    }

    // 发送完成事件
    this.mainWindow.webContents.send(IPC_CHANNELS.SCAN_COMPLETE, {
      snapshot
    })

    // 如果有无法访问的路径，记录警告
    if (message.inaccessiblePaths.length > 0) {
      console.warn('[ScannerManager] Inaccessible paths:')
      message.inaccessiblePaths.slice(0, 10).forEach((p) => {
        console.warn(`  - ${p}`)
      })
      if (message.inaccessiblePaths.length > 10) {
        console.warn(`  ... and ${message.inaccessiblePaths.length - 10} more`)
      }
    }

    this.cleanup()
  }

  /**
   * 处理错误
   */
  private handleError(message: WorkerErrorMessage): void {
    console.error('[ScannerManager] Scan error:', message.error)

    this.mainWindow.webContents.send(IPC_CHANNELS.SCAN_ERROR, {
      error: message.error,
      path: message.path
    })

    this.cleanup()
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    this.currentWorker = null
    this.currentScanPath = null
  }

  /**
   * 检查是否正在扫描
   */
  isScanning(): boolean {
    return this.currentWorker !== null
  }

  /**
   * 获取当前扫描路径
   */
  getCurrentScanPath(): string | null {
    return this.currentScanPath
  }
}
