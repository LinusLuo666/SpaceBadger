/**
 * Sunburst 旭日图可视化组件
 * 使用 ECharts 实现径向层级可视化
 */

import { useEffect, useRef, type JSX } from 'react'
import * as echarts from 'echarts'
import type { FolderNode } from '../../../../types'
import { formatSize } from '../../utils/formatters'
import { useUIStore } from '../../store/useUIStore'

interface SunburstProps {
  /** 根节点数据 */
  data: FolderNode
  /** 点击节点回调 */
  onNodeClick?: (path: string) => void
  /** 可选类名 */
  className?: string
}

interface SunburstDataNode {
  name: string
  value: number
  path: string
  fileCount: number
  isAccessible: boolean
  children?: SunburstDataNode[]
}

/**
 * 将 FolderNode 转换为 ECharts Sunburst 数据格式
 */
function convertToSunburstData(node: FolderNode): SunburstDataNode {
  const result: SunburstDataNode = {
    name: node.name,
    value: node.size,
    path: node.path,
    fileCount: node.fileCount,
    isAccessible: node.isAccessible
  }

  // 递归转换子节点
  if (node.children && node.children.length > 0) {
    result.children = node.children.map((child) => convertToSunburstData(child))
  }

  return result
}

export function Sunburst({ data, onNodeClick, className = '' }: SunburstProps): JSX.Element {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)
  const { theme } = useUIStore()

  useEffect(() => {
    if (!chartRef.current) return

    // 初始化 ECharts 实例
    const isDark =
      theme === 'dark' ||
      (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    chartInstanceRef.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined)

    // 转换数据
    const sunburstData = convertToSunburstData(data)

    // 配置 ECharts 选项
    const option: echarts.EChartsOption = {
      series: [
        {
          type: 'sunburst',
          data: [sunburstData],
          radius: ['15%', '90%'],
          itemStyle: {
            borderRadius: 7,
            borderWidth: 2,
            borderColor: isDark ? '#1f2937' : '#ffffff'
          },
          label: {
            rotate: 'radial',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) => {
              // 只在扇区足够大时显示标签
              if (params.percent && params.percent > 2) {
                return params.name
              }
              return ''
            }
          },
          levels: [
            {},
            {
              r0: '15%',
              r: '35%',
              itemStyle: {
                borderWidth: 2
              },
              label: {
                rotate: 'radial'
              }
            },
            {
              r0: '35%',
              r: '70%',
              label: {
                align: 'right'
              }
            },
            {
              r0: '70%',
              r: '72%',
              label: {
                position: 'outside',
                padding: 3,
                silent: false
              },
              itemStyle: {
                borderWidth: 3
              }
            }
          ],
          emphasis: {
            focus: 'ancestor',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ],
      tooltip: {
        trigger: 'item',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const { name, value, data } = params
          const path = data.path || name
          const fileCount = data.fileCount || 0
          const percent = params.percent || 0
          const isAccessible = data.isAccessible !== false

          let tooltip = `<div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${name}</div>
            <div style="font-size: 12px; color: #888;">${path}</div>
            <div style="margin-top: 8px;">
              <div>大小: <strong>${formatSize(value)}</strong></div>
              <div>占比: <strong>${percent.toFixed(2)}%</strong></div>
              <div>文件数: <strong>${fileCount}</strong></div>
            </div>`

          if (!isAccessible) {
            tooltip += `<div style="margin-top: 4px; color: #f59e0b;">⚠️ 权限受限</div>`
          }

          tooltip += `</div>`
          return tooltip
        }
      }
    }

    chartInstanceRef.current.setOption(option)

    // 点击事件
    if (onNodeClick) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chartInstanceRef.current.on('click', (params: any) => {
        if (params.data && params.data.path) {
          onNodeClick(params.data.path)
        }
      })
    }

    // 响应式调整
    const resizeObserver = new ResizeObserver(() => {
      chartInstanceRef.current?.resize()
    })

    resizeObserver.observe(chartRef.current)

    // 清理
    return () => {
      resizeObserver.disconnect()
      chartInstanceRef.current?.dispose()
      chartInstanceRef.current = null
    }
  }, [data, onNodeClick, theme])

  return <div ref={chartRef} className={`sunburst-chart w-full h-full ${className}`} />
}
