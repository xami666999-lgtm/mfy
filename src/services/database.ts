import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import type { ContinueWatching, WatchlistItem, LibraryItem, Settings, Addon } from '../types';

class DatabaseService {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'mfy.db');
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS continue_watching (
        id TEXT PRIMARY KEY,
        media_id TEXT NOT NULL,
        media_type TEXT NOT NULL,
        title TEXT NOT NULL,
        poster TEXT NOT NULL,
        backdrop TEXT NOT NULL,
        progress REAL NOT NULL,
        duration REAL NOT NULL,
        current_time REAL NOT NULL,
        season_number INTEGER,
        episode_number INTEGER,
        episode_title TEXT,
        last_watched INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS watchlist (
        id TEXT PRIMARY KEY,
        media_id TEXT NOT NULL UNIQUE,
        media_type TEXT NOT NULL,
        title TEXT NOT NULL,
        poster TEXT NOT NULL,
        added_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS library (
        id TEXT PRIMARY KEY,
        media_id TEXT NOT NULL UNIQUE,
        media_type TEXT NOT NULL,
        title TEXT NOT NULL,
        poster TEXT NOT NULL,
        backdrop TEXT NOT NULL,
        status TEXT NOT NULL,
        progress REAL NOT NULL,
        current_season INTEGER,
        current_episode INTEGER,
        rating REAL,
        notes TEXT,
        added_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS addons (
        id TEXT PRIMARY KEY,
        manifest TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        installed_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_continue_watching_media ON continue_watching(media_id);
      CREATE INDEX IF NOT EXISTS idx_library_status ON library(status);
      CREATE INDEX IF NOT EXISTS idx_watchlist_media ON watchlist(media_id);
    `);
  }

  getContinueWatching(): ContinueWatching[] {
    const rows = this.db.prepare('SELECT * FROM continue_watching ORDER BY last_watched DESC').all() as any[];
    return rows.map(this.mapContinueWatching);
  }

  upsertContinueWatching(item: ContinueWatching): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO continue_watching 
      (id, media_id, media_type, title, poster, backdrop, progress, duration, current_time, season_number, episode_number, episode_title, last_watched)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id, item.mediaId, item.mediaType, item.title, item.poster, item.backdrop,
      item.progress, item.duration, item.currentTime, item.seasonNumber, item.episodeNumber, item.episodeTitle, item.lastWatched
    );
  }

  removeContinueWatching(id: string): void {
    this.db.prepare('DELETE FROM continue_watching WHERE id = ?').run(id);
  }

  clearContinueWatching(): void {
    this.db.prepare('DELETE FROM continue_watching').run();
  }

  getWatchlist(): WatchlistItem[] {
    const rows = this.db.prepare('SELECT * FROM watchlist ORDER BY added_at DESC').all() as any[];
    return rows.map(this.mapWatchlist);
  }

  addToWatchlist(item: WatchlistItem): void {
    this.db.prepare(`
      INSERT OR IGNORE INTO watchlist (id, media_id, media_type, title, poster, added_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(item.id, item.mediaId, item.mediaType, item.title, item.poster, item.addedAt);
  }

  removeFromWatchlist(mediaId: string): void {
    this.db.prepare('DELETE FROM watchlist WHERE media_id = ?').run(mediaId);
  }

  getLibrary(): LibraryItem[] {
    const rows = this.db.prepare('SELECT * FROM library ORDER BY updated_at DESC').all() as any[];
    return rows.map(this.mapLibrary);
  }

  upsertLibraryItem(item: LibraryItem): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO library 
      (id, media_id, media_type, title, poster, backdrop, status, progress, current_season, current_episode, rating, notes, added_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id, item.mediaId, item.mediaType, item.title, item.poster, item.backdrop,
      item.status, item.progress, item.currentSeason, item.currentEpisode, item.rating, item.notes,
      item.addedAt, item.updatedAt
    );
  }

  removeFromLibrary(mediaId: string): void {
    this.db.prepare('DELETE FROM library WHERE media_id = ?').run(mediaId);
  }

  getSettings(): Settings {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('settings') as { value: string } | undefined;
    if (row) return JSON.parse(row.value);
    return this.getDefaultSettings();
  }

  saveSettings(settings: Settings): void {
    this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('settings', JSON.stringify(settings));
  }

  getAddons(): Addon[] {
    const rows = this.db.prepare('SELECT * FROM addons WHERE enabled = 1').all() as any[];
    return rows.map((r) => JSON.parse(r.manifest));
  }

  getAllAddons(): { id: string; manifest: Addon; enabled: boolean; installedAt: number }[] {
    const rows = this.db.prepare('SELECT * FROM addons').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      manifest: JSON.parse(r.manifest),
      enabled: Boolean(r.enabled),
      installedAt: r.installed_at,
    }));
  }

  installAddon(addon: Addon): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO addons (id, manifest, enabled, installed_at)
      VALUES (?, ?, 1, ?)
    `).run(addon.id, JSON.stringify(addon), Date.now());
  }

  uninstallAddon(id: string): void {
    this.db.prepare('DELETE FROM addons WHERE id = ?').run(id);
  }

  setAddonEnabled(id: string, enabled: boolean): void {
    this.db.prepare('UPDATE addons SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
  }

  private getDefaultSettings(): Settings {
    return {
      general: { language: 'en', region: 'US', contentLanguage: ['en'], adultContent: false, autoPlayNext: true, autoPlayTrailers: false, skipIntro: false, skipCredits: false },
      playback: { quality: 'auto', bufferSize: 10, hardwareAcceleration: true, preferredAudioLanguage: 'en', preferredSubtitleLanguage: 'en', subtitleFontSize: 16, subtitleColor: '#ffffff', subtitleBackground: 'rgba(0,0,0,0.7)', subtitleOutline: true },
      appearance: { theme: 'system', accentColor: '#e50914', compactMode: false, showBackdrops: true, reduceMotion: false, fontScale: 1 },
      addons: { installedAddons: [], communityAddons: [], officialAddons: [], autoUpdateAddons: true, addonTimeout: 10000 },
      library: { syncWithTrakt: false, autoAddToLibrary: true, showInLibrary: ['watching', 'completed', 'plan_to_watch'] },
      downloads: { downloadPath: '', maxConcurrentDownloads: 3, quality: 'best', wifiOnly: false, deleteAfterWatch: false },
      network: { dnsOverHttps: false },
      privacy: { analytics: false, crashReporting: false, shareUsageData: false, clearHistoryOnExit: false },
    };
  }

  private mapContinueWatching(row: any): ContinueWatching {
    return {
      id: row.id,
      mediaId: row.media_id,
      mediaType: row.media_type,
      title: row.title,
      poster: row.poster,
      backdrop: row.backdrop,
      progress: row.progress,
      duration: row.duration,
      currentTime: row.current_time,
      seasonNumber: row.season_number,
      episodeNumber: row.episode_number,
      episodeTitle: row.episode_title,
      lastWatched: row.last_watched,
    };
  }

  private mapWatchlist(row: any): WatchlistItem {
    return {
      id: row.id,
      mediaId: row.media_id,
      mediaType: row.media_type,
      title: row.title,
      poster: row.poster,
      addedAt: row.added_at,
    };
  }

  private mapLibrary(row: any): LibraryItem {
    return {
      id: row.id,
      mediaId: row.media_id,
      mediaType: row.media_type,
      title: row.title,
      poster: row.poster,
      backdrop: row.backdrop,
      status: row.status,
      progress: row.progress,
      currentSeason: row.current_season,
      currentEpisode: row.current_episode,
      rating: row.rating,
      notes: row.notes,
      addedAt: row.added_at,
      updatedAt: row.updated_at,
    };
  }

  close(): void {
    this.db.close();
  }
}

export const databaseService = new DatabaseService();