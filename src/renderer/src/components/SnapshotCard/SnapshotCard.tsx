/**
 * 快照卡片组件
 * 显示快照的基本信息和操作按钮
 */

import type { JSX } from 'react'
import type { SnapshotMetadata } from '../../../../types'
import { formatSize, formatDate, formatRelativeTime } from '../../utils/formatters'

interface SnapshotCardProps {
  snapshot: SnapshotMetadata
  onLoad: (snapshot: SnapshotMetadata) => void
  onDelete: (id: string) => void
  onRename?: (id: string, newName: string) => void
}

export function SnapshotCard({
  snapshot,
  onLoad,
  onDelete,
  onRename
}: SnapshotCardProps): JSX.Element {
  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (window.confirm(`确定要删除快照 "${snapshot.name || '未命名'}" 吗？`)) {
      onDelete(snapshot.id)
    }
  }

  const handleRename = (e: React.MouseEvent): void => {
    e.stopPropagation()
    const newName = window.prompt('输入新名称:', snapshot.name || '')
    if (newName !== null && newName.trim() !== '' && onRename) {
      onRename(snapshot.id, newName.trim())
    }
  }

  return (
    <div
      onClick={() => onLoad(snapshot)}
      className="snapshot-card bg-white dark:bg-dark-bg rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {/* 顶部彩色条 */}
      <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />

      <div className="p-6">
        {/* 标题区域 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text truncate mb-1">
              {snapshot.name || '未命名快照'}
            </h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">
              {snapshot.scanPath}
            </p>
          </div>
          <div className="text-3xl ml-3">📊</div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="stat-item">
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
              总大小
            </div>
            <div className="text-lg font-semibold text-light-text dark:text-dark-text">
              {formatSize(snapshot.totalSize)}
            </div>
          </div>

          <div className="stat-item">
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
              文件数
            </div>
            <div className="text-lg font-semibold text-light-text dark:text-dark-text">
              {snapshot.fileCount.toLocaleString()}
            </div>
          </div>

          <div className="stat-item">
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
              文件夹数
            </div>
            <div className="text-lg font-semibold text-light-text dark:text-dark-text">
              {snapshot.folderCount.toLocaleString()}
            </div>
          </div>

          <div className="stat-item">
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
              扫描耗时
            </div>
            <div className="text-lg font-semibold text-light-text dark:text-dark-text">
              {Math.round(snapshot.scanDuration / 1000)}秒
            </div>
          </div>
        </div>

        {/* 时间信息 */}
        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-4">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>{formatDate(snapshot.createdAt)}</span>
            <span className="text-gray-400">·</span>
            <span>{formatRelativeTime(snapshot.createdAt)}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => onLoad(snapshot)}
            className="flex-1 px-4 py-2 bg-light-primary dark:bg-dark-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            查看详情
          </button>

          {onRename && (
            <button
              onClick={handleRename}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
              title="重命名"
            >
              ✏️
            </button>
          )}

          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
