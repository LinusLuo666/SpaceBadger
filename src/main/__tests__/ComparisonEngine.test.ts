/**
 * ComparisonEngine 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ComparisonEngine } from '../comparison/ComparisonEngine'
import type { DatabaseManager } from '../database/DatabaseManager'
import type { Snapshot, FolderNode } from '../../types'

// Mock DatabaseManager
class MockDatabaseManager {
  private snapshots: Map<string, Snapshot> = new Map()

  addSnapshot(snapshot: Snapshot): void {
    this.snapshots.set(snapshot.id, snapshot)
  }

  loadSnapshotById(id: string): Snapshot | null {
    return this.snapshots.get(id) || null
  }
}

// 创建测试数据
function createMockFolderNode(
  path: string,
  name: string,
  size: number,
  children: FolderNode[] = []
): FolderNode {
  return {
    path,
    name,
    size,
    fileCount: 0,
    children,
    isAccessible: true
  }
}

function createMockSnapshot(
  id: string,
  name: string,
  rootNode: FolderNode,
  createdAt: Date = new Date()
): Snapshot {
  return {
    id,
    name,
    createdAt,
    scanPath: '/test',
    totalSize: rootNode.size,
    fileCount: 0,
    folderCount: 1,
    scanDuration: 1000,
    rootNode
  }
}

describe('ComparisonEngine', () => {
  let mockDb: MockDatabaseManager
  let comparisonEngine: ComparisonEngine

  beforeEach(() => {
    mockDb = new MockDatabaseManager()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comparisonEngine = new ComparisonEngine(mockDb as any as DatabaseManager)
  })

  describe('compareSnapshots', () => {
    it('应该正确对比两个快照的大小差异', () => {
      // 创建快照 A
      const rootA = createMockFolderNode('/test', 'test', 2000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000),
        createMockFolderNode('/test/dir2', 'dir2', 1000)
      ])
      const snapshotA = createMockSnapshot(
        'snapshot-a',
        'Snapshot A',
        rootA,
        new Date('2024-01-01')
      )

      // 创建快照 B（dir1 增长，dir2 减少）
      const rootB = createMockFolderNode('/test', 'test', 2500, [
        createMockFolderNode('/test/dir1', 'dir1', 1800), // 增长 800
        createMockFolderNode('/test/dir2', 'dir2', 700) // 减少 300
      ])
      const snapshotB = createMockSnapshot(
        'snapshot-b',
        'Snapshot B',
        rootB,
        new Date('2024-01-10')
      )

      mockDb.addSnapshot(snapshotA)
      mockDb.addSnapshot(snapshotB)

      const result = comparisonEngine.compareSnapshots('snapshot-a', 'snapshot-b')

      expect(result.snapshotA).toBe(snapshotA)
      expect(result.snapshotB).toBe(snapshotB)
      expect(result.totalDiff).toBe(500) // 2500 - 2000
      expect(result.daysBetween).toBe(9) // 1月1日到1月10日
      expect(result.topGrowing.length).toBeGreaterThan(0)
      expect(result.topShrinking.length).toBeGreaterThan(0)
    })

    it('应该正确识别新增的目录', () => {
      const rootA = createMockFolderNode('/test', 'test', 1000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000)
      ])
      const snapshotA = createMockSnapshot('snapshot-a', 'Snapshot A', rootA)

      const rootB = createMockFolderNode('/test', 'test', 2000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000),
        createMockFolderNode('/test/dir2', 'dir2', 1000) // 新增
      ])
      const snapshotB = createMockSnapshot('snapshot-b', 'Snapshot B', rootB)

      mockDb.addSnapshot(snapshotA)
      mockDb.addSnapshot(snapshotB)

      const result = comparisonEngine.compareSnapshots('snapshot-a', 'snapshot-b')

      const newDir = result.topGrowing.find((item) => item.path === '/test/dir2')
      expect(newDir).toBeDefined()
      expect(newDir?.status).toBe('new')
      expect(newDir?.sizeA).toBe(0)
      expect(newDir?.sizeB).toBe(1000)
    })

    it('应该正确识别删除的目录', () => {
      const rootA = createMockFolderNode('/test', 'test', 2000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000),
        createMockFolderNode('/test/dir2', 'dir2', 1000)
      ])
      const snapshotA = createMockSnapshot('snapshot-a', 'Snapshot A', rootA)

      const rootB = createMockFolderNode('/test', 'test', 1000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000)
        // dir2 被删除
      ])
      const snapshotB = createMockSnapshot('snapshot-b', 'Snapshot B', rootB)

      mockDb.addSnapshot(snapshotA)
      mockDb.addSnapshot(snapshotB)

      const result = comparisonEngine.compareSnapshots('snapshot-a', 'snapshot-b')

      const deletedDir = result.topShrinking.find((item) => item.path === '/test/dir2')
      expect(deletedDir).toBeDefined()
      expect(deletedDir?.status).toBe('deleted')
      expect(deletedDir?.sizeA).toBe(1000)
      expect(deletedDir?.sizeB).toBe(0)
    })

    it('应该正确计算百分比变化', () => {
      const rootA = createMockFolderNode('/test', 'test', 1000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000)
      ])
      const snapshotA = createMockSnapshot('snapshot-a', 'Snapshot A', rootA)

      const rootB = createMockFolderNode('/test', 'test', 2000, [
        createMockFolderNode('/test/dir1', 'dir1', 2000) // 增长 100%
      ])
      const snapshotB = createMockSnapshot('snapshot-b', 'Snapshot B', rootB)

      mockDb.addSnapshot(snapshotA)
      mockDb.addSnapshot(snapshotB)

      const result = comparisonEngine.compareSnapshots('snapshot-a', 'snapshot-b')

      const dir1 = result.topGrowing.find((item) => item.path === '/test/dir1')
      expect(dir1?.diffPercent).toBe(100)
    })

    it('应该在快照不存在时抛出错误', () => {
      expect(() => {
        comparisonEngine.compareSnapshots('non-existent-a', 'non-existent-b')
      }).toThrow('Snapshot A not found')
    })

    it('应该跳过没有变化的路径', () => {
      const rootA = createMockFolderNode('/test', 'test', 2000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000),
        createMockFolderNode('/test/dir2', 'dir2', 1000)
      ])
      const snapshotA = createMockSnapshot('snapshot-a', 'Snapshot A', rootA)

      // dir1 不变，dir2 增长
      const rootB = createMockFolderNode('/test', 'test', 2500, [
        createMockFolderNode('/test/dir1', 'dir1', 1000), // 不变
        createMockFolderNode('/test/dir2', 'dir2', 1500) // 增长
      ])
      const snapshotB = createMockSnapshot('snapshot-b', 'Snapshot B', rootB)

      mockDb.addSnapshot(snapshotA)
      mockDb.addSnapshot(snapshotB)

      const result = comparisonEngine.compareSnapshots('snapshot-a', 'snapshot-b')

      // dir1 不应该出现在结果中（因为没有变化）
      const dir1Growing = result.topGrowing.find((item) => item.path === '/test/dir1')
      const dir1Shrinking = result.topShrinking.find((item) => item.path === '/test/dir1')
      expect(dir1Growing).toBeUndefined()
      expect(dir1Shrinking).toBeUndefined()
    })
  })
})
