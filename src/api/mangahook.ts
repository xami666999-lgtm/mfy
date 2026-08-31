/**
 * MangaHook API - Airing schedule for anime and TV shows
 * Source: https://mangahook-api.vercel.app/
 */

const MANGAHOOK_BASE = 'https://mangahook-api.vercel.app'

interface AiringAnime {
  id: string
  title: string
  titleEnglish?: string
  titleRomaji?: string
  coverImage?: string
  bannerImage?: string
  nextAiringEpisode?: number
  airingAt?: number
  timeUntilAiring?: number
  episodes?: number
  status?: string
  season?: string
  year?: number
  genres?: string[]
  format?: string
}

interface AiringTVShow {
  id: string
  name: string
  originalName?: string
  posterPath?: string
  backdropPath?: string
  firstAirDate?: string
  nextEpisodeToAir?: {
    episodeNumber: number
    airDate: string
    name: string
  }
  lastEpisodeToAir?: {
    episodeNumber: number
    airDate: string
    name: string
  }
  status?: string
  genres?: string[]
  voteAverage?: number
  overview?: string
}

interface MangahookResponse {
  anime?: AiringAnime[]
  tvShows?: AiringTVShow[]
  lastUpdated: string
}

export const mangahookApi = {
  /** Get airing schedule for anime and TV shows */
  getAiringSchedule: async (): Promise<MangahookResponse> => {
    try {
      const res = await fetch(`${MANGAHOOK_BASE}/api/schedule`)
      if (!res.ok) throw new Error(`MangaHook API error: ${res.status}`)
      return await res.json()
    } catch (error) {
      console.error('MangaHook API error:', error)
      return { anime: [], tvShows: [], lastUpdated: new Date().toISOString() }
    }
  },

  /** Get airing anime schedule */
  getAiringAnime: async (): Promise<AiringAnime[]> => {
    try {
      const res = await fetch(`${MANGAHOOK_BASE}/api/anime/airing`)
      if (!res.ok) throw new Error(`MangaHook API error: ${res.status}`)
      return await res.json()
    } catch (error) {
      console.error('MangaHook anime error:', error)
      return []
    }
  },

  /** Get airing TV shows schedule */
  getAiringTVShows: async (): Promise<AiringTVShow[]> => {
    try {
      const res = await fetch(`${MANGAHOOK_BASE}/api/tv/airing`)
      if (!res.ok) throw new Error(`MangaHook API error: ${res.status}`)
      return await res.json()
    } catch (error) {
      console.error('MangaHook TV shows error:', error)
      return []
    }
  },

  /** Get anime details by ID */
  getAnimeDetails: async (id: string): Promise<AiringAnime | null> => {
    try {
      const res = await fetch(`${MANGAHOOK_BASE}/api/anime/${id}`)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  },

  /** Get TV show details by ID */
  getTVShowDetails: async (id: string): Promise<AiringTVShow | null> => {
    try {
      const res = await fetch(`${MANGAHOOK_BASE}/api/tv/${id}`)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }
}

export type { AiringAnime, AiringTVShow, MangahookResponse }