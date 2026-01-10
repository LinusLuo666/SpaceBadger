/**
 * 快照对比引擎
 * 实现两个快照之间的差异分析
 * 参考 PRD 第三节 - 历史对比功能
 */

import type { ComparisonResult, DiffItem, FolderNode } from '../../types'
import type { DatabaseManager } from '../database/DatabaseManager'

export class ComparisonEngine {
  constructor(private dbManager: DatabaseManager) {}

  /**
   * 对比两个快照
   * @param snapshotIdA 快照 A 的 ID（旧快照）
   * @param snapshotIdB 快照 B 的 ID（新快照）
   * @returns 对比结果
   */
  compareSnapshots(snapshotIdA: string, snapshotIdB: string): ComparisonResult {
    console.log(`[ComparisonEngine] Comparing snapshots: ${snapshotIdA} vs ${snapshotIdB}`)

    // 1. 加载两个快照
    const snapshotA = this.dbManager.loadSnapshotById(snapshotIdA)
    const snapshotB = this.dbManager.loadSnapshotById(snapshotIdB)

    if (!snapshotA) {
      throw new Error(`Snapshot A not found: ${snapshotIdA}`)
    }

    if (!snapshotB) {
      throw new Error(`Snapshot B not found: ${snapshotIdB}`)
    }

    // 2. 构建路径映射（路径 -> 大小）
    const pathMapA = this.buildPathMap(snapshotA.rootNode)
    const pathMapB = this.buildPathMap(snapshotB.rootNode)

    // 3. 计算所有差异
    const allDiffs: DiffItem[] = []

    // 3.1. 找出所有路径
    const allPaths = new Set<string>([...pathMapA.keys(), ...pathMapB.keys()])

    // 3.2. 计算每个路径的差异
    for (const path of allPaths) {
      const sizeA = pathMapA.get(path) ?? 0
      const sizeB = pathMapB.get(path) ?? 0

      // 跳过没有变化的路径
      if (sizeA === sizeB) {
        continue
      }

      const diff = sizeB - sizeA
      const diffPercent = sizeA > 0 ? (diff / sizeA) * 100 : 100

      let status: 'new' | 'deleted' | 'modified'
      if (sizeA === 0) {
        status = 'new' // 新增
      } else if (sizeB === 0) {
        status = 'deleted' // 删除
      } else {
        status = 'modified' // 修改
      }

      allDiffs.push({
        path,
        sizeA,
        sizeB,
        diff,
        diffPercent,
        status
      })
    }

    // 4. 排序并提取 Top N
    const topN = 20 // Top 20

    // 4.1. 增长最多的目录（按 diff 降序）
    const topGrowing = allDiffs
      .filter((item) => item.diff > 0) // 只选增长的
      .sort((a, b) => b.diff - a.diff) // 按差异降序
      .slice(0, topN)

    // 4.2. 减少最多的目录（按 diff 升序）
    const topShrinking = allDiffs
      .filter((item) => item.diff < 0) // 只选减少的
      .sort((a, b) => a.diff - b.diff) // 按差异升序
      .slice(0, topN)

    // 5. 计算总大小差异
    const totalDiff = snapshotB.totalSize - snapshotA.totalSize

    // 6. 计算间隔天数
    const daysBetween = this.calculateDaysBetween(snapshotA.createdAt, snapshotB.createdAt)

    console.log(
      `[ComparisonEngine] Comparison complete: ${allDiffs.length} changes, ${topGrowing.length} growing, ${topShrinking.length} shrinking`
    )

    return {
      snapshotA,
      snapshotB,
      totalDiff,
      daysBetween,
      topGrowing,
      topShrinking
    }
  }

  /**
   * 构建路径映射（路径 -> 大小）
   * @param node 根节点
   * @returns 路径映射
   */
  private buildPathMap(node: FolderNode): Map<string, number> {
    const pathMap = new Map<string, number>()

    const traverse = (n: FolderNode): void => {
      // 添加当前节点
      pathMap.set(n.path, n.size)

      // 递归遍历子节点
      for (const child of n.children) {
        traverse(child)
      }
    }

    traverse(node)
    return pathMap
  }

  /**
   * 计算两个日期之间的天数
   * @param dateA 日期 A
   * @param dateB 日期 B
   * @returns 间隔天数
   */
  private calculateDaysBetween(dateA: Date, dateB: Date): number {
    const diffMs = Math.abs(dateB.getTime() - dateA.getTime())
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return diffDays
  }
}
