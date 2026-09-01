/**
 * Mangayomi API - Manga/Novel source
 * Source: https://github.com/kodjodevf/mangayomi
 */

const MANGAYOMI_API_BASE = 'https://api.mangayomi.com'

export interface MangayomiManga {
  id: string
  title: string
  altTitles?: string[]
  coverImage?: string
  bannerImage?: string
  description?: string
  status: string
  chapters?: number
  volumes?: number
  authors?: string[]
  artists?: string[]
  genres?: string[]
  tags?: string[]
  averageScore?: number
  popularity?: number
  year?: number
  season?: string
  format?: string
  type?: 'MANGA' | 'NOVEL' | 'ONE_SHOT' | 'DOUJINSHI' | 'MANHWA' | 'MANHUA'
  source?: string
  countryOfOrigin?: string
  startDate?: { year?: number; month?: number; day?: number }
  endDate?: { year?: number; month?: number; day?: number }
}

export interface MangayomiSearchResult {
  manga: MangayomiManga[]
  hasNextPage: boolean
}

async function mangayomiFetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${MANGAYOMI_API_BASE}${endpoint}`)
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
    throw new Error(`Mangayomi API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export const mangayomiApi = {
  search: async (query: string, page = 1, perPage = 20): Promise<{ manga: any[]; hasNextPage: boolean }> => {
    return mangayomiFetch(`/api/manga/search?q=${encodeURIComponent(query)}&page=${page}&limit=${perPage}`)
  },

  getPopular: async (page = 1, perPage = 20): Promise<{ manga: any[]; hasNextPage: boolean }> => {
    return mangayomiFetch(`/api/manga/popular?page=${page}&limit=${perPage}`)
  },

  getLatestUpdates: async (page = 1, perPage = 20): Promise<{ manga: any[]; hasNextPage: boolean }> => {
    return mangayomiFetch(`/api/manga/latest?page=${page}&limit=${perPage}`)
  },

  getByGenre: async (genre: string, page = 1, perPage = 20): Promise<{ manga: any[]; hasNextPage: boolean }> => {
    return mangayomiFetch(`/api/manga/genre/${encodeURIComponent(genre)}?page=${page}&limit=${perPage}`)
  },

  getByStatus: async (status: string, page = 1, perPage = 20): Promise<{ manga: any[]; hasNextPage: boolean }> => {
    return mangayomiFetch(`/api/manga/status/${encodeURIComponent(status)}?page=${page}&limit=${perPage}`)
  },

  getByType: async (type: string, page = 1, perPage = 20): Promise<{ manga: any[]; hasNextPage: boolean }> => {
    return mangayomiFetch(`/api/manga/type/${encodeURIComponent(type)}?page=${page}&limit=${perPage}`)
  },

  getMangaDetails: async (id: string): Promise<MangayomiManga | null> => {
    try {
      return await mangayomiFetch(`/api/manga/${id}`)
    } catch {
      return null
    }
  },

  getChapters: async (mangaId: string, page = 1, perPage = 50): Promise<any[]> => {
    try {
      return mangayomiFetch(`/api/manga/${mangaId}/chapters?page=${page}&limit=${perPage}`)
    } catch {
      return []
    }
  },

  getChapterPages: async (chapterId: string): Promise<string[]> => {
    try {
      return mangayomiFetch(`/api/chapter/${chapterId}/pages`)
    } catch {
      return []
    }
  },
}