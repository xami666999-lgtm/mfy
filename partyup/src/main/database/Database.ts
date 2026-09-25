import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { app } from 'electron';

export class Database {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = join(app.getPath('userData'), 'partyup.db');
  }

  async initialize() {
    await mkdir(join(this.dbPath, '..'), { recursive: true });
    
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`
    });

    // Try to load existing database
    let savedDb: Uint8Array | null = null;
    try {
      savedDb = await readFile(this.dbPath);
    } catch {
      // File doesn't exist, will create new
    }

    if (savedDb) {
      this.db = new SQL.Database(savedDb);
    } else {
      this.db = new SQL.Database();
      await this.runMigrations();
      await this.save();
    }
  }

  private async runMigrations() {
    if (!this.db) return;
    
    const migrations = [
      `CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        platform TEXT,
        path TEXT,
        executable TEXT,
        args TEXT,
        cover TEXT,
        background TEXT,
        icon TEXT,
        playtime INTEGER DEFAULT 0,
        lastPlayed TEXT,
        installed INTEGER DEFAULT 1,
        hidden INTEGER DEFAULT 0,
        favorite INTEGER DEFAULT 0,
        tags TEXT,
        customFields TEXT,
        metadata TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS views (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        filters TEXT,
        sort TEXT,
        columns TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS backlog (
        gameId TEXT PRIMARY KEY,
        addedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        priority INTEGER DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS ratings (
        gameId TEXT PRIMARY KEY,
        rating INTEGER NOT NULL,
        ratedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS notes (
        gameId TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS saves (
        id TEXT PRIMARY KEY,
        gameId TEXT NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        platform TEXT,
        size INTEGER,
        modifiedAt TEXT,
        backedUp INTEGER DEFAULT 0,
        backupPath TEXT,
        FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS save_backups (
        id TEXT PRIMARY KEY,
        saveId TEXT NOT NULL,
        path TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (saveId) REFERENCES saves(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS mods (
        id TEXT PRIMARY KEY,
        gameId TEXT NOT NULL,
        sourceId TEXT NOT NULL,
        sourceModId TEXT NOT NULL,
        name TEXT NOT NULL,
        version TEXT,
        description TEXT,
        enabled INTEGER DEFAULT 0,
        loadOrder INTEGER DEFAULT 0,
        installedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS mod_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        apiUrl TEXT,
        authToken TEXT,
        enabled INTEGER DEFAULT 1,
        config TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS torrents (
        hash TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        magnet TEXT,
        path TEXT,
        progress REAL DEFAULT 0,
        status TEXT DEFAULT 'stopped',
        downloadSpeed INTEGER DEFAULT 0,
        uploadSpeed INTEGER DEFAULT 0,
        peers INTEGER DEFAULT 0,
        seeds INTEGER DEFAULT 0,
        downloadDir TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        completedAt TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS emulator_configs (
        id TEXT PRIMARY KEY,
        emulatorId TEXT NOT NULL,
        system TEXT,
        path TEXT,
        args TEXT,
        biosPath TEXT,
        config TEXT,
        UNIQUE(emulatorId, system)
      )`,
      `CREATE TABLE IF NOT EXISTS roms (
        id TEXT PRIMARY KEY,
        system TEXT NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        size INTEGER,
        crc32 TEXT,
        md5 TEXT,
        sha1 TEXT,
        cover TEXT,
        metadata TEXT,
        emulatorId TEXT,
        core TEXT,
        lastPlayed TEXT,
        playtime INTEGER DEFAULT 0,
        favorite INTEGER DEFAULT 0,
        tags TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS optimization_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        settings TEXT,
        games TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS achievement_notifications (
        id TEXT PRIMARY KEY,
        gameId TEXT NOT NULL,
        achievementId TEXT NOT NULL,
        platform TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        rarity REAL,
        unlockedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        shown INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS themes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        author TEXT,
        version TEXT,
        installedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        active INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT,
        author TEXT,
        description TEXT,
        main TEXT,
        enabled INTEGER DEFAULT 0,
        installedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        config TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS social_friends (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        platformId TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        status TEXT,
        lastSeen TEXT,
        FOREIGN KEY (platformId) REFERENCES social_platforms(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS social_platforms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config TEXT,
        enabled INTEGER DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS cloud_gaming_services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        host TEXT,
        port INTEGER,
        token TEXT,
        config TEXT,
        enabled INTEGER DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS hoard_snapshots (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        game_name TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        total_size INTEGER NOT NULL,
        compressed_size INTEGER NOT NULL,
        files TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS hoard_snapshot_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_hash TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        compressed INTEGER DEFAULT 0,
        FOREIGN KEY (snapshot_id) REFERENCES hoard_snapshots(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS hoard_blobs (
        hash TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        size INTEGER NOT NULL,
        ref_count INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const migration of migrations) {
      this.db!.exec(migration);
    }
  }

  private async save() {
    if (!this.db) return;
    const data = this.db.export();
    await writeFile(this.dbPath, Buffer.from(data));
  }

  // Snapshot methods for HoardSyncService
  async saveSnapshot(snapshot: any) {
    if (!this.db) return;
    
    this.db.exec(`
      INSERT OR REPLACE INTO hoard_snapshots (id, game_id, game_name, timestamp, total_size, compressed_size, files)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      snapshot.id,
      snapshot.gameId,
      snapshot.gameName,
      snapshot.timestamp,
      snapshot.totalSize,
      snapshot.compressedSize,
      JSON.stringify(snapshot.files)
    ]);

    // Save individual files for deduplication tracking
    for (const file of snapshot.files) {
      this.db.exec(`
        INSERT OR REPLACE INTO hoard_snapshot_files (snapshot_id, file_path, file_hash, file_size, compressed)
        VALUES (?, ?, ?, ?, ?)
      `, [snapshot.id, file.path, file.hash, file.size, file.compressed ? 1 : 0]);

      // Track blobs
      this.db.exec(`
        INSERT INTO hoard_blobs (hash, path, size, ref_count)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(hash) DO UPDATE SET ref_count = ref_count + 1
      `, [file.hash, '', file.size]);
    }

    await this.save();
  }

  async getGameSnapshots(gameId: string): Promise<any[]> {
    if (!this.db) return [];
    
    const stmt = this.db.prepare(`
      SELECT * FROM hoard_snapshots WHERE game_id = ? ORDER BY timestamp DESC
    `);
    const rows = stmt.all([gameId]);
    
    return rows.map((row: any) => ({
      id: row.id,
      gameId: row.game_id,
      gameName: row.game_name,
      timestamp: row.timestamp,
      totalSize: row.total_size,
      compressedSize: row.compressed_size,
      files: JSON.parse(row.files || '[]')
    }));
  }

  async getSnapshot(snapshotId: string): Promise<any | null> {
    if (!this.db) return null;
    
    const stmt = this.db.prepare(`SELECT * FROM hoard_snapshots WHERE id = ?`);
    const row = stmt.get([snapshotId]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      gameId: row.game_id,
      gameName: row.game_name,
      timestamp: row.timestamp,
      totalSize: row.total_size,
      compressedSize: row.compressed_size,
      files: JSON.parse(row.files || '[]')
    };
  }

  async deleteSnapshot(snapshotId: string) {
    if (!this.db) return;
    
    // Get files first to decrement blob ref counts
    const stmt = this.db.prepare(`SELECT file_hash FROM hoard_snapshot_files WHERE snapshot_id = ?`);
    const files = stmt.all([snapshotId]);
    
    for (const file of files) {
      this.db.exec(`
        UPDATE hoard_blobs SET ref_count = ref_count - 1 WHERE hash = ?
      `, [file.file_hash]);
      
      this.db.exec(`
        DELETE FROM hoard_blobs WHERE hash = ? AND ref_count <= 0
      `, [file.file_hash]);
    }
    
    this.db.exec(`DELETE FROM hoard_snapshot_files WHERE snapshot_id = ?`, [snapshotId]);
    this.db.exec(`DELETE FROM hoard_snapshots WHERE id = ?`, [snapshotId]);
    
    await this.save();
  }

  async getStorageStats(): Promise<{
    totalGames: number;
    totalSnapshots: number;
    totalSize: number;
    deduplicatedSize: number;
    uniqueBlobs: number;
  }> {
    if (!this.db) {
      return { totalGames: 0, totalSnapshots: 0, totalSize: 0, deduplicatedSize: 0, uniqueBlobs: 0 };
    }
    
    const gamesStmt = this.db.prepare(`SELECT COUNT(DISTINCT game_id) as count FROM hoard_snapshots`);
    const snapshotsStmt = this.db.prepare(`SELECT COUNT(*) as count FROM hoard_snapshots`);
    const sizeStmt = this.db.prepare(`SELECT SUM(total_size) as total FROM hoard_snapshots`);
    const blobsStmt = this.db.prepare(`SELECT COUNT(*) as count, SUM(size) as total FROM hoard_blobs`);
    
    const games = gamesStmt.get()?.count || 0;
    const snapshots = snapshotsStmt.get()?.count || 0;
    const totalSize = sizeStmt.get()?.total || 0;
    const blobs = blobsStmt.get() || { count: 0, total: 0 };
    
    return {
      totalGames: games,
      totalSnapshots: snapshots,
      totalSize,
      deduplicatedSize: blobs.total || 0,
      uniqueBlobs: blobs.count || 0
    };
  }

  // Generic query methods
  async get<T>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.db) return null;
    const stmt = this.db.prepare(sql);
    const row = stmt.get(params);
    return row || null;
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) return [];
    const stmt = this.db.prepare(sql);
    return stmt.all(params);
  }

  async run(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
    if (!this.db) return { lastInsertRowid: 0, changes: 0 };
    const stmt = this.db.prepare(sql);
    const result = stmt.run(params);
    await this.save();
    return { lastInsertRowid: result.lastInsertRowid, changes: result.changes };
  }

  async exec(sql: string): Promise<void> {
    if (!this.db) return;
    this.db.exec(sql);
    await this.save();
  }

  async close() {
    if (this.db) {
      await this.save();
      this.db.close();
      this.db = null;
    }
  }
}