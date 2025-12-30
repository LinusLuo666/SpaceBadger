/**
 * Comparison Store
 * 管理快照对比和趋势分析
 */

import { create } from 'zustand'
import type { ComparisonResult, TrendData } from '../../../types'

interface ComparisonState {
  // 状态
  snapshotAId: string | null
  snapshotBId: string | null
  comparisonResult: ComparisonResult | null
  isComparing: boolean
  error: string | null

  // 趋势分析
  trendData: TrendData | null
  isAnalyzingTrend: boolean

  // Actions
  setSnapshotA: (id: string) => void
  setSnapshotB: (id: string) => void
  compare: () => Promise<void>
  analyzeTrend: (snapshotIds: string[], targetPath: string) => Promise<void>
  clearComparison: () => void
  clearTrend: () => void
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  // 初始状态
  snapshotAId: null,
  snapshotBId: null,
  comparisonResult: null,
  isComparing: false,
  error: null,
  trendData: null,
  isAnalyzingTrend: false,

  // Actions
  setSnapshotA: (id) => {
    set({ snapshotAId: id })
  },

  setSnapshotB: (id) => {
    set({ snapshotBId: id })
  },

  compare: async () => {
    const { snapshotAId, snapshotBId } = get()

    if (!snapshotAId || !snapshotBId) {
      set({ error: '请选择两个快照进行对比' })
      return
    }

    if (snapshotAId === snapshotBId) {
      set({ error: '不能对比同一个快照' })
      return
    }

    if (!window.electron) {
      console.error('[Comparison Store] Electron API not available')
      return
    }

    set({ isComparing: true, error: null })

    try {
      const result = await window.electron.comparison.compareSnapshots({
        snapshotIdA: snapshotAId,
        snapshotIdB: snapshotBId,
      })

      set({
        comparisonResult: result,
        isComparing: false,
      })

      console.log('[Comparison Store] Comparison completed successfully')
    } catch (error) {
      console.error('[Comparison Store] Failed to compare snapshots:', error)
      set({
        error: '对比快照失败',
        isComparing: false,
      })
    }
  },

  analyzeTrend: async (snapshotIds, targetPath) => {
    if (snapshotIds.length < 2) {
      set({ error: '至少需要两个快照才能分析趋势' })
      return
    }

    if (!window.electron) {
      console.error('[Comparison Store] Electron API not available')
      return
    }

    set({ isAnalyzingTrend: true, error: null })

    try {
      const result = await window.electron.comparison.analyzeTrend({
        snapshotIds,
        targetPath,
      })

      set({
        trendData: result,
        isAnalyzingTrend: false,
      })

      console.log('[Comparison Store] Trend analysis completed successfully')
    } catch (error) {
      console.error('[Comparison Store] Failed to analyze trend:', error)
      set({
        error: '趋势分析失败',
        isAnalyzingTrend: false,
      })
    }
  },

  clearComparison: () => {
    set({
      snapshotAId: null,
      snapshotBId: null,
      comparisonResult: null,
      error: null,
    })
  },

  clearTrend: () => {
    set({
      trendData: null,
      error: null,
    })
  },
}))
