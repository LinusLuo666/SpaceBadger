/**
 * 格式化工具函数
 */

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的大小字符串 (例如: "1.23 GB")
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  // 处理负数
  const isNegative = bytes < 0
  const absBytes = Math.abs(bytes)

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const k = 1024
  const i = Math.floor(Math.log(absBytes) / Math.log(k))
  const size = absBytes / Math.pow(k, i)

  return `${isNegative ? '-' : ''}${size.toFixed(2)} ${units[i]}`
}

/**
 * 格式化日期时间
 * @param date 日期对象或时间戳
 * @returns 格式化后的日期时间字符串
 */
export function formatDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date)

  // 格式：2024-01-15 14:30:25
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化相对时间（距离现在）
 * @param date 日期对象
 * @returns 相对时间字符串 (例如: "2小时前", "3天前")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
  return `${Math.floor(diffDays / 365)}年前`
}

/**
 * 格式化时长
 * @param ms 毫秒数
 * @returns 格式化后的时长字符串 (例如: "1分30秒", "2小时15分")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}毫秒`

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return `${seconds}秒`
  if (minutes < 60) return `${minutes}分${seconds % 60}秒`
  return `${hours}小时${minutes % 60}分`
}

/**
 * 格式化速度
 * @param bytesPerSecond 每秒字节数
 * @returns 格式化后的速度字符串 (例如: "1.23 MB/s")
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatSize(bytesPerSecond)}/s`
}

/**
 * 格式化百分比
 * @param value 0-100 的数值
 * @param decimals 小数位数，默认为 1
 * @returns 格式化后的百分比字符串 (例如: "45.3%")
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}
