/**
 * UI Store
 * 管理应用 UI 状态（视图、可视化类型、导航等）
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ViewType = 'scan' | 'history' | 'compare' | 'settings'
type VisualizationType = 'treemap' | 'sunburst' | 'list'

interface UIState {
  // 状态
  currentView: ViewType
  visualizationType: VisualizationType
  currentPath: string
  theme: 'light' | 'dark' | 'auto'
  sidebarCollapsed: boolean

  // Actions
  setView: (view: ViewType) => void
  setVisualizationType: (type: VisualizationType) => void
  navigateToPath: (path: string) => void
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  toggleSidebar: () => void
  reset: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 初始状态
      currentView: 'scan',
      visualizationType: 'treemap',
      currentPath: '',
      theme: 'auto',
      sidebarCollapsed: false,

      // Actions
      setView: (view) => {
        set({ currentView: view })
        console.log(`[UI Store] View changed to: ${view}`)
      },

      setVisualizationType: (type) => {
        set({ visualizationType: type })
        console.log(`[UI Store] Visualization type changed to: ${type}`)
      },

      navigateToPath: (path) => {
        set({ currentPath: path })
        console.log(`[UI Store] Navigated to path: ${path}`)
      },

      setTheme: (theme) => {
        set({ theme })

        // 应用主题到 HTML 元素
        const root = document.documentElement

        if (theme === 'dark') {
          root.classList.add('dark')
        } else if (theme === 'light') {
          root.classList.remove('dark')
        } else {
          // auto: 根据系统偏好
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (isDark) {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
        }

        console.log(`[UI Store] Theme changed to: ${theme}`)
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      reset: () => {
        set({
          currentView: 'scan',
          visualizationType: 'treemap',
          currentPath: '',
          sidebarCollapsed: false,
        })
      },
    }),
    {
      name: 'spacebadger-ui-storage', // localStorage key
      partialize: (state) => ({
        visualizationType: state.visualizationType,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

// 监听系统主题变化
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const { theme, setTheme } = useUIStore.getState()
    if (theme === 'auto') {
      setTheme('auto') // 重新应用主题
    }
  })
}
