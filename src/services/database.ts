import type { Track, Playlist, PlaylistTrack, HistoryEntry, HistoryEntryWithTrack, FavoriteTrack, FavoriteTrackWithTrack, Statistics, AppSettings } from '../types'

interface DatabaseResult<T> {
  success: boolean
  data?: T
  error?: string
  changes?: number
  lastInsertRowid?: number | bigint
}

class DatabaseService {
  private static instance: DatabaseService

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  private async dbRun(query: string, params: any[] = []): Promise<DatabaseResult<any>> {
    return window.electronAPI.db.run(query, params)
  }

  private async dbGet(query: string, params: any[] = []): Promise<DatabaseResult<any>> {
    return window.electronAPI.db.get(query, params)
  }

  private async dbAll(query: string, params: any[] = []): Promise<DatabaseResult<any[]>> {
    return window.electronAPI.db.all(query, params)
  }

  private async dbTransaction(queries: { query: string; params: any[] }[]): Promise<DatabaseResult<any>> {
    return window.electronAPI.db.transaction(queries)
  }

  // Tracks
  async insertTrack(track: Track): Promise<DatabaseResult<any>> {
    const query = `
      INSERT OR REPLACE INTO tracks 
      (id, title, artist, artist_id, album, album_id, album_art_url, duration, source_url, source_type, cached_path, play_count, last_played_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      track.id, track.title, track.artist, track.artistId || null,
      track.album || null, track.albumId || null, track.albumArtUrl || null,
      track.duration, track.sourceUrl || null, track.sourceType,
      track.cachedPath || null, track.playCount || 0, track.lastPlayedAt || null
    ]
    return this.dbRun(query, params)
  }

  async getTrack(id: string): Promise<Track | null> {
    const result = await this.dbGet('SELECT * FROM tracks WHERE id = ?', [id])
    return result.success ? result.data : null
  }

  async getTrackBySource(sourceUrl: string, sourceType: string): Promise<Track | null> {
    const result = await this.dbGet('SELECT * FROM tracks WHERE source_url = ? AND source_type = ?', [sourceUrl, sourceType])
    return result.success ? result.data : null
  }

  async getTracks(limit = 50, offset = 0): Promise<Track[]> {
    const result = await this.dbAll('SELECT * FROM tracks ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset])
    return result.success && result.data ? result.data : []
  }

  async searchTracks(query: string, limit = 20): Promise<Track[]> {
    const likeQuery = `%${query}%`
    const result = await this.dbAll(`
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
    `, [likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, limit])
    return result.success && result.data ? result.data : []
  }

  async updateTrackPlayCount(id: string): Promise<void> {
    await this.dbRun('UPDATE tracks SET play_count = play_count + 1, last_played_at = strftime("%s", "now") WHERE id = ?', [id])
  }

  async updateTrackCachedPath(id: string, cachedPath: string): Promise<void> {
    await this.dbRun('UPDATE tracks SET cached_path = ?, updated_at = strftime("%s", "now") WHERE id = ?', [cachedPath, id])
  }

  async deleteTrack(id: string): Promise<void> {
    await this.dbRun('DELETE FROM tracks WHERE id = ?', [id])
  }

  // Playlists
  async insertPlaylist(playlist: Omit<Playlist, 'trackCount' | 'totalDuration'> & { trackCount?: number; totalDuration?: number }): Promise<DatabaseResult<any>> {
    const query = `
      INSERT INTO playlists (id, name, description, artwork_url, track_count, total_duration, is_system)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      playlist.id, playlist.name, playlist.description || null,
      playlist.artworkUrl || null, playlist.trackCount || 0, playlist.totalDuration || 0, playlist.isSystem ? 1 : 0
    ]
    return this.dbRun(query, params)
  }

  async getPlaylist(id: string): Promise<Playlist | null> {
    const result = await this.dbGet('SELECT * FROM playlists WHERE id = ?', [id])
    return result.success ? result.data : null
  }

  async getPlaylists(): Promise<Playlist[]> {
    const result = await this.dbAll('SELECT * FROM playlists ORDER BY is_system DESC, updated_at DESC')
    return result.success && result.data ? result.data : []
  }

  async updatePlaylist(playlist: Playlist): Promise<void> {
    await this.dbRun(`
      UPDATE playlists SET name = ?, description = ?, artwork_url = ?, 
        track_count = ?, total_duration = ?, updated_at = strftime("%s", "now")
      WHERE id = ?
    `, [playlist.name, playlist.description || null, playlist.artworkUrl || null, playlist.trackCount, playlist.totalDuration, playlist.id])
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.dbRun('DELETE FROM playlists WHERE id = ?', [id])
  }

  // Playlist Tracks
  async insertPlaylistTrack(pt: PlaylistTrack): Promise<DatabaseResult<any>> {
    return this.dbRun(
      'INSERT INTO playlist_tracks (id, playlist_id, track_id, position) VALUES (?, ?, ?, ?)',
      [pt.id, pt.playlistId, pt.trackId, pt.position]
    )
  }

  async getPlaylistTracks(playlistId: string): Promise<(Track & { position: number; playlistAddedAt: number })[]> {
    const result = await this.dbAll(`
      SELECT t.*, pt.position, pt.added_at as playlistAddedAt
      FROM tracks t
      JOIN playlist_tracks pt ON t.id = pt.track_id
      WHERE pt.playlist_id = ?
      ORDER BY pt.position
    `, [playlistId])
    return result.success && result.data ? result.data : []
  }

  async getPlaylistTrackIds(playlistId: string): Promise<string[]> {
    const result = await this.dbAll('SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position', [playlistId])
    return result.success && result.data ? result.data.map(r => r.track_id) : []
  }

  async updatePlaylistTrackPosition(id: string, position: number): Promise<void> {
    await this.dbRun('UPDATE playlist_tracks SET position = ? WHERE id = ?', [position, id])
  }

  async deletePlaylistTrack(id: string): Promise<void> {
    await this.dbRun('DELETE FROM playlist_tracks WHERE id = ?', [id])
  }

  async deleteAllPlaylistTracks(playlistId: string): Promise<void> {
    await this.dbRun('DELETE FROM playlist_tracks WHERE playlist_id = ?', [playlistId])
  }

  async reorderPlaylistTrack(playlistId: string, trackId: string, position: number): Promise<void> {
    await this.dbRun('UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?', [position, playlistId, trackId])
  }

  // History
  async insertHistory(entry: Omit<HistoryEntry, 'track'>): Promise<DatabaseResult<any>> {
    return this.dbRun(
      'INSERT INTO history (id, track_id, played_at, play_duration, completed) VALUES (?, ?, ?, ?, ?)',
      [entry.id, entry.track_id, entry.played_at, entry.play_duration, entry.completed ? 1 : 0]
    )
  }

  async getHistory(limit = 50, offset = 0): Promise<HistoryEntryWithTrack[]> {
    const result = await this.dbAll(`
      SELECT h.*, t.title, t.artist, t.album, t.album_art_url, t.duration, t.source_type
      FROM history h
      JOIN tracks t ON h.track_id = t.id
      ORDER BY h.played_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset])
    return result.success && result.data ? result.data : []
  }

  async getRecentHistory(): Promise<HistoryEntryWithTrack[]> {
    const result = await this.dbAll(`
      SELECT h.*, t.title, t.artist, t.album, t.album_art_url, t.duration, t.source_type
      FROM history h
      JOIN tracks t ON h.track_id = t.id
      WHERE h.played_at > strftime("%s", "now", "-7 days")
      ORDER BY h.played_at DESC
      LIMIT 50
    `)
    return result.success && result.data ? result.data : []
  }

  async clearHistory(): Promise<void> {
    await this.dbRun('DELETE FROM history')
  }

  // Favorites
  async insertFavorite(id: string, trackId: string): Promise<void> {
    await this.dbRun('INSERT OR IGNORE INTO favorites (id, track_id) VALUES (?, ?)', [id, trackId])
  }

  async getFavorites(): Promise<FavoriteTrackWithTrack[]> {
    const result = await this.dbAll(`
      SELECT f.*, t.title, t.artist, t.album, t.album_art_url, t.duration, t.source_type, t.source_url
      FROM favorites f
      JOIN tracks t ON f.track_id = t.id
      ORDER BY f.added_at DESC
    `)
    return result.success && result.data ? result.data : []
  }

  async deleteFavorite(trackId: string): Promise<void> {
    await this.dbRun('DELETE FROM favorites WHERE track_id = ?', [trackId])
  }

  async isFavorite(trackId: string): Promise<boolean> {
    const result = await this.dbGet('SELECT 1 FROM favorites WHERE track_id = ?', [trackId])
    return result.success && !!result.data
  }

  // Settings
  async getSetting<T>(key: string): Promise<T | null> {
    const result = await this.dbGet('SELECT value FROM settings WHERE key = ?', [key])
    if (result.success && result.data) {
      try {
        return JSON.parse(result.data.value)
      } catch {
        return result.data.value as T
      }
    }
    return null
  }

  async setSetting(key: string, value: any): Promise<void> {
    await this.dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)])
  }

  async deleteSetting(key: string): Promise<void> {
    await this.dbRun('DELETE FROM settings WHERE key = ?', [key])
  }

  async getAllSettings(): Promise<AppSettings> {
    const result = await this.dbAll('SELECT key, value FROM settings')
    const settings: Record<string, any> = {}
    if (result.success && result.data) {
      for (const row of result.data) {
        try {
          settings[row.key] = JSON.parse(row.value)
        } catch {
          settings[row.key] = row.value
        }
      }
    }
    return settings as AppSettings
  }

  // Statistics
  async getTopTracks(days = 30, limit = 50): Promise<Array<{ track: Track; playCount: number; totalTime: number }>> {
    const result = await this.dbAll(`
      SELECT t.*, COUNT(h.id) as play_count, SUM(h.play_duration) as total_time
      FROM tracks t
      JOIN history h ON t.id = h.track_id
      WHERE h.played_at > strftime("%s", "now", ? || " days")
      GROUP BY t.id
      ORDER BY play_count DESC, total_time DESC
      LIMIT ?
    `, [days.toString(), limit])
    return result.success && result.data ? result.data : []
  }

  async getTopArtists(days = 30, limit = 50): Promise<Array<{ artist: string; playCount: number; totalTime: number }>> {
    const result = await this.dbAll(`
      SELECT t.artist, COUNT(h.id) as play_count, SUM(h.play_duration) as total_time
      FROM tracks t
      JOIN history h ON t.id = h.track_id
      WHERE h.played_at > strftime("%s", "now", ? || " days")
      GROUP BY t.artist
      ORDER BY play_count DESC, total_time DESC
      LIMIT ?
    `, [days.toString(), limit])
    return result.success && result.data ? result.data : []
  }

  async getTopAlbums(days = 30, limit = 50): Promise<Array<{ album: string; playCount: number; totalTime: number }>> {
    const result = await this.dbAll(`
      SELECT t.album, COUNT(h.id) as play_count, SUM(h.play_duration) as total_time
      FROM tracks t
      JOIN history h ON t.id = h.track_id
      WHERE h.played_at > strftime("%s", "now", ? || " days") AND t.album IS NOT NULL AND t.album != ''
      GROUP BY t.album
      ORDER BY play_count DESC, total_time DESC
      LIMIT ?
    `, [days.toString(), limit])
    return result.success && result.data ? result.data : []
  }

  async getListeningByHour(days = 30): Promise<number[]> {
    const result = await this.dbAll(`
      SELECT CAST(strftime("%H", played_at, "unixepoch") AS INTEGER) as hour, COUNT(*) as count, SUM(play_duration) as total_time
      FROM history
      WHERE played_at > strftime("%s", "now", ? || " days")
      GROUP BY hour
      ORDER BY hour
    `, [days.toString()])
    const hours = new Array(24).fill(0)
    if (result.success && result.data) {
      for (const row of result.data) {
        hours[row.hour] = row.total_time || 0
      }
    }
    return hours
  }

  async getListeningByDay(days = 30): Promise<number[]> {
    const result = await this.dbAll(`
      SELECT CAST(strftime("%w", played_at, "unixepoch") AS INTEGER) as day, COUNT(*) as count, SUM(play_duration) as total_time
      FROM history
      WHERE played_at > strftime("%s", "now", ? || " days")
      GROUP BY day
      ORDER BY day
    `, [days.toString()])
    const dayValues = new Array(7).fill(0)
    if (result.success && result.data) {
      for (const row of result.data) {
        dayValues[row.day] = row.total_time || 0
      }
    }
    return dayValues
  }

  async getTotalStats(days = 30): Promise<{ totalPlays: number; uniqueTracks: number; uniqueArtists: number; totalTime: number }> {
    const result = await this.dbGet(`
      SELECT 
        COUNT(DISTINCT h.id) as totalPlays,
        COUNT(DISTINCT h.track_id) as uniqueTracks,
        COUNT(DISTINCT t.artist) as uniqueArtists,
        SUM(h.play_duration) as totalTime
      FROM history h
      JOIN tracks t ON h.track_id = t.id
      WHERE h.played_at > strftime("%s", "now", ? || " days")
    `, [days.toString()])
    return result.success ? result.data : { totalPlays: 0, uniqueTracks: 0, uniqueArtists: 0, totalTime: 0 }
  }

  async getCacheStats(): Promise<{ count: number; totalSize: number } | null> {
    return window.electronAPI.getCacheStats()
  }

  async cleanExpiredCache(): Promise<void> {
    await this.dbRun('DELETE FROM cached_streams WHERE expires_at < strftime("%s", "now")')
  }

  async getStatistics(days = 30): Promise<Statistics> {
    const [topTracks, topArtists, topAlbums, listeningByHour, listeningByDay, totalStats, recentHistory] = await Promise.all([
      this.getTopTracks(days, 20),
      this.getTopArtists(days, 20),
      this.getTopAlbums(days, 20),
      this.getListeningByHour(days),
      this.getListeningByDay(days),
      this.getTotalStats(days),
      this.getRecentHistory(),
    ])

    return {
      totalListeningTime: totalStats.totalTime,
      totalTracksPlayed: totalStats.totalPlays,
      uniqueTracksPlayed: totalStats.uniqueTracks,
      uniqueArtistsPlayed: totalStats.uniqueArtists,
      topTracks: topTracks.map(t => ({ track: t.track, playCount: t.playCount, totalTime: t.totalTime })),
      topArtists: topArtists.map(a => ({ artist: a.artist, playCount: a.playCount, totalTime: a.totalTime })),
      topAlbums: topAlbums.map(a => ({ album: a.album, playCount: a.playCount, totalTime: a.totalTime })),
      listeningByHour,
      listeningByDay,
      recentlyPlayed: recentHistory.slice(0, 10).map(h => ({
        id: h.track_id,
        title: h.title,
        artist: h.artist,
        album: h.album || undefined,
        albumArtUrl: h.album_art_url,
        duration: h.duration,
        sourceType: h.source_type as 'piped' | 'youtube-music' | 'local' | 'cached',
      })),
    }
  }
}

export const databaseService = DatabaseService.getInstance()