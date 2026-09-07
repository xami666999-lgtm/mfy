export interface Track {
  id: string
  title: string
  artist: string
  artistId?: string
  album?: string | null
  albumId?: string
  albumArtUrl?: string | null
  duration: number
  sourceUrl?: string
  sourceType: 'piped' | 'youtube-music' | 'local' | 'cached'
  cachedPath?: string
  isPlaying?: boolean
  isFavorite?: boolean
  addedAt?: number
  playCount?: number
  lastPlayedAt?: number
}

export interface Playlist {
  id: string
  name: string
  description?: string
  artworkUrl?: string
  trackCount: number
  totalDuration: number
  createdAt: number
  updatedAt: number
  isSystem?: boolean
}

export interface PlaylistTrack {
  id: string
  playlistId: string
  trackId: string
  position: number
  addedAt: number
}

export interface HistoryEntry {
  id: string
  track_id: string
  track?: Track
  played_at: number
  play_duration: number
  completed: boolean
}

export interface HistoryEntryWithTrack extends HistoryEntry {
  title: string
  artist: string
  album: string | null
  album_art_url: string | null
  duration: number
  source_type: string
}

export interface FavoriteTrack {
  id: string
  track_id: string
  track?: Track
  added_at: number
}

export interface FavoriteTrackWithTrack extends FavoriteTrack {
  title: string
  artist: string
  album: string | null
  album_art_url: string | null
  duration: number
  source_type: string
  source_url: string | null
}

export interface SearchResult {
  tracks: Track[]
  artists: Artist[]
  albums: Album[]
}

export interface Artist {
  id: string
  name: string
  imageUrl?: string
  trackCount?: number
  albumCount?: number
}

export interface Album {
  id: string
  title: string
  artist: string
  artistId?: string
  artworkUrl?: string
  releaseDate?: string
  trackCount?: number
  totalDuration?: number
}

export interface ChartEntry {
  position: number
  track: Track
  previousPosition?: number
  movement?: 'up' | 'down' | 'new' | 'same'
}

export interface TrendingTrack {
  track: Track
  score: number
  source: string
}

export interface AudioFeatures {
  duration: number
  sampleRate: number
  channels: number
  bitrate?: number
}

export interface PlaybackState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  repeatMode: 'off' | 'one' | 'all'
  shuffle: boolean
  crossfadeEnabled: boolean
  crossfadeDuration: number
}

export interface EqualizerBand {
  frequency: number
  gain: number
}

export interface EqualizerPreset {
  name: string
  bands: EqualizerBand[]
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  crossfadeEnabled: boolean
  crossfadeDuration: number
  volume: number
  miniPlayerEnabled: boolean
  notificationsEnabled: boolean
  notificationArtwork: boolean
  mediaKeysEnabled: boolean
  cacheEnabled: boolean
  cacheMaxSize: number
  audioQuality: 'low' | 'medium' | 'high' | 'lossless'
  pipedInstance: string
  ytmInstance: string
  lyricsEnabled: boolean
  lyricsSource: 'auto' | 'genius' | 'lrclib' | 'musixmatch'
  downloadQuality: 'low' | 'medium' | 'high'
  downloadPath: string
  startMinimized: boolean
  closeToTray: boolean
  shuffle: boolean
  repeatMode: 'off' | 'one' | 'all'
}

export interface Statistics {
  totalListeningTime: number
  totalTracksPlayed: number
  uniqueTracksPlayed: number
  uniqueArtistsPlayed: number
  topTracks: Array<{ track: Track; playCount: number; totalTime: number }>
  topArtists: Array<{ artist: string; playCount: number; totalTime: number }>
  topAlbums: Array<{ album: string; playCount: number; totalTime: number }>
  listeningByHour: number[]
  listeningByDay: number[]
  recentlyPlayed: Track[]
}

export interface PipedStreamResponse {
  url: string
  mimeType: string
  quality: string
  bitrate: number
  contentLength: string
}

export interface YouTubeMusicStreamResponse {
  url: string
  mimeType: string
  quality: string
  bitrate: number
}

export interface LyricsLine {
  time: number
  text: string
}

export interface LyricsData {
  synced: boolean
  lines: LyricsLine[]
  provider: string
}

export type Page = 'home' | 'search' | 'library' | 'playlists' | 'liked' | 'history' | 'stats' | 'settings' | 'mini-player' | 'search-results'

export type RepeatMode = 'off' | 'one' | 'all'

export type SourceType = 'piped' | 'youtube-music' | 'local' | 'cached'

export type Theme = 'dark' | 'light' | 'system'