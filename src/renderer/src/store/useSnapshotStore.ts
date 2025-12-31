/**
 * Snapshot Store
 * 管理快照列表和选中状态
 */

import { create } from 'zustand'
import type { Snapshot, SnapshotMetadata } from '../../../types'

interface SnapshotState {
  // 状态
  snapshots: SnapshotMetadata[]
  selectedSnapshotId: string | null
  selectedSnapshot: Snapshot | null
  isLoading: boolean
  total: number
  error: string | null

  // Actions
  loadSnapshots: (limit?: number, offset?: number) => Promise<void>
  loadSnapshotById: (id: string) => Promise<void>
  selectSnapshot: (id: string) => void
  deleteSnapshot: (id: string) => Promise<void>
  renameSnapshot: (id: string, name: string) => Promise<void>
  refreshSnapshots: () => Promise<void>
  clearSelection: () => void
}

export const useSnapshotStore = create<SnapshotState>((set, get) => ({
  // 初始状态
  snapshots: [],
  selectedSnapshotId: null,
  selectedSnapshot: null,
  isLoading: false,
  total: 0,
  error: null,

  // Actions
  loadSnapshots: async (limit = 50, offset = 0) => {
    if (!window.electron) {
      console.error('[Snapshot Store] Electron API not available')
      return
    }

    set({ isLoading: true, error: null })

    try {
      const result = await window.electron.database.loadSnapshots({ limit, offset })

      set({
        snapshots: result.snapshots,
        total: result.total,
        isLoading: false
      })

      console.log(`[Snapshot Store] Loaded ${result.snapshots.length} snapshots`)
    } catch (error) {
      console.error('[Snapshot Store] Failed to load snapshots:', error)
      set({
        error: '加载快照列表失败',
        isLoading: false
      })
    }
  },

  loadSnapshotById: async (id: string) => {
    if (!window.electron) {
      console.error('[Snapshot Store] Electron API not available')
      return
    }

    set({ isLoading: true, error: null })

    try {
      const snapshot = await window.electron.database.loadSnapshotById({ id })

      if (snapshot) {
        set({
          selectedSnapshot: snapshot,
          selectedSnapshotId: id,
          isLoading: false
        })
        console.log(`[Snapshot Store] Loaded snapshot ${id}`)
      } else {
        set({
          error: '快照不存在',
          isLoading: false
        })
      }
    } catch (error) {
      console.error('[Snapshot Store] Failed to load snapshot:', error)
      set({
        error: '加载快照失败',
        isLoading: false
      })
    }
  },

  selectSnapshot: (id: string) => {
    const { loadSnapshotById } = get()
    loadSnapshotById(id)
  },

  deleteSnapshot: async (id: string) => {
    if (!window.electron) {
      console.error('[Snapshot Store] Electron API not available')
      return
    }

    try {
      await window.electron.database.deleteSnapshot({ id })

      // 从列表中移除
      set((state) => ({
        snapshots: state.snapshots.filter((s) => s.id !== id),
        total: state.total - 1,
        // 如果删除的是当前选中的快照，清除选中状态
        selectedSnapshotId: state.selectedSnapshotId === id ? null : state.selectedSnapshotId,
        selectedSnapshot: state.selectedSnapshotId === id ? null : state.selectedSnapshot
      }))

      console.log(`[Snapshot Store] Deleted snapshot ${id}`)
    } catch (error) {
      console.error('[Snapshot Store] Failed to delete snapshot:', error)
      set({ error: '删除快照失败' })
    }
  },

  renameSnapshot: async (id: string, name: string) => {
    if (!window.electron) {
      console.error('[Snapshot Store] Electron API not available')
      return
    }

    try {
      await window.electron.database.renameSnapshot({ id, name })

      // 更新列表中的名称
      set((state) => ({
        snapshots: state.snapshots.map((s) => (s.id === id ? { ...s, name } : s)),
        // 如果是当前选中的快照，也更新
        selectedSnapshot:
          state.selectedSnapshot && state.selectedSnapshot.id === id
            ? { ...state.selectedSnapshot, name }
            : state.selectedSnapshot
      }))

      console.log(`[Snapshot Store] Renamed snapshot ${id} to "${name}"`)
    } catch (error) {
      console.error('[Snapshot Store] Failed to rename snapshot:', error)
      set({ error: '重命名快照失败' })
    }
  },

  refreshSnapshots: async () => {
    const { loadSnapshots } = get()
    await loadSnapshots()
  },

  clearSelection: () => {
    set({
      selectedSnapshotId: null,
      selectedSnapshot: null
    })
  }
}))
