/**
 * PlayTorrio API Client - Torrent streaming integration
 * Source: https://github.com/ayman708-UX/PlayTorrio
 * PlayTorrio is a torrent streaming platform
 */

const PLAYTORRIO_BASE = 'https://playtorrio.com' // Main site
const PLAYTORRIO_API = 'https://api.playtorrio.com' // API endpoint (may vary)

export interface PlayTorrioMedia {
  id: string
  title: string
  altTitles?: string[]
  coverImage?: string
  bannerImage?: string
  description?: string
  type: 'movie' | 'series' | 'anime'
  year?: number
  genres?: string[]
  imdbId?: string
  tmdbId?: number
  imdbRating?: number
  runtime?: number
  status?: string
}

export interface PlayTorrioSeason {
  season: number
  episodes: PlayTorrioEpisode[]
}

export interface PlayTorrioEpisode {
  episode: number
  title?: string
  overview?: string
  airDate?: string
  runtime?: number
  stillPath?: string
}

export interface PlayTorrioSource {
  id: string
  name: string
  quality: string
  type: 'hls' | 'mp4' | 'dash' | 'torrent'
  url: string
  size?: number
  seeds?: number
  peers?: number
  language?: string
  provider: string
  infoHash?: string
  fileIdx?: number
  trackerUrl?: string
}

async function playtorrioFetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${PLAYTORRIO_API}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'MFY/1.0',
    },
  })

  if (!res.ok) {
    throw new Error(`PlayTorrio API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export const playtorrioApi = {
  /**
   * Search media
   */
  search: async (query: string, type?: 'movie' | 'series' | 'anime', page = 1): Promise<{ results: PlayTorrioMedia[]; totalPages: number }> => {
    return playtorrioFetch<{ results: PlayTorrioMedia[]; totalPages: number }>('/search', { q: query, type, page })
  },

  /**
   * Get trending
   */
  getTrending: async (type?: 'movie' | 'series' | 'anime', timeWindow: 'day' | 'week' = 'week', page = 1): Promise<{ results: PlayTorrioMedia[]; totalPages: number }> => {
    try {
      return await playtorrioFetch<{ results: PlayTorrioMedia[]; totalPages: number }>('/trending', { type, time_window: timeWindow, page })
    } catch {
      const d = await fetch('./data/torrents.json').then((r) => r.json())
      const results = (d.torrents || []).filter((t: any) => !type || t.type === type || (type === 'series' && t.type === 'series'))
      return { results, totalPages: 1 }
    }
  },

  /**
   * Get popular
   */
  getPopular: async (type?: 'movie' | 'series' | 'anime', page = 1): Promise<{ results: PlayTorrioMedia[]; totalPages: number }> => {
    return playtorrioFetch<{ results: PlayTorrioMedia[]; totalPages: number }>('/popular', { type, page })
  },

  /**
   * Get media details
   */
  getDetails: async (id: string, type: 'movie' | 'series' | 'anime'): Promise<PlayTorrioMedia & { seasons?: PlayTorrioSeason[] } | null> => {
    try {
      return await playtorrioFetch<PlayTorrioMedia & { seasons?: PlayTorrioSeason[] }>(`/${type}/${id}`)
    } catch {
      return null
    }
  },

  /**
   * Get episode sources (streams/torrents)
   */
  getEpisodeSources: async (mediaId: string, type: 'movie' | 'series' | 'anime', season?: number, episode?: number): Promise<PlayTorrioSource[]> => {
    try {
      const endpoint = type === 'movie' 
        ? `/movie/${mediaId}/sources`
        : `/series/${mediaId}/sources`
      return await playtorrioFetch<PlayTorrioSource[]>(endpoint, { season, episode })
    } catch {
      return []
    }
  },

  /**
   * Get magnet link for torrent
   */
  getMagnetLink: async (sourceId: string): Promise<string | null> => {
    try {
      const result = await playtorrioFetch<{ magnet: string }>(`/source/${sourceId}/magnet`)
      return result.magnet
    } catch {
      return null
    }
  },

  /**
   * Get streaming URL (for direct play)
   */
  getStreamUrl: async (sourceId: string): Promise<string | null> => {
    try {
      const result = await playtorrioFetch<{ url: string }>(`/source/${sourceId}/stream`)
      return result.url
    } catch {
      return null
    }
  },

  /**
   * Get subtitles
   */
  getSubtitles: async (mediaId: string, type: 'movie' | 'series', season?: number, episode?: number, lang = 'en'): Promise<Array<{ lang: string; url: string; format: string }>> => {
    try {
      return await playtorrioFetch<Array<{ lang: string; url: string; format: string }>>(`/${type}/${mediaId}/subtitles`, { season, episode, lang })
    } catch {
      return []
    }
  },
}

export { playtorrioFetch }