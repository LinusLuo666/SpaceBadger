/**
 * 对比视图
 * 对比两个快照，查看空间变化趋势
 */

import { useEffect, type JSX } from 'react'
import { useSnapshotStore } from '../../store/useSnapshotStore'
import { useComparisonStore } from '../../store/useComparisonStore'
import { formatSize, formatRelativeTime } from '../../utils/formatters'

export function CompareView(): JSX.Element {
  const { snapshots, loadSnapshots } = useSnapshotStore()
  const {
    snapshotAId,
    snapshotBId,
    comparisonResult,
    isComparing,
    error,
    setSnapshotA,
    setSnapshotB,
    compare,
    clearComparison
  } = useComparisonStore()

  // 加载快照列表
  useEffect(() => {
    loadSnapshots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 处理对比
  const handleCompare = (): void => {
    compare()
  }

  // 处理清除
  const handleClear = (): void => {
    clearComparison()
  }

  // 快照选项
  const snapshotOptions = snapshots.map((s) => ({
    id: s.id,
    label: `${s.name || '未命名'} - ${formatRelativeTime(s.createdAt)} (${formatSize(s.totalSize)})`
  }))

  return (
    <div className="compare-view">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">快照对比</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          对比两个快照，查看空间变化趋势
        </p>
      </div>

      {/* 快照选择器 */}
      <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">选择快照</h3>

        {snapshots.length < 2 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚖️</div>
            <h4 className="text-xl font-semibold text-light-text dark:text-dark-text mb-2">
              需要至少两个快照
            </h4>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              进行多次扫描后，您可以在这里对比不同时间点的空间占用情况
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 快照 A */}
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                快照 A（旧）
              </label>
              <select
                value={snapshotAId || ''}
                onChange={(e) => setSnapshotA(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择快照</option>
                {snapshotOptions.map((option) => (
                  <option key={option.id} value={option.id} disabled={option.id === snapshotBId}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 快照 B */}
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                快照 B（新）
              </label>
              <select
                value={snapshotBId || ''}
                onChange={(e) => setSnapshotB(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择快照</option>
                {snapshotOptions.map((option) => (
                  <option key={option.id} value={option.id} disabled={option.id === snapshotAId}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {snapshots.length >= 2 && (
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleCompare}
              disabled={!snapshotAId || !snapshotBId || isComparing}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isComparing ? '对比中...' : '开始对比'}
            </button>
            {comparisonResult && (
              <button
                onClick={handleClear}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-light-text dark:text-dark-text rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                清除结果
              </button>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* 对比结果 */}
      {comparisonResult && (
        <div className="space-y-6">
          {/* 总体变化 */}
          <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
              总体变化
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                  快照 A
                </div>
                <div className="text-2xl font-bold text-light-text dark:text-dark-text">
                  {formatSize(comparisonResult.snapshotA.totalSize)}
                </div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {comparisonResult.snapshotA.name || '未命名'}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                  变化
                </div>
                <div
                  className={`text-2xl font-bold ${
                    comparisonResult.totalDiff > 0
                      ? 'text-red-500'
                      : comparisonResult.totalDiff < 0
                        ? 'text-green-500'
                        : 'text-gray-500'
                  }`}
                >
                  {comparisonResult.totalDiff > 0 ? '+' : ''}
                  {formatSize(comparisonResult.totalDiff)}
                </div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  间隔 {comparisonResult.daysBetween} 天
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                  快照 B
                </div>
                <div className="text-2xl font-bold text-light-text dark:text-dark-text">
                  {formatSize(comparisonResult.snapshotB.totalSize)}
                </div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {comparisonResult.snapshotB.name || '未命名'}
                </div>
              </div>
            </div>
          </div>

          {/* 增长最多的目录 */}
          {comparisonResult.topGrowing.length > 0 && (
            <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
                增长最多的目录 (Top {comparisonResult.topGrowing.length})
              </h3>
              <div className="space-y-2">
                {comparisonResult.topGrowing.map((item, index) => (
                  <div
                    key={item.path}
                    className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30"
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                        {item.path}
                      </div>
                      <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {formatSize(item.sizeA)} → {formatSize(item.sizeB)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-lg font-bold text-red-500">+{formatSize(item.diff)}</div>
                      <div className="text-xs text-red-500">+{item.diffPercent.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 减少最多的目录 */}
          {comparisonResult.topShrinking.length > 0 && (
            <div className="bg-white dark:bg-dark-bg rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
                减少最多的目录 (Top {comparisonResult.topShrinking.length})
              </h3>
              <div className="space-y-2">
                {comparisonResult.topShrinking.map((item, index) => (
                  <div
                    key={item.path}
                    className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30"
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                        {item.path}
                      </div>
                      <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {formatSize(item.sizeA)} → {formatSize(item.sizeB)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-lg font-bold text-green-500">
                        {formatSize(item.diff)}
                      </div>
                      <div className="text-xs text-green-500">{item.diffPercent.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
