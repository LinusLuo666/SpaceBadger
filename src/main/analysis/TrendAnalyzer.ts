/**
 * 趋势分析器
 * 分析某个路径在多个快照中的大小变化趋势
 * 参考 PRD 第三节 - 历史对比功能
 */

import type { TrendData, TrendDataPoint, FolderNode } from '../../types'
import type { DatabaseManager } from '../database/DatabaseManager'

export class TrendAnalyzer {
  constructor(private dbManager: DatabaseManager) {}

  /**
   * 分析趋势
   * @param snapshotIds 快照 ID 列表（应按时间排序）
   * @param targetPath 目标路径
   * @returns 趋势数据
   */
  analyzeTrend(snapshotIds: string[], targetPath: string): TrendData {
    console.log(
      `[TrendAnalyzer] Analyzing trend for path: ${targetPath} across ${snapshotIds.length} snapshots`
    )

    if (snapshotIds.length === 0) {
      throw new Error('Snapshot IDs array cannot be empty')
    }

    const points: TrendDataPoint[] = []

    // 遍历每个快照，提取目标路径的大小
    for (const snapshotId of snapshotIds) {
      const snapshot = this.dbManager.loadSnapshotById(snapshotId)

      if (!snapshot) {
        console.warn(`[TrendAnalyzer] Snapshot not found: ${snapshotId}, skipping`)
        continue
      }

      // 在目录树中查找目标路径
      const size = this.findPathSize(snapshot.rootNode, targetPath)

      // 添加数据点
      points.push({
        date: snapshot.createdAt,
        size: size ?? 0 // 如果路径不存在，大小为 0
      })
    }

    // 按时间排序（确保顺序正确）
    points.sort((a, b) => a.date.getTime() - b.date.getTime())

    console.log(`[TrendAnalyzer] Trend analysis complete: ${points.length} data points`)

    return {
      path: targetPath,
      points
    }
  }

  /**
   * 在目录树中查找指定路径的大小
   * @param node 根节点
   * @param targetPath 目标路径
   * @returns 路径大小，如果未找到返回 null
   */
  private findPathSize(node: FolderNode, targetPath: string): number | null {
    // 精确匹配当前节点
    if (node.path === targetPath) {
      return node.size
    }

    // 检查目标路径是否在当前节点的子树中
    // 如果目标路径不以当前节点路径开头，说明不在子树中
    if (!targetPath.startsWith(node.path)) {
      return null
    }

    // 递归搜索子节点
    for (const child of node.children) {
      const result = this.findPathSize(child, targetPath)
      if (result !== null) {
        return result
      }
    }

    // 未找到
    return null
  }
}
