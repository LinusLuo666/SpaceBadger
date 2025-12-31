/**
 * Scanner Worker Thread
 * 在独立线程中执行文件系统扫描，避免阻塞主进程
 */

import { parentPort, workerData } from 'worker_threads'
import fs from 'fs/promises'
import path from 'path'
import type { FolderNode } from '../../types'

interface ScanTask {
  rootPath: string
  excludePatterns?: string[]
}

interface ProgressMessage {
  type: 'progress'
  currentPath: string
  processedSize: number
  percentage: number
  processedFolders: number
  speed?: number
  estimatedTimeRemaining?: number
}

interface CompleteMessage {
  type: 'complete'
  rootNode: FolderNode
  scanDuration: number
  totalFolders: number
  totalFiles: number
  inaccessiblePaths: string[]
}

interface ErrorMessage {
  type: 'error'
  error: string
  path?: string
}

// 扫描统计信息
let processedSize = 0
let processedFolders = 0
let totalFolders = 0
let startTime = 0
let lastProgressTime = 0
const inaccessiblePaths: string[] = []

// 默认排除模式
const DEFAULT_EXCLUDE_PATTERNS = [
  '.git',
  '.DS_Store',
  'node_modules',
  '.Trash',
  '.Spotlight-V100',
  '.fseventsd',
  '.TemporaryItems'
]

/**
 * 检查路径是否应该被排除
 */
function shouldExclude(itemPath: string, excludePatterns: string[]): boolean {
  const basename = path.basename(itemPath)
  return excludePatterns.some((pattern) => {
    if (pattern.includes('*')) {
      // 简单的通配符匹配
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      return regex.test(basename)
    }
    return basename === pattern
  })
}

/**
 * 递归扫描目录
 */
async function scanDirectory(
  dirPath: string,
  depth = 0,
  excludePatterns: string[]
): Promise<FolderNode> {
  const name = path.basename(dirPath) || dirPath
  const result: FolderNode = {
    path: dirPath,
    name,
    size: 0,
    fileCount: 0,
    children: [],
    isAccessible: true
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    // 并行处理目录条目
    const childPromises: Promise<void>[] = []

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      // 检查是否应该排除
      if (shouldExclude(fullPath, excludePatterns)) {
        continue
      }

      if (entry.isDirectory()) {
        totalFolders++

        const childPromise = (async (): Promise<void> => {
          try {
            const childNode = await scanDirectory(fullPath, depth + 1, excludePatterns)
            result.children.push(childNode)
            result.size += childNode.size
            result.fileCount += childNode.fileCount
          } catch (error) {
            // 子目录扫描失败，记录但继续
            console.error(`[Worker] Failed to scan subdirectory ${fullPath}:`, error)
          }
        })()

        childPromises.push(childPromise)
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        const filePromise = (async (): Promise<void> => {
          try {
            const stats = await fs.stat(fullPath)
            result.size += stats.size
            result.fileCount++
            processedSize += stats.size
          } catch {
            // 文件无法访问，跳过
          }
        })()

        childPromises.push(filePromise)
      }
    }

    // 等待所有子项处理完成
    await Promise.all(childPromises)

    processedFolders++

    // 定期发送进度更新（每处理10个文件夹或每秒）
    const now = Date.now()
    if (
      processedFolders % 10 === 0 ||
      now - lastProgressTime > 1000 ||
      depth <= 2 // 顶层目录总是报告
    ) {
      sendProgress(dirPath)
      lastProgressTime = now
    }
  } catch (error: unknown) {
    // 目录无法访问
    result.isAccessible = false
    inaccessiblePaths.push(dirPath)

    if (error instanceof Error) {
      const errorCode = (error as NodeJS.ErrnoException).code
      if (errorCode === 'EACCES' || errorCode === 'EPERM') {
        console.log(`[Worker] Permission denied: ${dirPath}`)
      } else {
        console.error(`[Worker] Error scanning ${dirPath}:`, error.message)
      }
    }
  }

  return result
}

/**
 * 发送进度更新到主线程
 */
function sendProgress(currentPath: string): void {
  if (!parentPort) return

  const elapsed = Date.now() - startTime
  const speed = elapsed > 0 ? processedSize / (elapsed / 1000) : 0 // bytes per second

  // 估算完成百分比（基于已处理的文件夹数）
  let percentage = 0
  if (totalFolders > 0) {
    percentage = Math.min(95, (processedFolders / totalFolders) * 100)
  }

  // 估算剩余时间
  let estimatedTimeRemaining = 0
  if (percentage > 5 && speed > 0) {
    const estimatedTotalTime = (elapsed / percentage) * 100
    estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsed)
  }

  const message: ProgressMessage = {
    type: 'progress',
    currentPath,
    processedSize,
    percentage,
    processedFolders,
    speed,
    estimatedTimeRemaining
  }

  parentPort.postMessage(message)
}

/**
 * 计算树中的总文件和文件夹数
 */
function countNodes(node: FolderNode): { files: number; folders: number } {
  let files = node.fileCount
  let folders = 1 // 当前节点

  for (const child of node.children) {
    const childCounts = countNodes(child)
    files += childCounts.files
    folders += childCounts.folders
  }

  return { files, folders }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const { rootPath, excludePatterns = [] } = workerData as ScanTask

  const allExcludePatterns = [...DEFAULT_EXCLUDE_PATTERNS, ...excludePatterns]

  console.log(`[Worker] Starting scan of: ${rootPath}`)
  console.log(`[Worker] Exclude patterns:`, allExcludePatterns)

  startTime = Date.now()
  lastProgressTime = startTime

  try {
    // 检查根路径是否存在
    const rootStats = await fs.stat(rootPath)
    if (!rootStats.isDirectory()) {
      throw new Error('Path is not a directory')
    }

    // 开始扫描
    const rootNode = await scanDirectory(rootPath, 0, allExcludePatterns)
    const scanDuration = Date.now() - startTime

    // 计算总数
    const { files: totalFiles, folders: totalFoldersScanned } = countNodes(rootNode)

    // 发送完成消息
    const message: CompleteMessage = {
      type: 'complete',
      rootNode,
      scanDuration,
      totalFolders: totalFoldersScanned,
      totalFiles,
      inaccessiblePaths
    }

    console.log(`[Worker] Scan complete in ${scanDuration}ms`)
    console.log(`[Worker] Total: ${totalFiles} files, ${totalFoldersScanned} folders`)
    console.log(`[Worker] Inaccessible paths: ${inaccessiblePaths.length}`)

    parentPort?.postMessage(message)
  } catch (error: unknown) {
    console.error('[Worker] Scan failed:', error)

    const errorMessage: ErrorMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      path: rootPath
    }

    parentPort?.postMessage(errorMessage)
  }
}

// 执行主函数
main().catch((error) => {
  console.error('[Worker] Unexpected error:', error)
  process.exit(1)
})
