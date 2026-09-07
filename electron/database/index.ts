import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

const userDataPath = app.getPath('userData')
const dbPath = path.join(userDataPath, 'mfy-music.db')
const cacheDir = path.join(userDataPath, 'audio-cache')

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

db.exec(`
  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    artist_id TEXT,
    album TEXT,
    album_id TEXT,
    album_art_url TEXT,
    duration INTEGER NOT NULL,
    source_url TEXT,
    source_type TEXT NOT NULL,
    cached_path TEXT,
    play_count INTEGER DEFAULT 0,
    last_played_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    artwork_url TEXT,
    track_count INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0,
    is_system INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS playlist_tracks (
    id TEXT PRIMARY KEY,
    playlist_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    added_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL,
    played_at INTEGER DEFAULT (strftime('%s', 'now')),
    play_duration INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL UNIQUE,
    added_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cached_streams (
    id TEXT PRIMARY KEY,
    source_url TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL,
    local_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    expires_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_accessed_at INTEGER DEFAULT (strftime('%s', 'now')),
    access_count INTEGER DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
  CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album);
  CREATE INDEX IF NOT EXISTS idx_tracks_source ON tracks(source_url);
  CREATE INDEX IF NOT EXISTS idx_history_track ON history(track_id);
  CREATE INDEX IF NOT EXISTS idx_history_played_at ON history(played_at DESC);
  CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
  CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
  CREATE INDEX IF NOT EXISTS idx_favorites_track ON favorites(track_id);
  CREATE INDEX IF NOT EXISTS idx_cached_streams_source ON cached_streams(source_url);
  CREATE INDEX IF NOT EXISTS idx_cached_streams_expires ON cached_streams(expires_at);
`)

const INSERT_TRACK = db.prepare(`
  INSERT OR REPLACE INTO tracks 
  (id, title, artist, artist_id, album, album_id, album_art_url, duration, source_url, source_type, cached_path, updated_at)
  VALUES (@id, @title, @artist, @artist_id, @album, @album_id, @album_art_url, @duration, @source_url, @source_type, @cached_path, strftime('%s', 'now'))
`)

const GET_TRACK = db.prepare('SELECT * FROM tracks WHERE id = ?')
const GET_TRACK_BY_SOURCE = db.prepare('SELECT * FROM tracks WHERE source_url = ? AND source_type = ?')
const GET_TRACKS = db.prepare('SELECT * FROM tracks ORDER BY created_at DESC LIMIT ? OFFSET ?')
const SEARCH_TRACKS = db.prepare(`
  SELECT * FROM tracks 
  WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
  ORDER BY 
    CASE 
      WHEN title LIKE ? THEN 0
      WHEN artist LIKE ? THEN 1
      WHEN album LIKE ? THEN 2
      ELSE 3
    END,
    play_count DESC
  LIMIT ?
`)
const UPDATE_TRACK_PLAY_COUNT = db.prepare(`
  UPDATE tracks SET play_count = play_count + 1, last_played_at = strftime('%s', 'now') WHERE id = ?
`)
const UPDATE_TRACK_CACHED_PATH = db.prepare("UPDATE tracks SET cached_path = ?, updated_at = strftime('%s', 'now') WHERE id = ?")
const DELETE_TRACK = db.prepare('DELETE FROM tracks WHERE id = ?')

const INSERT_PLAYLIST = db.prepare(`
  INSERT INTO playlists (id, name, description, artwork_url, is_system)
  VALUES (@id, @name, @description, @artwork_url, @is_system)
`)
const GET_PLAYLIST = db.prepare('SELECT * FROM playlists WHERE id = ?')
const GET_PLAYLISTS = db.prepare('SELECT * FROM playlists ORDER BY is_system DESC, updated_at DESC')
const UPDATE_PLAYLIST = db.prepare(`
  UPDATE playlists SET name = @name, description = @description, artwork_url = @artwork_url, 
    track_count = @track_count, total_duration = @total_duration, updated_at = strftime('%s', 'now')
  WHERE id = @id
`)
const DELETE_PLAYLIST = db.prepare('DELETE FROM playlists WHERE id = ?')

const INSERT_PLAYLIST_TRACK = db.prepare(`
  INSERT INTO playlist_tracks (id, playlist_id, track_id, position)
  VALUES (@id, @playlist_id, @track_id, @position)
`)
const GET_PLAYLIST_TRACKS = db.prepare(`
  SELECT t.*, pt.position, pt.added_at as playlist_added_at
  FROM tracks t
  JOIN playlist_tracks pt ON t.id = pt.track_id
  WHERE pt.playlist_id = ?
  ORDER BY pt.position
`)
const GET_PLAYLIST_TRACK_IDS = db.prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position')
const UPDATE_PLAYLIST_TRACK_POSITION = db.prepare('UPDATE playlist_tracks SET position = ? WHERE id = ?')
const DELETE_PLAYLIST_TRACK = db.prepare('DELETE FROM playlist_tracks WHERE id = ?')
const DELETE_PLAYLIST_TRACKS = db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?')
const REORDER_PLAYLIST_TRACKS = db.prepare('UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?')

const INSERT_HISTORY = db.prepare(`
  INSERT INTO history (id, track_id, played_at, play_duration, completed)
  VALUES (@id, @track_id, @played_at, @play_duration, @completed)
`)
const GET_HISTORY = db.prepare(`
  SELECT h.*, t.title, t.artist, t.album, t.album_art_url, t.duration, t.source_type
  FROM history h
  JOIN tracks t ON h.track_id = t.id
  ORDER BY h.played_at DESC
  LIMIT ? OFFSET ?
`)
const GET_RECENT_HISTORY = db.prepare(`
  SELECT h.*, t.title, t.artist, t.album, t.album_art_url, t.duration, t.source_type
  FROM history h
  JOIN tracks t ON h.track_id = t.id
  WHERE h.played_at > strftime('%s', 'now', '-7 days')
  ORDER BY h.played_at DESC
  LIMIT 50
`)
const CLEAR_HISTORY = db.prepare('DELETE FROM history')

const INSERT_FAVORITE = db.prepare('INSERT OR IGNORE INTO favorites (id, track_id) VALUES (@id, @track_id)')
const GET_FAVORITES = db.prepare(`
  SELECT f.*, t.title, t.artist, t.album, t.album_art_url, t.duration, t.source_type, t.source_url
  FROM favorites f
  JOIN tracks t ON f.track_id = t.id
  ORDER BY f.added_at DESC
`)
const DELETE_FAVORITE = db.prepare('DELETE FROM favorites WHERE track_id = ?')
const IS_FAVORITE = db.prepare('SELECT 1 FROM favorites WHERE track_id = ?')

const GET_SETTING = db.prepare('SELECT value FROM settings WHERE key = ?')
const SET_SETTING = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
const DELETE_SETTING = db.prepare('DELETE FROM settings WHERE key = ?')
const GET_ALL_SETTINGS = db.prepare('SELECT key, value FROM settings')

const INSERT_CACHED_STREAM = db.prepare(`
  INSERT OR REPLACE INTO cached_streams 
  (id, source_url, source_type, local_path, file_size, mime_type, expires_at, last_accessed_at, access_count)
  VALUES (@id, @source_url, @source_type, @local_path, @file_size, @mime_type, @expires_at, strftime('%s', 'now'), 
    COALESCE((SELECT access_count FROM cached_streams WHERE source_url = @source_url), 0) + 1)
`)
const GET_CACHED_STREAM = db.prepare("SELECT * FROM cached_streams WHERE source_url = ? AND source_type = ? AND expires_at > strftime('%s', 'now')")
const UPDATE_CACHED_STREAM_ACCESS = db.prepare("UPDATE cached_streams SET last_accessed_at = strftime('%s', 'now'), access_count = access_count + 1 WHERE id = ?")
const CLEAN_EXPIRED_CACHE = db.prepare("DELETE FROM cached_streams WHERE expires_at < strftime('%s', 'now')")
const GET_CACHE_STATS = db.prepare('SELECT COUNT(*) as count, SUM(file_size) as total_size FROM cached_streams')

const GET_TOP_TRACKS = db.prepare(`
  SELECT t.*, COUNT(h.id) as play_count, SUM(h.play_duration) as total_time
  FROM tracks t
  JOIN history h ON t.id = h.track_id
  WHERE h.played_at > strftime('%s', 'now', '? days')
  GROUP BY t.id
  ORDER BY play_count DESC, total_time DESC
  LIMIT ?
`)
const GET_TOP_ARTISTS = db.prepare(`
  SELECT t.artist, COUNT(h.id) as play_count, SUM(h.play_duration) as total_time
  FROM tracks t
  JOIN history h ON t.id = h.track_id
  WHERE h.played_at > strftime('%s', 'now', '? days')
  GROUP BY t.artist
  ORDER BY play_count DESC, total_time DESC
  LIMIT ?
`)
const GET_TOP_ALBUMS = db.prepare(`
  SELECT t.album, COUNT(h.id) as play_count, SUM(h.play_duration) as total_time
  FROM tracks t
  JOIN history h ON t.id = h.track_id
  WHERE h.played_at > strftime('%s', 'now', '? days') AND t.album IS NOT NULL AND t.album != ''
  GROUP BY t.album
  ORDER BY play_count DESC, total_time DESC
  LIMIT ?
`)
const GET_LISTENING_BY_HOUR = db.prepare(`
  SELECT CAST(strftime('%H', played_at, 'unixepoch') AS INTEGER) as hour, COUNT(*) as count, SUM(play_duration) as total_time
  FROM history
  WHERE played_at > strftime('%s', 'now', '? days')
  GROUP BY hour
  ORDER BY hour
`)
const GET_LISTENING_BY_DAY = db.prepare(`
  SELECT CAST(strftime('%w', played_at, 'unixepoch') AS INTEGER) as day, COUNT(*) as count, SUM(play_duration) as total_time
  FROM history
  WHERE played_at > strftime('%s', 'now', '? days')
  GROUP BY day
  ORDER BY day
`)
const GET_TOTAL_STATS = db.prepare(`
  SELECT 
    COUNT(DISTINCT h.id) as total_plays,
    COUNT(DISTINCT h.track_id) as unique_tracks,
    COUNT(DISTINCT t.artist) as unique_artists,
    SUM(h.play_duration) as total_time
  FROM history h
  JOIN tracks t ON h.track_id = t.id
  WHERE h.played_at > strftime('%s', 'now', '? days')
`)

export const database = {
  // Tracks
  insertTrack: (track: any) => INSERT_TRACK.run(track),
  getTrack: (id: string) => GET_TRACK.get(id),
  getTrackBySource: (sourceUrl: string, sourceType: string) => GET_TRACK_BY_SOURCE.get(sourceUrl, sourceType),
  getTracks: (limit: number, offset: number) => GET_TRACKS.all(limit, offset),
  searchTracks: (query: string, limit: number) => {
    const likeQuery = `%${query}%`
    return SEARCH_TRACKS.all(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, limit)
  },
  updateTrackPlayCount: (id: string) => UPDATE_TRACK_PLAY_COUNT.run(id),
  updateTrackCachedPath: (id: string, cachedPath: string) => UPDATE_TRACK_CACHED_PATH.run(cachedPath, id),
  deleteTrack: (id: string) => DELETE_TRACK.run(id),

  // Playlists
  insertPlaylist: (playlist: any) => INSERT_PLAYLIST.run(playlist),
  getPlaylist: (id: string) => GET_PLAYLIST.get(id),
  getPlaylists: () => GET_PLAYLISTS.all(),
  updatePlaylist: (playlist: any) => UPDATE_PLAYLIST.run(playlist),
  deletePlaylist: (id: string) => DELETE_PLAYLIST.run(id),

  // Playlist Tracks
  insertPlaylistTrack: (pt: any) => INSERT_PLAYLIST_TRACK.run(pt),
  getPlaylistTracks: (playlistId: string) => GET_PLAYLIST_TRACKS.all(playlistId),
  getPlaylistTrackIds: (playlistId: string) => GET_PLAYLIST_TRACK_IDS.all(playlistId).map(r => r.track_id),
  updatePlaylistTrackPosition: (id: string, position: number) => UPDATE_PLAYLIST_TRACK_POSITION.run(position, id),
  deletePlaylistTrack: (id: string) => DELETE_PLAYLIST_TRACK.run(id),
  deletePlaylistTracks: (playlistId: string) => DELETE_PLAYLIST_TRACKS.run(playlistId),
  reorderPlaylistTracks: (playlistId: string, trackId: string, position: number) => REORDER_PLAYLIST_TRACKS.run(position, playlistId, trackId),

  // History
  insertHistory: (entry: any) => INSERT_HISTORY.run(entry),
  getHistory: (limit: number, offset: number) => GET_HISTORY.all(limit, offset),
  getRecentHistory: () => GET_RECENT_HISTORY.all(),
  clearHistory: () => CLEAR_HISTORY.run(),

  // Favorites
  insertFavorite: (id: string, trackId: string) => INSERT_FAVORITE.run({ id, track_id: trackId }),
  getFavorites: () => GET_FAVORITES.all(),
  deleteFavorite: (trackId: string) => DELETE_FAVORITE.run(trackId),
  isFavorite: (trackId: string) => !!IS_FAVORITE.get(trackId),

  // Settings
  getSetting: (key: string) => {
    const row = GET_SETTING.get(key)
    return row ? JSON.parse(row.value) : null
  },
  setSetting: (key: string, value: any) => SET_SETTING.run(key, JSON.stringify(value)),
  deleteSetting: (key: string) => DELETE_SETTING.run(key),
  getAllSettings: () => {
    const rows = GET_ALL_SETTINGS.all()
    const settings: Record<string, any> = {}
    for (const row of rows) {
      settings[row.key] = JSON.parse(row.value)
    }
    return settings
  },

  // Cached Streams
  insertCachedStream: (stream: any) => INSERT_CACHED_STREAM.run(stream),
  getCachedStream: (sourceUrl: string, sourceType: string) => GET_CACHED_STREAM.get(sourceUrl, sourceType),
  updateCachedStreamAccess: (id: string) => UPDATE_CACHED_STREAM_ACCESS.run(id),
  cleanExpiredCache: () => CLEAN_EXPIRED_CACHE.run(),
  getCacheStats: () => GET_CACHE_STATS.get(),

  // Statistics
  getTopTracks: (days: number, limit: number) => GET_TOP_TRACKS.all(days, limit),
  getTopArtists: (days: number, limit: number) => GET_TOP_ARTISTS.all(days, limit),
  getTopAlbums: (days: number, limit: number) => GET_TOP_ALBUMS.all(days, limit),
  getListeningByHour: (days: number) => GET_LISTENING_BY_HOUR.all(days),
  getListeningByDay: (days: number) => GET_LISTENING_BY_DAY.all(days),
  getTotalStats: (days: number) => GET_TOTAL_STATS.get(days),

  // Utility
  close: () => db.close(),
  backup: (destPath: string) => db.backup(destPath),
}

export default database