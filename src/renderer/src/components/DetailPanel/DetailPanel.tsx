/**
 * 详情面板组件
 * 显示选中节点的详细信息和子文件夹列表
 */

import type { JSX } from 'react'
import type { FolderNode } from '../../../../types'
import { formatSize } from '../../utils/formatters'

interface DetailPanelProps {
  node: FolderNode
  totalSize: number
  onNavigate?: (node: FolderNode) => void
  className?: string
}

export function DetailPanel({
  node,
  totalSize,
  onNavigate,
  className = ''
}: DetailPanelProps): JSX.Element {
  const percentage = totalSize > 0 ? (node.size / totalSize) * 100 : 0

  // 按大小排序子文件夹
  const sortedChildren = [...node.children].sort((a, b) => b.size - a.size)
  const top5Children = sortedChildren.slice(0, 5)

  return (
    <div
      className={`detail-panel bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}
    >
      {/* 节点信息 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-2 truncate">
          {node.name}
        </h3>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary font-mono truncate">
          {node.path}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
            总大小
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-dark-text">
            {formatSize(node.size)}
          </div>
          <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
            占总空间 {percentage.toFixed(2)}%
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
            文件数
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-dark-text">
            {node.fileCount.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
            子文件夹
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-dark-text">
            {node.children.length}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
            访问状态
          </div>
          <div className="text-lg font-semibold text-light-text dark:text-dark-text">
            {node.isAccessible ? (
              <span className="text-green-600 dark:text-green-500">✓ 可访问</span>
            ) : (
              <span className="text-yellow-600 dark:text-yellow-500">⚠ 受限</span>
            )}
          </div>
        </div>
      </div>

      {/* 最大的子文件夹 */}
      {top5Children.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-light-text dark:text-dark-text mb-3">
            最大的子文件夹 (Top 5)
          </h4>
          <div className="space-y-2">
            {top5Children.map((child) => {
              const childPercentage = node.size > 0 ? (child.size / node.size) * 100 : 0

              return (
                <button
                  key={child.path}
                  onClick={() => onNavigate && onNavigate(child)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  {/* 文件夹图标 */}
                  <span className="text-2xl">📁</span>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-light-text dark:text-dark-text truncate">
                      {child.name}
                    </div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      {formatSize(child.size)} • {childPercentage.toFixed(1)}%
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-light-primary dark:bg-dark-primary"
                      style={{ width: `${Math.min(childPercentage, 100)}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {node.children.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📄</div>
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            该目录下没有子文件夹
          </div>
        </div>
      )}
    </div>
  )
}
