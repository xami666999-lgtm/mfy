/**
 * Zangetsu API - Anime player
 * Source: https://github.com/Spyou/Zangetsu
 */

const ZANGETSU_API_BASE = 'https://api.zangetsu.moe'

export interface ZangetsuAnime {
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

export interface ZangetsuEpisode {
  id: string
  number: number
  title?: string
  thumbnail?: string
  duration?: number
  airedAt?: string
  filler?: boolean
}

export interface ZangetsuSource {
  url: string
  quality: string
  type: 'hls' | 'mp4' | 'dash'
  server: string
  headers?: Record<string, string>
}

async function zangetsuFetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${ZANGETSU_API_BASE}${endpoint}`)
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
    throw new Error(`Zangetsu API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export const zangetsuApi = {
  search: async (query: string, page = 1): Promise<{ data: any[]; hasNextPage: boolean }> => {
    return zangetsuFetch(`/api/anime/search`, { q: query, page })
  },

  getPopular: async (page = 1): Promise<{ data: any[]; hasNextPage: boolean }> => {
    return zangetsuFetch(`/api/anime/popular`, { page })
  },

  getAiring: async (page = 1): Promise<{ data: any[]; hasNextPage: boolean }> => {
    return zangetsuFetch(`/api/anime/airing`, { page })
  },

  getByGenre: async (genre: string, page = 1): Promise<{ data: any[]; hasNextPage: boolean }> => {
    return zangetsuFetch(`/api/anime/genre`, { genre, page })
  },

  getAnimeDetails: async (id: string): Promise<any | null> => {
    try {
      return await zangetsuFetch(`/api/anime/${id}`)
    } catch {
      return null
    }
  },

  getEpisodes: async (animeId: string): Promise<any[]> => {
    try {
      return zangetsuFetch(`/api/anime/${animeId}/episodes`)
    } catch {
      return []
    }
  },

  getEpisodeSources: async (episodeId: string): Promise<any[]> => {
    try {
      return zangetsuFetch(`/api/episode/${episodeId}/sources`)
    } catch {
      return []
    }
  },

  getEmbedUrl: (animeId: string, episode?: number): string => {
    const base = `https://zangetsu.moe/watch/${animeId}`
    return episode ? `${base}/${episode}` : base
  },

  getPosterUrl: (animeId: string, size: 'small' | 'medium' | 'large' = 'large'): string => {
    return `https://zangetsu.moe/images/anime/${animeId}/poster_${size}.jpg`
  },
}