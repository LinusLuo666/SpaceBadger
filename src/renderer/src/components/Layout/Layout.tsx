/**
 * 应用主布局组件
 * 包含侧边栏和主内容区域，根据当前视图显示不同内容
 */

import { useEffect } from 'react'
import type { JSX } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { useScannerStore } from '../../store/useScannerStore'
import { Sidebar } from '../Sidebar'
import { ScanControl } from '../ScanControl'
import { VisualizationContainer } from '../VisualizationContainer'

export function Layout(): JSX.Element {
  const { currentView, theme, setTheme } = useUIStore()

  // 初始化主题（仅在首次挂载时应用）
  useEffect(() => {
    // 应用当前主题设置
    setTheme(theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app-layout flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <main className="flex-1 overflow-auto flex flex-col">
        <div className={`flex-1 ${currentView === 'scan' ? '' : 'container mx-auto p-6'}`}>
          {/* 根据当前视图渲染不同内容 */}
          {currentView === 'scan' && <ScanView />}
          {currentView === 'history' && <HistoryView />}
          {currentView === 'compare' && <CompareView />}
          {currentView === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  )
}

/**
 * 扫描视图
 */
function ScanView(): JSX.Element {
  const { currentSnapshot } = useScannerStore()

  // 如果有当前快照，显示可视化
  if (currentSnapshot) {
    return (
      <div className="scan-view h-full">
        <VisualizationContainer snapshot={currentSnapshot} className="h-full" />
      </div>
    )
  }

  // 否则显示扫描控制面板
  return (
    <div className="scan-view">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">
          磁盘空间扫描
        </h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          分析文件夹占用空间，快速找出大文件和目录
        </p>
      </div>

      <div className="max-w-2xl">
        <ScanControl />
      </div>
    </div>
  )
}

/**
 * 历史视图（占位）
 */
function HistoryView(): JSX.Element {
  return (
    <div className="history-view">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">扫描历史</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          查看和管理历史扫描记录
        </p>
      </div>

      <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-12 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-light-text dark:text-dark-text mb-2">
          暂无历史记录
        </h3>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          完成首次扫描后，历史记录将显示在这里
        </p>
      </div>
    </div>
  )
}

/**
 * 对比视图（占位）
 */
function CompareView(): JSX.Element {
  return (
    <div className="compare-view">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">快照对比</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          对比两个快照，查看空间变化趋势
        </p>
      </div>

      <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-12 text-center">
        <div className="text-6xl mb-4">⚖️</div>
        <h3 className="text-xl font-semibold text-light-text dark:text-dark-text mb-2">
          需要至少两个快照
        </h3>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          进行多次扫描后，您可以在这里对比不同时间点的空间占用情况
        </p>
      </div>
    </div>
  )
}

/**
 * 设置视图（占位）
 */
function SettingsView(): JSX.Element {
  const { theme, setTheme } = useUIStore()

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto'): void => {
    setTheme(newTheme)
  }

  return (
    <div className="settings-view">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">设置</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">配置应用偏好设置</p>
      </div>

      <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
            外观设置
          </h3>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => handleThemeChange('light')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium text-light-text dark:text-dark-text">浅色模式</div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  使用浅色主题
                </div>
              </div>
              <span className="text-2xl">☀️</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => handleThemeChange('dark')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium text-light-text dark:text-dark-text">深色模式</div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  使用深色主题
                </div>
              </div>
              <span className="text-2xl">🌙</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="auto"
                checked={theme === 'auto'}
                onChange={() => handleThemeChange('auto')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium text-light-text dark:text-dark-text">跟随系统</div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  根据系统设置自动切换
                </div>
              </div>
              <span className="text-2xl">🔄</span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">关于</h3>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            SpaceBadger - macOS 存储分析工具
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
            版本 1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}
