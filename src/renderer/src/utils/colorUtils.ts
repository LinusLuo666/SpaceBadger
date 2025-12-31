/**
 * 颜色工具函数
 * 为不同类型的目录提供颜色编码
 */

import * as d3 from 'd3'

/**
 * 根据路径返回对应的颜色
 * 基于 PRD 5.2节 的设计规范
 */
export function getColorForPath(path: string): string {
  const lowerPath = path.toLowerCase()

  // 系统目录 - 灰色
  if (
    lowerPath.includes('/library') ||
    lowerPath.includes('/system') ||
    lowerPath.includes('/.') ||
    lowerPath.includes('/private')
  ) {
    return '#9ca3af'
  }

  // 文档目录 - 蓝色
  if (
    lowerPath.includes('/documents') ||
    lowerPath.includes('/desktop') ||
    lowerPath.includes('/downloads')
  ) {
    return '#3b82f6'
  }

  // 媒体目录 - 紫色
  if (
    lowerPath.includes('/pictures') ||
    lowerPath.includes('/movies') ||
    lowerPath.includes('/music') ||
    lowerPath.includes('/photos')
  ) {
    return '#a855f7'
  }

  // 应用目录 - 绿色
  if (lowerPath.includes('/applications') || lowerPath.includes('.app')) {
    return '#10b981'
  }

  // 下载目录 - 橙色
  if (lowerPath.includes('/downloads')) {
    return '#f59e0b'
  }

  // 默认颜色 - 浅灰
  return '#6b7280'
}

/**
 * 根据深度返回颜色（用于层级可视化）
 * @param depth 节点深度
 * @param basePath 基础路径（用于类型判断）
 */
export function getColorByDepth(depth: number, basePath?: string): string {
  // 如果提供了路径，优先使用路径颜色
  if (basePath) {
    const baseColor = getColorForPath(basePath)
    // 根据深度调整明暗
    return d3.color(baseColor)?.brighter(depth * 0.2).toString() || baseColor
  }

  // 默认蓝色渐变
  const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']
  return colors[Math.min(depth, colors.length - 1)]
}

/**
 * 获取增长/减少的颜色
 * @param diff 差异值（正数为增长，负数为减少）
 * @param isDarkMode 是否为深色模式
 */
export function getDiffColor(diff: number, isDarkMode = false): string {
  if (diff > 0) {
    // 增长 - 红色
    return isDarkMode ? '#FF453A' : '#FF3B30'
  } else if (diff < 0) {
    // 减少 - 绿色
    return isDarkMode ? '#32D74B' : '#34C759'
  }
  // 无变化 - 灰色
  return isDarkMode ? '#98989D' : '#86868B'
}

/**
 * 根据大小生成热力图颜色
 * @param size 文件大小（字节）
 * @param maxSize 最大大小（用于归一化）
 */
export function getHeatmapColor(size: number, maxSize: number): string {
  const ratio = size / maxSize
  const scale = d3
    .scaleSequential(d3.interpolateReds)
    .domain([0, 1])

  return scale(ratio)
}

/**
 * 为 Treemap 节点生成颜色
 * @param node 节点数据
 * @param depth 节点深度
 * @param colorMode 颜色模式：'type' | 'depth' | 'heatmap'
 * @param maxSize 最大大小（用于热力图模式）
 */
export function getTreemapNodeColor(
  nodePath: string,
  depth: number,
  colorMode: 'type' | 'depth' | 'heatmap' = 'type',
  size?: number,
  maxSize?: number
): string {
  switch (colorMode) {
    case 'type':
      return getColorForPath(nodePath)

    case 'depth':
      return getColorByDepth(depth, nodePath)

    case 'heatmap':
      if (size !== undefined && maxSize !== undefined) {
        return getHeatmapColor(size, maxSize)
      }
      return getColorForPath(nodePath)

    default:
      return getColorForPath(nodePath)
  }
}

/**
 * 生成对比模式下的颜色
 * @param diff 差异值
 * @param threshold 显著变化的阈值
 * @param isDarkMode 是否为深色模式
 */
export function getComparisonColor(
  diff: number,
  threshold: number,
  isDarkMode = false
): string | null {
  const absDiff = Math.abs(diff)

  if (absDiff < threshold) {
    return null // 变化不显著，使用默认颜色
  }

  if (diff > 0) {
    // 显著增长
    return isDarkMode ? '#FF453A' : '#FF3B30'
  } else {
    // 显著减少
    return isDarkMode ? '#32D74B' : '#34C759'
  }
}
