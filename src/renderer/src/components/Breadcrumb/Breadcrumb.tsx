/**
 * 面包屑导航组件
 * 显示当前路径层级并支持点击返回
 */

import type { JSX } from 'react'

interface BreadcrumbProps {
  currentPath: string
  onNavigate: (path: string) => void
  className?: string
}

export function Breadcrumb({ currentPath, onNavigate, className = '' }: BreadcrumbProps): JSX.Element {
  // 解析路径为面包屑项
  const parts = currentPath.split('/').filter(Boolean)

  const breadcrumbs = [
    { path: '/', label: parts[0] || 'Root' }
  ]

  // 构建完整路径
  for (let i = 1; i < parts.length; i++) {
    const path = '/' + parts.slice(0, i + 1).join('/')
    breadcrumbs.push({ path, label: parts[i] })
  }

  return (
    <nav
      className={`breadcrumb flex items-center gap-2 py-3 px-4 bg-white dark:bg-dark-bg border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Home 图标 */}
      <button
        onClick={() => onNavigate(breadcrumbs[0].path)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={breadcrumbs[0].path}
      >
        <span className="text-lg">🏠</span>
        <span className="font-medium text-light-text dark:text-dark-text">
          {breadcrumbs[0].label}
        </span>
      </button>

      {/* 路径分隔符和剩余路径 */}
      {breadcrumbs.slice(1).map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-2">
          {/* 分隔符 */}
          <span className="text-light-text-secondary dark:text-dark-text-secondary">/</span>

          {/* 路径项 */}
          <button
            onClick={() => onNavigate(crumb.path)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              index === breadcrumbs.length - 2
                ? 'bg-light-primary dark:bg-dark-primary text-white font-medium'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-light-text dark:text-dark-text'
            }`}
            title={crumb.path}
          >
            <span className="max-w-xs truncate inline-block">{crumb.label}</span>
          </button>
        </div>
      ))}
    </nav>
  )
}
