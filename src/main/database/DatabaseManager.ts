/**
 * 数据库管理器
 * 使用 better-sqlite3 管理 SQLite 数据库
 * 参考 PRD 第六节 - 本地存储方案
 */

import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import type { Snapshot, SnapshotMetadata, FolderNode, FlatFolderNode } from '../../types'

export class DatabaseManager {
  private db: Database.Database

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'spacebadger.db')
    console.log(`[DatabaseManager] Initializing database at: ${dbPath}`)

    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL') // 启用 WAL 模式提升性能
    this.initializeSchema()
  }

  /**
   * 初始化数据库表结构
   */
  private initializeSchema(): void {
    // 创建 snapshots 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id TEXT PRIMARY KEY,
        name TEXT,
        scan_path TEXT NOT NULL,
        total_size INTEGER NOT NULL,
        file_count INTEGER NOT NULL,
        folder_count INTEGER NOT NULL,
        scan_duration INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 创建 folder_nodes 表（扁平化存储目录树）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS folder_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id TEXT NOT NULL,
        path TEXT NOT NULL,
        name TEXT NOT NULL,
        size INTEGER NOT NULL,
        file_count INTEGER NOT NULL,
        parent_path TEXT,
        depth INTEGER NOT NULL,
        is_accessible INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
      );
    `)

    // 创建 settings 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)

    // 创建索引（参考 PRD 6.2节）
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_folder_snapshot ON folder_nodes(snapshot_id);
      CREATE INDEX IF NOT EXISTS idx_folder_path ON folder_nodes(path);
      CREATE INDEX IF NOT EXISTS idx_folder_size ON folder_nodes(size DESC);
      CREATE INDEX IF NOT EXISTS idx_snapshots_created ON snapshots(created_at DESC);
    `)

    console.log('[DatabaseManager] Schema initialized successfully')
  }

  /**
   * 保存快照
   * @param snapshot 快照对象
   */
  saveSnapshot(snapshot: Snapshot): void {
    const transaction = this.db.transaction(() => {
      // 1. 保存快照元数据
      const insertSnapshotStmt = this.db.prepare(`
        INSERT INTO snapshots (id, name, scan_path, total_size, file_count, folder_count, scan_duration, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      insertSnapshotStmt.run(
        snapshot.id,
        snapshot.name,
        snapshot.scanPath,
        snapshot.totalSize,
        snapshot.fileCount,
        snapshot.folderCount,
        snapshot.scanDuration,
        snapshot.createdAt.toISOString()
      )

      // 2. 扁平化并保存文件夹节点
      const flatNodes = this.flattenFolderTree(snapshot.rootNode, snapshot.id)

      const insertNodeStmt = this.db.prepare(`
        INSERT INTO folder_nodes (snapshot_id, path, name, size, file_count, parent_path, depth, is_accessible)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const node of flatNodes) {
        insertNodeStmt.run(
          node.snapshotId,
          node.path,
          node.name,
          node.size,
          node.fileCount,
          node.parentPath,
          node.depth,
          node.isAccessible ? 1 : 0
        )
      }

      console.log(
        `[DatabaseManager] Saved snapshot ${snapshot.id} with ${flatNodes.length} folder nodes`
      )
    })

    transaction()
  }

  /**
   * 加载快照列表（仅元数据，不包含 rootNode）
   * @param limit 限制返回数量
   * @param offset 偏移量
   */
  loadSnapshots(limit = 50, offset = 0): { snapshots: SnapshotMetadata[]; total: number } {
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM snapshots')
    const total = (countStmt.get() as { count: number }).count

    const stmt = this.db.prepare(`
      SELECT id, name, scan_path, total_size, file_count, folder_count, scan_duration, created_at
      FROM snapshots
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)

    const rows = stmt.all(limit, offset) as Array<{
      id: string
      name: string | null
      scan_path: string
      total_size: number
      file_count: number
      folder_count: number
      scan_duration: number
      created_at: string
    }>

    const snapshots: SnapshotMetadata[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at),
      scanPath: row.scan_path,
      totalSize: row.total_size,
      fileCount: row.file_count,
      folderCount: row.folder_count,
      scanDuration: row.scan_duration
    }))

    console.log(`[DatabaseManager] Loaded ${snapshots.length} snapshots (total: ${total})`)
    return { snapshots, total }
  }

  /**
   * 根据 ID 加载完整快照（包含重建的 rootNode 树）
   * @param id 快照 ID
   */
  loadSnapshotById(id: string): Snapshot | null {
    // 1. 加载快照元数据
    const stmt = this.db.prepare(`
      SELECT id, name, scan_path, total_size, file_count, folder_count, scan_duration, created_at
      FROM snapshots
      WHERE id = ?
    `)

    const row = stmt.get(id) as
      | {
          id: string
          name: string | null
          scan_path: string
          total_size: number
          file_count: number
          folder_count: number
          scan_duration: number
          created_at: string
        }
      | undefined

    if (!row) {
      console.warn(`[DatabaseManager] Snapshot not found: ${id}`)
      return null
    }

    // 2. 加载所有文件夹节点
    const nodesStmt = this.db.prepare(`
      SELECT path, name, size, file_count, parent_path, depth, is_accessible
      FROM folder_nodes
      WHERE snapshot_id = ?
      ORDER BY depth ASC, path ASC
    `)

    const nodes = nodesStmt.all(id) as Array<{
      path: string
      name: string
      size: number
      file_count: number
      parent_path: string | null
      depth: number
      is_accessible: number
    }>

    // 3. 重建目录树
    const rootNode = this.rebuildFolderTree(nodes)

    if (!rootNode) {
      console.error(`[DatabaseManager] Failed to rebuild tree for snapshot: ${id}`)
      return null
    }

    const snapshot: Snapshot = {
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at),
      scanPath: row.scan_path,
      totalSize: row.total_size,
      fileCount: row.file_count,
      folderCount: row.folder_count,
      scanDuration: row.scan_duration,
      rootNode
    }

    console.log(`[DatabaseManager] Loaded snapshot ${id} with ${nodes.length} folder nodes`)
    return snapshot
  }

  /**
   * 删除快照
   * @param id 快照 ID
   */
  deleteSnapshot(id: string): void {
    const stmt = this.db.prepare('DELETE FROM snapshots WHERE id = ?')
    const result = stmt.run(id)

    if (result.changes > 0) {
      console.log(`[DatabaseManager] Deleted snapshot ${id}`)
    } else {
      console.warn(`[DatabaseManager] Snapshot not found for deletion: ${id}`)
    }
  }

  /**
   * 重命名快照
   * @param id 快照 ID
   * @param name 新名称
   */
  renameSnapshot(id: string, name: string): void {
    const stmt = this.db.prepare('UPDATE snapshots SET name = ? WHERE id = ?')
    const result = stmt.run(name, id)

    if (result.changes > 0) {
      console.log(`[DatabaseManager] Renamed snapshot ${id} to "${name}"`)
    } else {
      console.warn(`[DatabaseManager] Snapshot not found for rename: ${id}`)
    }
  }

  /**
   * 获取设置
   * @param key 设置键
   */
  getSetting(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?')
    const row = stmt.get(key) as { value: string } | undefined
    return row?.value ?? null
  }

  /**
   * 保存设置
   * @param key 设置键
   * @param value 设置值
   */
  setSetting(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
    stmt.run(key, value)
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close()
    console.log('[DatabaseManager] Database closed')
  }

  // ========== 私有辅助方法 ==========

  /**
   * 将树形结构扁平化为数组
   * @param node 根节点
   * @param snapshotId 快照 ID
   * @param parentPath 父路径
   * @param depth 深度
   */
  private flattenFolderTree(
    node: FolderNode,
    snapshotId: string,
    parentPath: string | null = null,
    depth = 0
  ): FlatFolderNode[] {
    const result: FlatFolderNode[] = []

    // 添加当前节点
    result.push({
      snapshotId,
      path: node.path,
      name: node.name,
      size: node.size,
      fileCount: node.fileCount,
      parentPath,
      depth,
      isAccessible: node.isAccessible
    })

    // 递归添加子节点
    for (const child of node.children) {
      result.push(...this.flattenFolderTree(child, snapshotId, node.path, depth + 1))
    }

    return result
  }

  /**
   * 从扁平化数组重建树形结构
   * @param nodes 扁平化的节点数组
   */
  private rebuildFolderTree(
    nodes: Array<{
      path: string
      name: string
      size: number
      file_count: number
      parent_path: string | null
      depth: number
      is_accessible: number
    }>
  ): FolderNode | null {
    if (nodes.length === 0) return null

    // 创建路径到节点的映射
    const nodeMap = new Map<string, FolderNode>()

    // 第一遍：创建所有节点
    for (const row of nodes) {
      nodeMap.set(row.path, {
        path: row.path,
        name: row.name,
        size: row.size,
        fileCount: row.file_count,
        children: [],
        isAccessible: row.is_accessible === 1
      })
    }

    // 第二遍：建立父子关系
    let rootNode: FolderNode | null = null

    for (const row of nodes) {
      const node = nodeMap.get(row.path)!

      if (row.parent_path === null) {
        // 根节点
        rootNode = node
      } else {
        // 子节点：添加到父节点的 children
        const parent = nodeMap.get(row.parent_path)
        if (parent) {
          parent.children.push(node)
        } else {
          console.warn(
            `[DatabaseManager] Parent not found for node: ${row.path} (parent: ${row.parent_path})`
          )
        }
      }
    }

    return rootNode
  }
}
