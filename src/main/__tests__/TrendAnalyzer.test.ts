/**
 * TrendAnalyzer 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TrendAnalyzer } from '../analysis/TrendAnalyzer'
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

describe('TrendAnalyzer', () => {
  let mockDb: MockDatabaseManager
  let trendAnalyzer: TrendAnalyzer

  beforeEach(() => {
    mockDb = new MockDatabaseManager()
    trendAnalyzer = new TrendAnalyzer(mockDb as any)
  })

  describe('analyzeTrend', () => {
    it('应该正确分析多个快照的趋势', () => {
      // 创建三个快照，dir1 的大小逐渐增长
      const root1 = createMockFolderNode('/test', 'test', 1000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000)
      ])
      const snapshot1 = createMockSnapshot('s1', 'S1', root1, new Date('2024-01-01'))

      const root2 = createMockFolderNode('/test', 'test', 1500, [
        createMockFolderNode('/test/dir1', 'dir1', 1500)
      ])
      const snapshot2 = createMockSnapshot('s2', 'S2', root2, new Date('2024-01-02'))

      const root3 = createMockFolderNode('/test', 'test', 2000, [
        createMockFolderNode('/test/dir1', 'dir1', 2000)
      ])
      const snapshot3 = createMockSnapshot('s3', 'S3', root3, new Date('2024-01-03'))

      mockDb.addSnapshot(snapshot1)
      mockDb.addSnapshot(snapshot2)
      mockDb.addSnapshot(snapshot3)

      const result = trendAnalyzer.analyzeTrend(['s1', 's2', 's3'], '/test/dir1')

      expect(result.path).toBe('/test/dir1')
      expect(result.points).toHaveLength(3)
      expect(result.points[0].size).toBe(1000)
      expect(result.points[1].size).toBe(1500)
      expect(result.points[2].size).toBe(2000)
    })

    it('应该按时间排序数据点', () => {
      // 创建三个快照，但按乱序添加
      const root1 = createMockFolderNode('/test', 'test', 1000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000)
      ])
      const snapshot1 = createMockSnapshot('s1', 'S1', root1, new Date('2024-01-03'))

      const root2 = createMockFolderNode('/test', 'test', 1500, [
        createMockFolderNode('/test/dir1', 'dir1', 1500)
      ])
      const snapshot2 = createMockSnapshot('s2', 'S2', root2, new Date('2024-01-01'))

      const root3 = createMockFolderNode('/test', 'test', 2000, [
        createMockFolderNode('/test/dir1', 'dir1', 2000)
      ])
      const snapshot3 = createMockSnapshot('s3', 'S3', root3, new Date('2024-01-02'))

      mockDb.addSnapshot(snapshot1)
      mockDb.addSnapshot(snapshot2)
      mockDb.addSnapshot(snapshot3)

      // 按乱序传入快照 ID
      const result = trendAnalyzer.analyzeTrend(['s1', 's2', 's3'], '/test/dir1')

      // 结果应该按时间排序（从早到晚）
      expect(result.points[0].date).toEqual(new Date('2024-01-01'))
      expect(result.points[0].size).toBe(1500) // s2
      expect(result.points[1].date).toEqual(new Date('2024-01-02'))
      expect(result.points[1].size).toBe(2000) // s3
      expect(result.points[2].date).toEqual(new Date('2024-01-03'))
      expect(result.points[2].size).toBe(1000) // s1
    })

    it('应该处理路径不存在的情况（返回0）', () => {
      // 创建两个快照，第一个有 dir1，第二个没有 dir1
      const root1 = createMockFolderNode('/test', 'test', 1000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000)
      ])
      const snapshot1 = createMockSnapshot('s1', 'S1', root1, new Date('2024-01-01'))

      const root2 = createMockFolderNode('/test', 'test', 500, [
        createMockFolderNode('/test/dir2', 'dir2', 500)
      ])
      const snapshot2 = createMockSnapshot('s2', 'S2', root2, new Date('2024-01-02'))

      mockDb.addSnapshot(snapshot1)
      mockDb.addSnapshot(snapshot2)

      const result = trendAnalyzer.analyzeTrend(['s1', 's2'], '/test/dir1')

      expect(result.points).toHaveLength(2)
      expect(result.points[0].size).toBe(1000) // s1 有 dir1
      expect(result.points[1].size).toBe(0) // s2 没有 dir1，返回 0
    })

    it('应该跳过不存在的快照', () => {
      const root1 = createMockFolderNode('/test', 'test', 1000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000)
      ])
      const snapshot1 = createMockSnapshot('s1', 'S1', root1, new Date('2024-01-01'))

      mockDb.addSnapshot(snapshot1)

      // 包含一个不存在的快照 ID
      const result = trendAnalyzer.analyzeTrend(['s1', 'non-existent', 's3'], '/test/dir1')

      // 只应该有一个数据点（s1）
      expect(result.points).toHaveLength(1)
      expect(result.points[0].size).toBe(1000)
    })

    it('应该在快照数组为空时抛出错误', () => {
      expect(() => {
        trendAnalyzer.analyzeTrend([], '/test/dir1')
      }).toThrow('Snapshot IDs array cannot be empty')
    })

    it('应该正确处理嵌套路径', () => {
      // 创建深层嵌套的目录结构
      const root = createMockFolderNode('/test', 'test', 3000, [
        createMockFolderNode('/test/level1', 'level1', 3000, [
          createMockFolderNode('/test/level1/level2', 'level2', 3000, [
            createMockFolderNode('/test/level1/level2/level3', 'level3', 3000)
          ])
        ])
      ])
      const snapshot = createMockSnapshot('s1', 'S1', root, new Date('2024-01-01'))

      mockDb.addSnapshot(snapshot)

      // 测试访问深层路径
      const result = trendAnalyzer.analyzeTrend(['s1'], '/test/level1/level2/level3')

      expect(result.path).toBe('/test/level1/level2/level3')
      expect(result.points).toHaveLength(1)
      expect(result.points[0].size).toBe(3000)
    })

    it('应该正确处理根路径', () => {
      const root = createMockFolderNode('/test', 'test', 5000, [
        createMockFolderNode('/test/dir1', 'dir1', 2000),
        createMockFolderNode('/test/dir2', 'dir2', 3000)
      ])
      const snapshot = createMockSnapshot('s1', 'S1', root, new Date('2024-01-01'))

      mockDb.addSnapshot(snapshot)

      const result = trendAnalyzer.analyzeTrend(['s1'], '/test')

      expect(result.path).toBe('/test')
      expect(result.points).toHaveLength(1)
      expect(result.points[0].size).toBe(5000)
    })

    it('应该处理多个快照中路径时有时无的情况', () => {
      // s1: dir1 存在 (1000)
      // s2: dir1 不存在 (0)
      // s3: dir1 存在 (2000)
      const root1 = createMockFolderNode('/test', 'test', 1000, [
        createMockFolderNode('/test/dir1', 'dir1', 1000)
      ])
      const snapshot1 = createMockSnapshot('s1', 'S1', root1, new Date('2024-01-01'))

      const root2 = createMockFolderNode('/test', 'test', 500, [
        createMockFolderNode('/test/dir2', 'dir2', 500)
      ])
      const snapshot2 = createMockSnapshot('s2', 'S2', root2, new Date('2024-01-02'))

      const root3 = createMockFolderNode('/test', 'test', 2000, [
        createMockFolderNode('/test/dir1', 'dir1', 2000)
      ])
      const snapshot3 = createMockSnapshot('s3', 'S3', root3, new Date('2024-01-03'))

      mockDb.addSnapshot(snapshot1)
      mockDb.addSnapshot(snapshot2)
      mockDb.addSnapshot(snapshot3)

      const result = trendAnalyzer.analyzeTrend(['s1', 's2', 's3'], '/test/dir1')

      expect(result.points).toHaveLength(3)
      expect(result.points[0].size).toBe(1000)
      expect(result.points[1].size).toBe(0) // 不存在
      expect(result.points[2].size).toBe(2000)
    })
  })
})
