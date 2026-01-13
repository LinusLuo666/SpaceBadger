/**
 * formatters 工具函数测试
 */

import { describe, it, expect } from 'vitest'
import {
  formatSize,
  formatDate,
  formatRelativeTime,
  formatDuration,
  formatSpeed,
  formatPercentage
} from '../formatters'

describe('formatSize', () => {
  it('应该正确格式化字节大小', () => {
    expect(formatSize(0)).toBe('0 B')
    expect(formatSize(512)).toBe('512.00 B')
    expect(formatSize(1024)).toBe('1.00 KB')
    expect(formatSize(1536)).toBe('1.50 KB')
    expect(formatSize(1048576)).toBe('1.00 MB')
    expect(formatSize(1073741824)).toBe('1.00 GB')
    expect(formatSize(1099511627776)).toBe('1.00 TB')
  })

  it('应该处理负数', () => {
    // 负数应该正确格式化，显示负号
    expect(formatSize(-1024)).toBe('-1.00 KB')
    expect(formatSize(-1048576)).toBe('-1.00 MB')
    expect(formatSize(-1536)).toBe('-1.50 KB')
  })

  it('应该正确四舍五入', () => {
    expect(formatSize(1536)).toBe('1.50 KB')
    expect(formatSize(1590)).toBe('1.55 KB')
  })
})

describe('formatDate', () => {
  it('应该正确格式化日期', () => {
    const date = new Date('2024-01-15T10:30:00')
    const result = formatDate(date)
    expect(result).toBe('2024-01-15 10:30:00')
  })

  it('应该正确处理月份和日期的前导零', () => {
    const date = new Date('2024-03-05T08:05:03')
    const result = formatDate(date)
    expect(result).toBe('2024-03-05 08:05:03')
  })
})

describe('formatRelativeTime', () => {
  it('应该显示"刚刚"', () => {
    const now = new Date()
    const result = formatRelativeTime(now)
    expect(result).toBe('刚刚')
  })

  it('应该显示分钟前', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const result = formatRelativeTime(fiveMinutesAgo)
    expect(result).toBe('5分钟前')
  })

  it('应该显示小时前', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const result = formatRelativeTime(twoHoursAgo)
    expect(result).toBe('2小时前')
  })

  it('应该显示天前', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(threeDaysAgo)
    expect(result).toBe('3天前')
  })

  it('应该显示月前', () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(twoMonthsAgo)
    expect(result).toBe('2个月前')
  })
})

describe('formatDuration', () => {
  it('应该正确格式化毫秒', () => {
    expect(formatDuration(500)).toBe('500毫秒')
    expect(formatDuration(999)).toBe('999毫秒')
  })

  it('应该正确格式化秒', () => {
    expect(formatDuration(1000)).toBe('1秒')
    expect(formatDuration(5000)).toBe('5秒')
    expect(formatDuration(59000)).toBe('59秒')
  })

  it('应该正确格式化分钟', () => {
    expect(formatDuration(60000)).toBe('1分0秒')
    expect(formatDuration(120000)).toBe('2分0秒')
    expect(formatDuration(90000)).toBe('1分30秒')
  })

  it('应该正确格式化小时', () => {
    expect(formatDuration(3600000)).toBe('1小时0分')
    expect(formatDuration(7200000)).toBe('2小时0分')
  })
})

describe('formatSpeed', () => {
  it('应该正确格式化速度', () => {
    expect(formatSpeed(0)).toBe('0 B/s')
    expect(formatSpeed(512)).toBe('512.00 B/s')
    expect(formatSpeed(1024)).toBe('1.00 KB/s')
    expect(formatSpeed(1048576)).toBe('1.00 MB/s')
    expect(formatSpeed(1073741824)).toBe('1.00 GB/s')
  })
})

describe('formatPercentage', () => {
  it('应该正确格式化百分比', () => {
    expect(formatPercentage(0)).toBe('0.0%')
    expect(formatPercentage(0.5)).toBe('0.5%')
    expect(formatPercentage(50)).toBe('50.0%')
    expect(formatPercentage(100)).toBe('100.0%')
  })

  it('应该正确四舍五入到一位小数', () => {
    expect(formatPercentage(12.34)).toBe('12.3%')
    expect(formatPercentage(12.36)).toBe('12.4%')
  })
})
