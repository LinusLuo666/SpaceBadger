/**
 * 可视化容器组件
 * 整合 Treemap、ListView、Breadcrumb 和 DetailPanel
 */

import { useState } from 'react'
import type { JSX } from 'react'
import type { Snapshot, FolderNode } from '../../../../types'
import { useUIStore } from '../../store/useUIStore'
import { Treemap, Tooltip } from '../Treemap'
import { ListView } from '../ListView'
import { Breadcrumb } from '../Breadcrumb'
import { DetailPanel } from '../DetailPanel'
import { Sunburst } from '../Sunburst'

interface VisualizationContainerProps {
  snapshot: Snapshot
  className?: string
}

export function VisualizationContainer({
  snapshot,
  className = ''
}: VisualizationContainerProps): JSX.Element {
  const { visualizationType, setVisualizationType } = useUIStore()
  const [currentNode, setCurrentNode] = useState<FolderNode>(snapshot.rootNode)
  const [hoveredNode, setHoveredNode] = useState<FolderNode | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // 导航到指定节点
  const handleNavigate = (node: FolderNode): void => {
    setCurrentNode(node)
  }

  // 通过路径导航
  const handleNavigateToPath = (path: string): void => {
    // 从根节点开始查找
    const findNode = (node: FolderNode, targetPath: string): FolderNode | null => {
      if (node.path === targetPath) return node

      for (const child of node.children) {
        const found = findNode(child, targetPath)
        if (found) return found
      }

      return null
    }

    const targetNode = findNode(snapshot.rootNode, path)
    if (targetNode) {
      setCurrentNode(targetNode)
    }
  }

  // 处理节点点击
  const handleNodeClick = (node: FolderNode): void => {
    if (node.children.length > 0) {
      setCurrentNode(node)
    }
  }

  // 处理节点悬停
  const handleNodeHover = (node: FolderNode | null, event?: MouseEvent): void => {
    setHoveredNode(node)
    if (event) {
      setTooltipPosition({ x: event.clientX + 10, y: event.clientY + 10 })
    }
  }

  return (
    <div className={`visualization-container flex flex-col h-full ${className}`}>
      {/* 工具栏 */}
      <div className="toolbar flex items-center justify-between p-4 bg-white dark:bg-dark-bg border-b border-gray-200 dark:border-gray-700">
        {/* 视图切换 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisualizationType('treemap')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              visualizationType === 'treemap'
                ? 'bg-light-primary dark:bg-dark-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            📊 Treemap
          </button>
          <button
            onClick={() => setVisualizationType('sunburst')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              visualizationType === 'sunburst'
                ? 'bg-light-primary dark:bg-dark-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            ☀️ Sunburst
          </button>
          <button
            onClick={() => setVisualizationType('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              visualizationType === 'list'
                ? 'bg-light-primary dark:bg-dark-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            📋 列表
          </button>
        </div>

        {/* 返回根目录按钮 */}
        {currentNode.path !== snapshot.rootNode.path && (
          <button
            onClick={() => setCurrentNode(snapshot.rootNode)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            ← 返回根目录
          </button>
        )}
      </div>

      {/* 面包屑导航 */}
      <Breadcrumb currentPath={currentNode.path} onNavigate={handleNavigateToPath} />

      {/* 主内容区域 */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* 可视化区域 */}
        <div className="flex-1 min-w-0">
          {visualizationType === 'treemap' ? (
            <div className="relative h-full">
              <Treemap
                data={currentNode}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
                className="h-full"
              />
              {hoveredNode && (
                <div
                  style={{
                    left: tooltipPosition.x,
                    top: tooltipPosition.y
                  }}
                >
                  <Tooltip node={hoveredNode} totalSize={snapshot.totalSize} />
                </div>
              )}
            </div>
          ) : visualizationType === 'sunburst' ? (
            <div className="h-full bg-white dark:bg-dark-bg rounded-lg shadow-md">
              <Sunburst data={currentNode} onNodeClick={handleNavigateToPath} />
            </div>
          ) : (
            <ListView data={currentNode} onNavigate={handleNavigate} />
          )}
        </div>

        {/* 详情面板 */}
        <div className="w-96 flex-shrink-0 overflow-y-auto">
          <DetailPanel
            node={currentNode}
            totalSize={snapshot.totalSize}
            onNavigate={handleNavigate}
          />
        </div>
      </div>
    </div>
  )
}
