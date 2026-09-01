/**
 * Seanime API Client - Manga/Comics/Books source
 * Source: https://github.com/5rahim/seanime
 * API Docs: Based on Seanime's internal API
 */

const SEANIME_API_BASE = 'https://api.seanime.moe' // This may need to be adjusted based on actual Seanime API

export interface SeanimeManga {
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
  externalLinks?: Array<{ url: string; site: string }>
}

export interface SeanimeSearchResult {
  manga: SeanimeManga[]
  pageInfo: {
    total: number
    currentPage: number
    lastPage: number
    hasNextPage: boolean
    perPage: number
  }
}

export interface SeanimeChapter {
  id: string
  number: number
  title?: string
  volume?: number
  language: string
  pages: number
  publishDate?: string
  scanlator?: string
  url: string
}

export interface SeanimeChapterList {
  chapters: SeanimeChapter[]
  pageInfo: {
    total: number
    currentPage: number
    lastPage: number
    hasNextPage: boolean
    perPage: number
  }
}

export interface SeanimePage {
  url: string
  width: number
  height: number
}

async function seanimeFetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${SEANIME_API_BASE}${endpoint}`)
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
    throw new Error(`Seanime API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export const seanimeApi = {
  /**
   * Search manga
   */
  search: async (query: string, page = 1, perPage = 20): Promise<SeanimeSearchResult> => {
    return seanimeFetch<SeanimeSearchResult>('/api/manga/search', { q: query, page, perPage })
  },

  /**
   * Get popular manga
   */
  getPopular: async (page = 1, perPage = 20): Promise<SeanimeSearchResult> => {
    return seanimeFetch<SeanimeSearchResult>('/api/manga/popular', { page, perPage })
  },

  /**
   * Get latest updates
   */
  getLatestUpdates: async (page = 1, perPage = 20): Promise<SeanimeSearchResult> => {
    return seanimeFetch<SeanimeSearchResult>('/api/manga/latest', { page, perPage })
  },

  /**
   * Get manga by genre
   */
  getByGenre: async (genre: string, page = 1, perPage = 20): Promise<SeanimeSearchResult> => {
    return seanimeFetch<SeanimeSearchResult>('/api/manga/genre', { genre, page, perPage })
  },

  /**
   * Get manga details by ID
   */
  getMangaDetails: async (id: string): Promise<SeanimeManga | null> => {
    try {
      return await seanimeFetch<SeanimeManga>(`/api/manga/${id}`)
    } catch {
      return null
    }
  },

  /**
   * Get manga chapters
   */
  getChapters: async (mangaId: string, page = 1, perPage = 50): Promise<SeanimeChapterList> => {
    return seanimeFetch<SeanimeChapterList>(`/api/manga/${mangaId}/chapters`, { page, perPage })
  },

  /**
   * Get chapter pages
   */
  getChapterPages: async (chapterId: string): Promise<SeanimePage[]> => {
    return seanimeFetch<SeanimePage[]>(`/api/chapter/${chapterId}/pages`)
  },

  /**
   * Get manga by status
   */
  getByStatus: async (status: string, page = 1, perPage = 20): Promise<SeanimeSearchResult> => {
    return seanimeFetch<SeanimeSearchResult>('/api/manga/status', { status, page, perPage })
  },

  /**
   * Get manga by type (manga, novel, manhwa, manhua, etc.)
   */
  getByType: async (type: string, page = 1, perPage = 20): Promise<SeanimeSearchResult> => {
    return seanimeFetch<SeanimeSearchResult>('/api/manga/type', { type, page, perPage })
  },

  /**
   * Get random manga
   */
  getRandom: async (): Promise<SeanimeManga | null> => {
    try {
      return await seanimeFetch<SeanimeManga>('/api/manga/random')
    } catch {
      return null
    }
  },

  /**
   * Get manga recommendations
   */
  getRecommendations: async (mangaId: string): Promise<SeanimeManga[]> => {
    try {
      const result = await seanimeFetch<{ manga: SeanimeManga[] }>(`/api/manga/${mangaId}/recommendations`)
      return result.manga || []
    } catch {
      return []
    }
  },

  /**
   * Get manga by author/artist
   */
  getByAuthor: async (author: string, page = 1, perPage = 20): Promise<SeanimeSearchResult> => {
    return seanimeFetch<SeanimeSearchResult>('/api/manga/author', { author, page, perPage })
  },
}

export { seanimeFetch }