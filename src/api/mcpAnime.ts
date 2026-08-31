/**
 * MCP Anime API - Manga data from MCP_Anime
 * Source: https://github.com/Shalin-Shah-2002/MCP_Anime
 */

const MCP_ANIME_BASE = 'https://raw.githubusercontent.com/Shalin-Shah-2002/MCP_Anime/main/data'

export interface Manga {
  id: string
  title: string
  titleEnglish?: string
  titleRomaji?: string
  coverImage?: string
  bannerImage?: string
  description?: string
  status?: string
  chapters?: number
  volumes?: number
  genres?: string[]
  authors?: string[]
  artists?: string[]
  year?: number
  season?: string
  format?: string
  averageScore?: number
  popularity?: number
  trending?: number
  tags?: string[]
  startDate?: string
  endDate?: string
  demographic?: string
  lastChapterDate?: string
}

interface MCPResponse {
  manga: Manga[]
  lastUpdated: string
}

export const mcpAnimeApi = {
  /** Get all manga */
  getAllManga: async (): Promise<Manga[]> => {
    try {
      const res = await fetch(`${MCP_ANIME_BASE}/manga.json`)
      if (!res.ok) throw new Error(`MCP Anime API error: ${res.status}`)
      const data = await res.json()
      return data.manga || data || []
    } catch (error) {
      console.error('MCP Anime API error:', error)
      return []
    }
  },

  /** Get popular manga */
  getPopularManga: async (limit = 20): Promise<Manga[]> => {
    const manga = await mcpAnimeApi.getAllManga()
    return manga
      .filter(m => m.popularity && m.popularity > 0)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit)
  },

  /** Get trending manga */
  getTrendingManga: async (limit = 20): Promise<Manga[]> => {
    const manga = await mcpAnimeApi.getAllManga()
    return manga
      .filter(m => m.trending && m.trending > 0)
      .sort((a, b) => (b.trending || 0) - (a.trending || 0))
      .slice(0, limit)
  },

  /** Get manga by genre */
  getMangaByGenre: async (genre: string, limit = 20): Promise<Manga[]> => {
    const manga = await mcpAnimeApi.getAllManga()
    return manga
      .filter(m => m.genres?.some(g => g.toLowerCase().includes(genre.toLowerCase())))
      .slice(0, limit)
  },

  /** Get manga by status */
  getMangaByStatus: async (status: string, limit = 20): Promise<Manga[]> => {
    const manga = await mcpAnimeApi.getAllManga()
    return manga
      .filter(m => m.status?.toLowerCase() === status.toLowerCase())
      .slice(0, limit)
  },

  /** Search manga */
  searchManga: async (query: string, limit = 20): Promise<Manga[]> => {
    const manga = await mcpAnimeApi.getAllManga()
    const q = query.toLowerCase().trim()
    return manga
      .filter(m => 
        m.title?.toLowerCase().includes(q) ||
        m.titleEnglish?.toLowerCase().includes(q) ||
        m.titleRomaji?.toLowerCase().includes(q)
      )
      .slice(0, limit)
  },

  /** Get manga details by ID */
  getMangaDetails: async (id: string): Promise<Manga | null> => {
    const manga = await mcpAnimeApi.getAllManga()
    return manga.find(m => m.id === id) || null
  },

  /** Get manga by demographic */
  getMangaByDemographic: async (demographic: string, limit = 20): Promise<Manga[]> => {
    const manga = await mcpAnimeApi.getAllManga()
    return manga
      .filter(m => m.demographic?.toLowerCase() === demographic.toLowerCase())
      .slice(0, limit)
  },

  /** Get top rated manga */
  getTopRatedManga: async (limit = 20): Promise<Manga[]> => {
    const manga = await mcpAnimeApi.getAllManga()
    return manga
      .filter(m => m.averageScore && m.averageScore > 0)
      .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
      .slice(0, limit)
  },

  /** Get latest chapters/updates */
  getLatestUpdates: async (limit = 20): Promise<Manga[]> => {
    const manga = await mcpAnimeApi.getAllManga()
    return manga
      .filter(m => m.lastChapterDate)
      .sort((a, b) => new Date(b.lastChapterDate || 0).getTime() - new Date(a.lastChapterDate || 0).getTime())
      .slice(0, limit)
  }
}