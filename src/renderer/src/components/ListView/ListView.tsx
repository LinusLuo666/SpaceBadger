/**
 * 列表视图组件
 * 以表格形式展示文件夹内容
 */

import { useState } from 'react'
import type { JSX } from 'react'
import type { FolderNode } from '../../../../types'
import { formatSize } from '../../utils/formatters'

interface ListViewProps {
  data: FolderNode
  onNavigate?: (node: FolderNode) => void
  className?: string
}

type SortKey = 'name' | 'size' | 'fileCount' | 'children'
type SortDirection = 'asc' | 'desc'

export function ListView({ data, onNavigate, className = '' }: ListViewProps): JSX.Element {
  const [sortKey, setSortKey] = useState<SortKey>('size')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // 排序处理
  const handleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  // 排序子文件夹
  const sortedChildren = [...data.children].sort((a, b) => {
    let compareValue = 0

    switch (sortKey) {
      case 'name':
        compareValue = a.name.localeCompare(b.name)
        break
      case 'size':
        compareValue = a.size - b.size
        break
      case 'fileCount':
        compareValue = a.fileCount - b.fileCount
        break
      case 'children':
        compareValue = a.children.length - b.children.length
        break
    }

    return sortDirection === 'asc' ? compareValue : -compareValue
  })

  return (
    <div
      className={`list-view bg-white dark:bg-dark-bg rounded-lg shadow-md overflow-hidden ${className}`}
    >
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            {/* 名称列 */}
            <th
              className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-light-text dark:text-dark-text">
                <span>名称</span>
                {sortKey === 'name' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </th>

            {/* 大小列 */}
            <th
              className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => handleSort('size')}
            >
              <div className="flex items-center justify-end gap-2 text-sm font-semibold text-light-text dark:text-dark-text">
                <span>大小</span>
                {sortKey === 'size' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </th>

            {/* 文件数列 */}
            <th
              className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => handleSort('fileCount')}
            >
              <div className="flex items-center justify-end gap-2 text-sm font-semibold text-light-text dark:text-dark-text">
                <span>文件数</span>
                {sortKey === 'fileCount' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </th>

            {/* 子文件夹列 */}
            <th
              className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => handleSort('children')}
            >
              <div className="flex items-center justify-end gap-2 text-sm font-semibold text-light-text dark:text-dark-text">
                <span>子文件夹</span>
                {sortKey === 'children' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedChildren.map((child) => {
            const percentage = data.size > 0 ? (child.size / data.size) * 100 : 0

            return (
              <tr
                key={child.path}
                onClick={() => onNavigate && onNavigate(child)}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                {/* 名称 */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📁</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-light-text dark:text-dark-text truncate">
                        {child.name}
                      </div>
                      <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {percentage.toFixed(1)}% 的当前目录
                      </div>
                    </div>
                    {!child.isAccessible && (
                      <span
                        className="text-yellow-600 dark:text-yellow-500 text-xs"
                        title="部分内容无法访问"
                      >
                        ⚠️
                      </span>
                    )}
                  </div>
                </td>

                {/* 大小 */}
                <td className="px-6 py-4 text-right">
                  <div className="text-sm font-medium text-light-text dark:text-dark-text">
                    {formatSize(child.size)}
                  </div>
                </td>

                {/* 文件数 */}
                <td className="px-6 py-4 text-right">
                  <div className="text-sm text-light-text dark:text-dark-text">
                    {child.fileCount.toLocaleString()}
                  </div>
                </td>

                {/* 子文件夹 */}
                <td className="px-6 py-4 text-right">
                  <div className="text-sm text-light-text dark:text-dark-text">
                    {child.children.length}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* 空状态 */}
      {data.children.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-3">📄</div>
          <div className="text-light-text dark:text-dark-text font-medium mb-1">
            该目录下没有子文件夹
          </div>
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            只包含文件，没有子目录
          </div>
        </div>
      )}
    </div>
  )
}
