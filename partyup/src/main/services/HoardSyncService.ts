import { createHash } from 'crypto';
import { join, relative } from 'path';
import { readFile, writeFile, mkdir, readdir, stat, rm } from 'fs/promises';
import { app } from 'electron';
import { Database } from '../database/Database.js';

export interface SaveSnapshot {
  id: string;
  gameId: string;
  gameName: string;
  timestamp: string;
  files: SaveFile[];
  totalSize: number;
  compressedSize: number;
}

export interface SaveFile {
  path: string;
  hash: string;
  size: number;
  compressed: boolean;
}

export interface SaveSyncConfig {
  enabled: boolean;
  backupPath: string;
  maxVersions: number;
  compression: 'zstd' | 'none';
  verifyOnRestore: boolean;
  autoBackup: boolean;
  backupOnExit: boolean;
  excludedPatterns: string[];
}

export class HoardSyncService {
  private config: SaveSyncConfig;
  private database: Database;
  private watchers: Map<string, any> = new Map();
  private deduplicationCache: Map<string, string> = new Map(); // hash -> stored path

  constructor(database: Database) {
    this.database = database;
    this.config = {
      enabled: true,
      backupPath: join(app.getPath('userData'), 'partyup-saves'),
      maxVersions: 100,
      compression: 'zstd',
      verifyOnRestore: true,
      autoBackup: true,
      backupOnExit: true,
      excludedPatterns: ['*.tmp', '*.log', '*.cache'],
    };
  }

  async initialize() {
    await mkdir(this.config.backupPath, { recursive: true });
    await this.rebuildDeduplicationCache();
  }

  private async rebuildDeduplicationCache() {
    const files = await this.getAllStoredFiles();
    for (const file of files) {
      this.deduplicationCache.set(file.hash, file.path);
    }
  }

  private async getAllStoredFiles(): Promise<{ hash: string; path: string }[]> {
    const results: { hash: string; path: string }[] = [];
    const gamesDir = join(this.config.backupPath, 'games');
    
    try {
      const gameDirs = await readdir(gamesDir);
      for (const gameDir of gameDirs) {
        const versionsDir = join(gamesDir, gameDir, 'versions');
        try {
          const versionDirs = await readdir(versionsDir);
          for (const versionDir of versionDirs) {
            const filesDir = join(versionsDir, versionDir, 'files');
            await this.collectFileHashes(filesDir, results);
          }
        } catch {}
      }
    } catch {}
    
    return results;
  }

  private async collectFileHashes(dir: string, results: { hash: string; path: string }[]) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await this.collectFileHashes(fullPath, results);
        } else {
          const hash = await this.hashFile(fullPath);
          results.push({ hash, path: fullPath });
        }
      }
    } catch {}
  }

  async hashFile(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    return createHash('sha256').update(buffer).digest('hex');
  }

  async shouldExclude(filePath: string): Promise<boolean> {
    const relPath = relative(this.config.backupPath, filePath);
    for (const pattern of this.config.excludedPatterns) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(relPath)) return true;
    }
    return false;
  }

  async backupGame(gameId: string, gameName: string, sourcePath: string): Promise<SaveSnapshot> {
    const files: SaveFile[] = [];
    let totalSize = 0;

    const gameFiles = await this.collectGameFiles(sourcePath);
    
    for (const file of gameFiles) {
      if (await this.shouldExclude(file.path)) continue;
      
      const hash = await this.hashFile(file.path);
      const existingPath = this.deduplicationCache.get(hash);
      
      if (existingPath) {
        // Deduplicated - reference existing file
        files.push({
          path: file.relativePath,
          hash,
          size: file.size,
          compressed: false,
        });
        totalSize += file.size;
      } else {
        // New file - store it
        const storedPath = await this.storeFile(file.path, hash);
        this.deduplicationCache.set(hash, storedPath);
        files.push({
          path: file.relativePath,
          hash,
          size: file.size,
          compressed: false,
        });
        totalSize += file.size;
      }
    }

    const snapshot: SaveSnapshot = {
      id: crypto.randomUUID(),
      gameId,
      gameName,
      timestamp: new Date().toISOString(),
      files,
      totalSize,
      compressedSize: totalSize, // Would be less with compression
    };

    await this.saveSnapshot(snapshot);
    await this.pruneOldVersions(gameId);

    return snapshot;
  }

  private async collectGameFiles(sourcePath: string): Promise<{ path: string; relativePath: string; size: number }[]> {
    const files: { path: string; relativePath: string; size: number }[] = [];
    
    async function walk(dir: string, base: string) {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = join(base, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath, relPath);
        } else {
          const stats = await stat(fullPath);
          files.push({ path: fullPath, relativePath: relPath, size: stats.size });
        }
      }
    }

    await walk(sourcePath, '');
    return files;
  }

  private async storeFile(sourcePath: string, hash: string): Promise<string> {
    const dir = join(this.config.backupPath, 'blobs', hash.slice(0, 2), hash.slice(2, 4));
    await mkdir(dir, { recursive: true });
    const destPath = join(dir, hash);
    
    // Copy with deduplication check
    try {
      await stat(destPath);
      return destPath; // Already exists
    } catch {
      await writeFile(destPath, await readFile(sourcePath));
      return destPath;
    }
  }

  private async saveSnapshot(snapshot: SaveSnapshot) {
    const gameDir = join(this.config.backupPath, 'games', snapshot.gameId);
    const versionDir = join(gameDir, 'versions', snapshot.id);
    const filesDir = join(versionDir, 'files');
    
    await mkdir(filesDir, { recursive: true });
    
    // Write manifest
    await writeFile(
      join(versionDir, 'manifest.json'),
      JSON.stringify(snapshot, null, 2)
    );

    // Create symlinks/refs to blob store for each file
    for (const file of snapshot.files) {
      const blobPath = this.getBlobPath(file.hash);
      const linkPath = join(filesDir, file.path);
      await mkdir(join(linkPath, '..'), { recursive: true });
      
      try {
        // On Windows, use junction/copy; on Unix, symlink
        if (process.platform === 'win32') {
          await writeFile(linkPath, await readFile(blobPath));
        } else {
          await import('fs').then(fs => fs.promises.symlink(blobPath, linkPath));
        }
      } catch {
        // Fallback: copy
        await writeFile(linkPath, await readFile(blobPath));
      }
    }

    // Update database
    await this.database.saveSnapshot(snapshot);
  }

  private getBlobPath(hash: string): string {
    return join(this.config.backupPath, 'blobs', hash.slice(0, 2), hash.slice(2, 4), hash);
  }

  private async pruneOldVersions(gameId: string) {
    const snapshots = await this.database.getGameSnapshots(gameId) as SaveSnapshot[];
    if (snapshots.length > this.config.maxVersions) {
      const toDelete = snapshots.slice(this.config.maxVersions);
      for (const snapshot of toDelete) {
        await this.deleteSnapshot(snapshot.id, gameId);
      }
    }
  }

  async deleteSnapshot(snapshotId: string, gameId: string) {
    const versionDir = join(this.config.backupPath, 'games', gameId, 'versions', snapshotId);
    await rm(versionDir, { recursive: true, force: true });
    await this.database.deleteSnapshot(snapshotId);
  }

  async restoreSnapshot(snapshotId: string, destinationPath: string): Promise<void> {
    const snapshot = await this.database.getSnapshot(snapshotId);
    if (!snapshot) throw new Error('Snapshot not found');

    await mkdir(destinationPath, { recursive: true });

    for (const file of snapshot.files) {
      const blobPath = this.getBlobPath(file.hash);
      const destPath = join(destinationPath, file.path);
      await mkdir(join(destPath, '..'), { recursive: true });

      if (this.config.verifyOnRestore) {
        const currentHash = await this.hashFile(blobPath);
        if (currentHash !== file.hash) {
          throw new Error(`Hash mismatch for ${file.path}: expected ${file.hash}, got ${currentHash}`);
        }
      }

      await writeFile(destPath, await readFile(blobPath));
    }
  }

  async getGameSnapshots(gameId: string): Promise<SaveSnapshot[]> {
    return this.database.getGameSnapshots(gameId) as Promise<SaveSnapshot[]>;
  }

  async getStorageStats(): Promise<{
    totalGames: number;
    totalSnapshots: number;
    totalSize: number;
    deduplicatedSize: number;
    uniqueBlobs: number;
  }> {
    const stats = await this.database.getStorageStats();
    return stats;
  }

  async shutdown() {
    // Clean up watchers
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
  }
}

// Database extensions for Hoard sync
// declare module '../database/Database' {
//   interface Database {
//     saveSnapshot(snapshot: SaveSnapshot): Promise<void>;
//     getSnapshot(id: string): Promise<SaveSnapshot | null>;
//     getGameSnapshots(gameId: string): Promise<SaveSnapshot[]>;
//     deleteSnapshot(id: string): Promise<void>;
//     getStorageStats(): Promise<{
//       totalGames: number;
//       totalSnapshots: number;
//       totalSize: number;
//       deduplicatedSize: number;
//       uniqueBlobs: number;
//     }>;
//   }
// }