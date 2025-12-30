/**
 * SpaceBadger 核心数据类型定义
 * 参考 PRD 第六节 - 数据模型
 */

/**
 * 文件夹节点
 * 表示目录树中的一个节点（文件夹）
 */
export interface FolderNode {
  /** 完整路径 */
  path: string
  /** 文件夹名称 */
  name: string
  /** 大小（字节）- 包含所有子文件和子文件夹 */
  size: number
  /** 直接子文件数（不包含子文件夹中的文件） */
  fileCount: number
  /** 子文件夹列表 */
  children: FolderNode[]
  /** 是否有权限访问（false 表示权限被拒绝） */
  isAccessible: boolean
}

/**
 * 扫描快照
 * 表示某一时刻的磁盘扫描结果
 */
export interface Snapshot {
  /** UUID */
  id: string
  /** 用户自定义名称（可选） */
  name: string | null
  /** 创建时间 */
  createdAt: Date
  /** 扫描根路径 */
  scanPath: string
  /** 总大小（字节） */
  totalSize: number
  /** 文件总数 */
  fileCount: number
  /** 文件夹总数 */
  folderCount: number
  /** 扫描耗时（毫秒） */
  scanDuration: number
  /** 目录树根节点 */
  rootNode: FolderNode
}

/**
 * 差异项
 * 表示两个快照之间某个路径的差异
 */
export interface DiffItem {
  /** 路径 */
  path: string
  /** 快照 A 中的大小 */
  sizeA: number
  /** 快照 B 中的大小 */
  sizeB: number
  /** 差异（sizeB - sizeA） */
  diff: number
  /** 增长百分比 */
  diffPercent: number
  /** 状态：新增/删除/修改 */
  status: 'new' | 'deleted' | 'modified'
}

/**
 * 对比结果
 * 表示两个快照的完整对比分析
 */
export interface ComparisonResult {
  /** 快照 A */
  snapshotA: Snapshot
  /** 快照 B */
  snapshotB: Snapshot
  /** 总大小差异 */
  totalDiff: number
  /** 间隔天数 */
  daysBetween: number
  /** 增长最多的目录（Top N） */
  topGrowing: DiffItem[]
  /** 减少最多的目录（Top N） */
  topShrinking: DiffItem[]
}

/**
 * 趋势数据点
 * 表示某个路径在某个时间点的大小
 */
export interface TrendDataPoint {
  /** 时间 */
  date: Date
  /** 大小（字节） */
  size: number
}

/**
 * 趋势数据
 * 表示某个路径在多个快照间的大小变化
 */
export interface TrendData {
  /** 路径 */
  path: string
  /** 数据点列表（按时间排序） */
  points: TrendDataPoint[]
}

/**
 * 扫描进度数据
 * 用于实时更新扫描进度
 */
export interface ScanProgress {
  /** 当前正在扫描的路径 */
  currentPath: string
  /** 已处理的大小（字节） */
  processedSize: number
  /** 进度百分比 (0-100) */
  percentage: number
  /** 可选：预估剩余时间（秒） */
  estimatedTimeRemaining?: number
  /** 可选：扫描速度（字节/秒） */
  speed?: number
}

/**
 * 数据库中的快照元数据
 * 用于快照列表显示，不包含 rootNode
 */
export interface SnapshotMetadata {
  id: string
  name: string | null
  createdAt: Date
  scanPath: string
  totalSize: number
  fileCount: number
  folderCount: number
  scanDuration: number
}

/**
 * 扁平化的文件夹节点（用于数据库存储）
 */
export interface FlatFolderNode {
  id?: number
  snapshotId: string
  path: string
  name: string
  size: number
  fileCount: number
  parentPath: string | null
  depth: number
  isAccessible: boolean
}

/**
 * 应用设置
 */
export interface AppSettings {
  /** 排除的目录列表 */
  excludedPaths: string[]
  /** 自动快照间隔（小时，0 表示禁用） */
  autoSnapshotInterval: number
  /** 主题模式 */
  theme: 'light' | 'dark' | 'auto'
  /** 默认可视化类型 */
  defaultVisualization: 'treemap' | 'sunburst' | 'list'
  /** 增长阈值（字节）- 超过此值才显示为"显著增长" */
  growthThreshold: number
}

/**
 * 扫描选项
 */
export interface ScanOptions {
  /** 要扫描的路径 */
  path: string
  /** 排除的目录模式列表 */
  excludePatterns?: string[]
  /** 最大深度（0 表示无限制） */
  maxDepth?: number
  /** 是否跟踪符号链接 */
  followSymlinks?: boolean
}

/**
 * Worker 消息类型
 */
export type WorkerMessageType = 'progress' | 'complete' | 'error'

/**
 * Worker 进度消息
 */
export interface WorkerProgressMessage {
  type: 'progress'
  path: string
  size: number
}

/**
 * Worker 完成消息
 */
export interface WorkerCompleteMessage {
  type: 'complete'
  rootNode: FolderNode
  scanDuration: number
}

/**
 * Worker 错误消息
 */
export interface WorkerErrorMessage {
  type: 'error'
  error: string
}

/**
 * Worker 消息联合类型
 */
export type WorkerMessage = WorkerProgressMessage | WorkerCompleteMessage | WorkerErrorMessage
