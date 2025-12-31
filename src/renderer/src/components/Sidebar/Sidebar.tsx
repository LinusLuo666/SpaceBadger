/**
 * 侧边栏导航组件
 * 提供主要视图之间的切换
 */

import type { JSX } from 'react'
import { useUIStore } from '../../store/useUIStore'

interface NavItem {
  id: 'scan' | 'history' | 'compare' | 'settings'
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { id: 'scan', label: '扫描', icon: '🔍' },
  { id: 'history', label: '历史', icon: '📚' },
  { id: 'compare', label: '对比', icon: '⚖️' },
  { id: 'settings', label: '设置', icon: '⚙️' }
]

export function Sidebar(): JSX.Element {
  const { currentView, setView, sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={`sidebar flex flex-col bg-white dark:bg-dark-bg border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦡</span>
              <h1 className="text-lg font-bold text-light-text dark:text-dark-text">SpaceBadger</h1>
            </div>
          )}
          {sidebarCollapsed && <span className="text-2xl mx-auto">🦡</span>}
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
              currentView === item.id
                ? 'bg-light-primary dark:bg-dark-primary text-white'
                : 'text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span className="text-xl">{item.icon}</span>
            {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* 底部折叠按钮 */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          <span className="text-lg">{sidebarCollapsed ? '→' : '←'}</span>
          {!sidebarCollapsed && <span className="text-sm">收起</span>}
        </button>
      </div>
    </aside>
  )
}
