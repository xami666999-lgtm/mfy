/**
 * SimplStream API - Movie/TV show streaming
 * Source: https://github.com/JustANormalChurro/SimplStream
 */

const SIMPLSTREAM_API_BASE = 'https://api.simplstream.com'

export interface SimplStreamMedia {
  id: string
  title: string
  altTitles?: string[]
  coverImage?: string
  bannerImage?: string
  description?: string
  type: 'movie' | 'series'
  year?: number
  genres?: string[]
  imdbId?: string
  tmdbId?: number
  imdbRating?: number
  runtime?: number
  status?: string
}

export interface SimplStreamSeason {
  season: number
  episodes: SimplStreamEpisode[]
}

export interface SimplStreamEpisode {
  episode: number
  title?: string
  overview?: string
  airDate?: string
  runtime?: number
  stillPath?: string
}

export interface SimplStreamSource {
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

async function simplstreamFetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${SIMPLSTREAM_API_BASE}${endpoint}`)
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
    throw new Error(`SimplStream API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export const simplstreamApi = {
  search: async (query: string, type?: 'movie' | 'series', page = 1): Promise<{ results: any[]; totalPages: number }> => {
    return simplstreamFetch('/search', { q: query, type, page })
  },

  getTrending: async (type?: 'movie' | 'series', timeWindow: 'day' | 'week' = 'week', page = 1): Promise<{ results: any[]; totalPages: number }> => {
    try {
      return await simplstreamFetch('/trending', { type, time_window: timeWindow, page })
    } catch {
      const d = await fetch('./data/simplstream.json').then((r) => r.json())
      return { results: d.torrents || [], totalPages: 1 }
    }
  },

  getPopular: async (type?: 'movie' | 'series', page = 1): Promise<{ results: any[]; totalPages: number }> => {
    return simplstreamFetch('/popular', { type, page })
  },

  getDetails: async (id: string, type: 'movie' | 'series'): Promise<any | null> => {
    try {
      return await simplstreamFetch(`/${type}/${id}`)
    } catch {
      return null
    }
  },

  getEpisodeSources: async (mediaId: string, type: 'movie' | 'series', season?: number, episode?: number): Promise<any[]> => {
    try {
      const endpoint = type === 'movie' 
        ? `/movie/${mediaId}/sources`
        : `/series/${mediaId}/sources`
      return await simplstreamFetch(endpoint, { season, episode })
    } catch {
      return []
    }
  },

  getMagnetLink: async (sourceId: string): Promise<string | null> => {
    try {
      const result = await simplstreamFetch<{ magnet: string }>(`/source/${sourceId}/magnet`)
      return result.magnet
    } catch {
      return null
    }
  },

  getStreamUrl: async (sourceId: string): Promise<string | null> => {
    try {
      const result = await simplstreamFetch<{ url: string }>(`/source/${sourceId}/stream`)
      return result.url
    } catch {
      return null
    }
  },

  getSubtitles: async (mediaId: string, type: 'movie' | 'series', season?: number, episode?: number, lang = 'en'): Promise<Array<{ lang: string; url: string; format: string }>> => {
    try {
      return await simplstreamFetch<Array<{ lang: string; url: string; format: string }>>(`/${type}/${mediaId}/subtitles`, { season, episode, lang })
    } catch {
      return []
    }
  },
}

export { simplstreamFetch }