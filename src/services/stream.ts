import type { Track, SearchResult, LyricsData } from '../types'

export interface ResolvedStream {
  streamUrl: string
  mimeType: string
  quality: string
  bitrate: number
  sourceType: 'piped' | 'youtube-music'
  cachedPath?: string
  contentLength?: number
}

interface StreamResult {
  success: boolean
  data?: ResolvedStream
  error?: string
}

interface SearchResultAPI {
  success: boolean
  data?: {
    tracks: any[]
    artists: any[]
    albums: any[]
  }
  error?: string
}

class StreamService {
  private static instance: StreamService
  private searchCache = new Map<string, SearchResult>()
  private trendingCache: { tracks: Track[]; timestamp: number } | null = null

  static getInstance(): StreamService {
    if (!StreamService.instance) {
      StreamService.instance = new StreamService()
    }
    return StreamService.instance
  }

  async resolveStream(trackId: string, sourceUrl: string, sourceType: 'piped' | 'youtube-music'): Promise<StreamResult> {
    const result = await window.electronAPI.stream.resolve(trackId, sourceUrl, sourceType)
    return result
  }

  async search(query: string, type: 'tracks' | 'artists' | 'albums' = 'tracks', limit = 20): Promise<SearchResult> {
    const cacheKey = `${query}:${type}:${limit}`
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!
    }

    const result = await window.electronAPI.stream.search(query, type, limit)
    if (result.success && result.data) {
      this.searchCache.set(cacheKey, result.data)
      if (this.searchCache.size > 100) {
        const firstKey = this.searchCache.keys().next().value
        if (firstKey) this.searchCache.delete(firstKey)
      }
      return result.data
    }
    console.error('Search failed:', result.error)
    return { tracks: [], artists: [], albums: [] }
  }

  async getTrending(limit = 50): Promise<Track[]> {
    const now = Date.now()
    if (this.trendingCache && now - this.trendingCache.timestamp < 300000) {
      return this.trendingCache.tracks
    }

    const result = await window.electronAPI.stream.trending(limit)
    if (result.success && result.data?.tracks) {
      this.trendingCache = { tracks: result.data.tracks, timestamp: now }
      return result.data.tracks
    }
    console.error('Trending fetch failed:', result.error)
    return []
  }

  async getTrackInfo(videoId: string, sourceType: 'piped' | 'youtube-music') {
    const result = await window.electronAPI.stream.trackInfo(videoId, sourceType)
    return result.success ? result.data : null
  }

  async getLyrics(videoId: string, sourceType: 'piped' | 'youtube-music'): Promise<LyricsData | null> {
    const result = await window.electronAPI.stream.lyrics(videoId, sourceType)
    if (result.success && result.data) {
      return this.parseLyrics(result.data)
    }
    return null
  }

  private parseLyrics(data: any): LyricsData {
    if (data.synced && data.lines) {
      return {
        synced: true,
        lines: data.lines.map((line: any) => ({
          time: typeof line.time === 'string' ? this.parseTime(line.time) : line.time,
          text: line.text,
        })),
        provider: data.provider || 'unknown',
      }
    }
    return { synced: false, lines: [], provider: 'unknown' }
  }

  private parseTime(timeStr: string): number {
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseFloat(parts[1])
    }
    if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])
    }
    return 0
  }

  async setPipedInstances(instances: string[]) {
    return window.electronAPI.stream.setPipedInstances(instances)
  }

  async setYtmInstances(instances: string[]) {
    return window.electronAPI.stream.setYtmInstances(instances)
  }

  clearCache() {
    this.searchCache.clear()
    this.trendingCache = null
  }
}

export const streamService = StreamService.getInstance()