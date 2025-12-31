/**
 * 扫描控制面板组件
 * 提供文件夹选择、扫描控制、进度显示等功能
 */

import type { JSX } from 'react'
import { useScannerStore } from '../../store/useScannerStore'
import { formatSize, formatSpeed, formatDuration, formatPercentage } from '../../utils/formatters'

export function ScanControl(): JSX.Element {
  const { isScanning, currentPath, progress, processedSize, speed, estimatedTimeRemaining, error } =
    useScannerStore()

  const handleSelectFolder = async (): Promise<void> => {
    if (!window.electron) {
      console.error('[ScanControl] Electron API not available')
      return
    }

    try {
      const path = await window.electron.system.selectFolder()
      if (path) {
        // 开始扫描
        useScannerStore.getState().startScan(path)
      }
    } catch (err) {
      console.error('[ScanControl] Failed to select folder:', err)
    }
  }

  const handleCancelScan = (): void => {
    useScannerStore.getState().cancelScan()
  }

  // 错误状态
  if (error) {
    return (
      <div className="scan-control p-6 bg-white dark:bg-dark-bg rounded-lg shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-red-500 text-2xl">⚠️</div>
          <div>
            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
              扫描失败
            </h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {error}
            </p>
          </div>
        </div>
        <button
          onClick={handleSelectFolder}
          className="w-full px-4 py-3 bg-light-primary dark:bg-dark-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          重新选择文件夹
        </button>
      </div>
    )
  }

  // 扫描中状态
  if (isScanning) {
    return (
      <div className="scan-control p-6 bg-white dark:bg-dark-bg rounded-lg shadow-md">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
              正在扫描...
            </h3>
            <span className="text-sm font-medium text-light-primary dark:text-dark-primary">
              {formatPercentage(progress)}
            </span>
          </div>

          {/* 进度条 */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-light-primary dark:bg-dark-primary transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* 当前路径 */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
            当前路径:
          </p>
          <p className="text-sm text-light-text dark:text-dark-text font-mono truncate">
            {currentPath || '初始化中...'}
          </p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
              已处理
            </p>
            <p className="text-sm font-semibold text-light-text dark:text-dark-text">
              {formatSize(processedSize)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
              速度
            </p>
            <p className="text-sm font-semibold text-light-text dark:text-dark-text">
              {speed ? formatSpeed(speed) : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
              预计剩余
            </p>
            <p className="text-sm font-semibold text-light-text dark:text-dark-text">
              {estimatedTimeRemaining ? formatDuration(estimatedTimeRemaining) : '-'}
            </p>
          </div>
        </div>

        {/* 取消按钮 */}
        <button
          onClick={handleCancelScan}
          className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-light-text dark:text-dark-text rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
        >
          取消扫描
        </button>
      </div>
    )
  }

  // 空闲状态
  return (
    <div className="scan-control p-6 bg-white dark:bg-dark-bg rounded-lg shadow-md">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-xl font-semibold text-light-text dark:text-dark-text mb-2">
          开始分析磁盘空间
        </h3>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          选择要扫描的文件夹，分析其占用空间分布
        </p>
      </div>

      <button
        onClick={handleSelectFolder}
        className="w-full px-4 py-3 bg-light-primary dark:bg-dark-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-base"
      >
        选择文件夹
      </button>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary text-center">
          提示：扫描大型目录可能需要几分钟时间
        </p>
      </div>
    </div>
  )
}
