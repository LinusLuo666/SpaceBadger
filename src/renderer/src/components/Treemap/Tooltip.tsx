/**
 * Treemap Tooltip 组件
 * 显示节点的详细信息
 */

import type { JSX } from 'react'
import type { FolderNode } from '../../../../types'
import { formatSize } from '../../utils/formatters'

interface TooltipProps {
  node: FolderNode | null
  totalSize: number
  className?: string
}

export function Tooltip({ node, totalSize, className = '' }: TooltipProps): JSX.Element | null {
  if (!node) return null

  const percentage = totalSize > 0 ? (node.size / totalSize) * 100 : 0

  return (
    <div
      className={`tooltip fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 pointer-events-none ${className}`}
    >
      {/* 节点名称 */}
      <div className="font-semibold text-light-text dark:text-dark-text mb-2 max-w-xs truncate">
        {node.name}
      </div>

      {/* 完整路径 */}
      <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3 max-w-xs truncate font-mono">
        {node.path}
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-light-text-secondary dark:text-dark-text-secondary text-xs mb-1">
            大小
          </div>
          <div className="font-medium text-light-text dark:text-dark-text">
            {formatSize(node.size)}
          </div>
        </div>

        <div>
          <div className="text-light-text-secondary dark:text-dark-text-secondary text-xs mb-1">
            占比
          </div>
          <div className="font-medium text-light-text dark:text-dark-text">
            {percentage.toFixed(2)}%
          </div>
        </div>

        <div>
          <div className="text-light-text-secondary dark:text-dark-text-secondary text-xs mb-1">
            文件数
          </div>
          <div className="font-medium text-light-text dark:text-dark-text">
            {node.fileCount.toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-light-text-secondary dark:text-dark-text-secondary text-xs mb-1">
            子文件夹
          </div>
          <div className="font-medium text-light-text dark:text-dark-text">
            {node.children.length}
          </div>
        </div>
      </div>

      {/* 无法访问提示 */}
      {!node.isAccessible && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
            <span>⚠️</span>
            <span>部分内容无法访问</span>
          </div>
        </div>
      )}
    </div>
  )
}
