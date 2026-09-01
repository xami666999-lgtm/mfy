/**
 * Miruro API Client - Anime player with posters
 * Source: https://github.com/Miruro-no-kuon/Miruro
 * Miruro is an anime streaming platform that provides embed players
 */

const MIRURO_BASE = 'https://miruro.tv' // Main site
const MIRURO_API = 'https://api.miruro.tv' // API endpoint (may vary)

export interface MiruroAnime {
  id: string
  title: string
  altTitles?: string[]
  coverImage?: string
  bannerImage?: string
  description?: string
  status: string
  episodes?: number
  duration?: number
  genres?: string[]
  tags?: string[]
  averageScore?: number
  popularity?: number
  year?: number
  season?: string
  type?: string
  source?: string
  studios?: string[]
  nextAiringEpisode?: { episode: number; airingAt: number; timeUntilAiring: number }
}

export interface MiruroEpisode {
  id: string
  number: number
  title?: string
  thumbnail?: string
  duration?: number
  airedAt?: string
  filler?: boolean
}

export interface MiruroSource {
  url: string
  quality: string
  type: 'hls' | 'mp4' | 'dash'
  server: string
  headers?: Record<string, string>
}

async function miruroFetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${MIRURO_API}${endpoint}`)
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
      'Referer': MIRURO_BASE,
    },
  })

  if (!res.ok) {
    throw new Error(`Miruro API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export const miruroApi = {
  /**
   * Search anime
   */
  search: async (query: string, page = 1): Promise<{ data: MiruroAnime[]; hasNextPage: boolean }> => {
    return miruroFetch<{ data: MiruroAnime[]; hasNextPage: boolean }>('/anime/search', { q: query, page })
  },

  /**
   * Get trending/popular anime
   */
  getPopular: async (page = 1): Promise<{ data: MiruroAnime[]; hasNextPage: boolean }> => {
    return miruroFetch<{ data: MiruroAnime[]; hasNextPage: boolean }>('/anime/popular', { page })
  },

  /**
   * Get currently airing anime
   */
  getAiring: async (page = 1): Promise<{ data: MiruroAnime[]; hasNextPage: boolean }> => {
    return miruroFetch<{ data: MiruroAnime[]; hasNextPage: boolean }>('/anime/airing', { page })
  },

  /**
   * Get recently updated
   */
  getRecentlyUpdated: async (page = 1): Promise<{ data: MiruroAnime[]; hasNextPage: boolean }> => {
    return miruroFetch<{ data: MiruroAnime[]; hasNextPage: boolean }>('/anime/recently-updated', { page })
  },

  /**
   * Get anime by genre
   */
  getByGenre: async (genre: string, page = 1): Promise<{ data: MiruroAnime[]; hasNextPage: boolean }> => {
    return miruroFetch<{ data: MiruroAnime[]; hasNextPage: boolean }>('/anime/genre', { genre, page })
  },

  /**
   * Get anime details by ID
   */
  getAnimeDetails: async (id: string): Promise<MiruroAnime | null> => {
    try {
      return await miruroFetch<MiruroAnime>(`/anime/${id}`)
    } catch {
      return null
    }
  },

  /**
   * Get anime episodes
   */
  getEpisodes: async (animeId: string): Promise<MiruroEpisode[]> => {
    try {
      return await miruroFetch<MiruroEpisode[]>(`/anime/${animeId}/episodes`)
    } catch {
      return []
    }
  },

  /**
   * Get episode sources (stream URLs)
   */
  getEpisodeSources: async (episodeId: string): Promise<MiruroSource[]> => {
    try {
      return await miruroFetch<MiruroSource[]>(`/episode/${episodeId}/sources`)
    } catch {
      return []
    }
  },

  /**
   * Get embed URL for iframe player
   */
  getEmbedUrl: (animeId: string, episode?: number): string => {
    const base = `${MIRURO_BASE}/watch/${animeId}`
    return episode ? `${base}/${episode}` : base
  },

  /**
   * Get poster/cover image URL
   */
  getPosterUrl: (animeId: string, size: 'small' | 'medium' | 'large' = 'large'): string => {
    return `${MIRURO_BASE}/images/anime/${animeId}/poster_${size}.jpg`
  },

  /**
   * Get banner image URL
   */
  getBannerUrl: (animeId: string): string => {
    return `${MIRURO_BASE}/images/anime/${animeId}/banner.jpg`
  },
}

export { miruroFetch }