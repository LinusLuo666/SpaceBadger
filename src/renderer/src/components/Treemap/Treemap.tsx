/**
 * Treemap 可视化组件
 * 使用 D3.js 渲染文件夹层级结构
 */

import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import * as d3 from 'd3'
import type { FolderNode } from '../../../../types'
import { getTreemapNodeColor } from '../../utils/colorUtils'
import { formatSize } from '../../utils/formatters'

interface TreemapProps {
  data: FolderNode
  onNodeClick?: (node: FolderNode) => void
  onNodeHover?: (node: FolderNode | null) => void
  colorMode?: 'type' | 'depth' | 'heatmap'
  className?: string
}

interface D3Node extends d3.HierarchyRectangularNode<FolderNode> {
  data: FolderNode
}

export function Treemap({
  data,
  onNodeClick,
  onNodeHover,
  colorMode = 'type',
  className = ''
}: TreemapProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  // 监听容器大小变化
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })

    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  // 渲染 Treemap
  useEffect(() => {
    if (!svgRef.current || !data) return

    const { width, height } = dimensions

    // 清空旧内容
    d3.select(svgRef.current).selectAll('*').remove()

    // 创建层级结构
    const root = d3
      .hierarchy(data)
      .sum((d) => d.size)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    // 创建 treemap 布局
    const treemapLayout = d3
      .treemap<FolderNode>()
      .size([width, height])
      .paddingInner(2)
      .paddingOuter(4)
      .round(true)

    treemapLayout(root)

    // 创建 SVG 容器
    const svg = d3.select(svgRef.current)

    // 获取最大 size 用于热力图模式
    const maxSize = d3.max(root.descendants(), (d) => d.data.size) || 1

    // 创建节点组
    const nodes = svg
      .selectAll<SVGGElement, D3Node>('g')
      .data(root.descendants() as D3Node[])
      .join('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer')

    // 绘制矩形
    nodes
      .append('rect')
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d) =>
        getTreemapNodeColor(d.data.path, d.depth, colorMode, d.data.size, maxSize)
      )
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', (d) => (d.data.isAccessible ? 1 : 0.5))
      .on('click', (event, d) => {
        event.stopPropagation()
        if (onNodeClick) {
          onNodeClick(d.data)
        }
      })
      .on('mouseenter', (event, d) => {
        // 高亮效果
        d3.select(event.currentTarget).attr('stroke', '#000').attr('stroke-width', 2)

        if (onNodeHover) {
          onNodeHover(d.data)
        }
      })
      .on('mouseleave', (event) => {
        // 取消高亮
        d3.select(event.currentTarget).attr('stroke', '#fff').attr('stroke-width', 1)

        if (onNodeHover) {
          onNodeHover(null)
        }
      })

    // 添加文本标签（仅对足够大的节点）
    nodes
      .append('text')
      .attr('x', 4)
      .attr('y', 16)
      .style('font-size', '12px')
      .style('fill', '#000')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .text((d) => {
        const width = d.x1 - d.x0
        const height = d.y1 - d.y0
        // 只在足够大的节点上显示名称
        if (width > 60 && height > 30) {
          return d.data.name
        }
        return ''
      })

    // 添加大小标签（对更大的节点）
    nodes
      .append('text')
      .attr('x', 4)
      .attr('y', 32)
      .style('font-size', '10px')
      .style('fill', '#333')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .text((d) => {
        const width = d.x1 - d.x0
        const height = d.y1 - d.y0
        // 只在足够大的节点上显示大小
        if (width > 80 && height > 50) {
          return formatSize(d.data.size)
        }
        return ''
      })
  }, [data, dimensions, colorMode, onNodeClick, onNodeHover])

  return (
    <div ref={containerRef} className={`treemap-container w-full h-full ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="treemap-svg"
      />
    </div>
  )
}
