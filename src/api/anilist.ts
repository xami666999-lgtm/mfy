/**
 * AniList GraphQL API Client
 * Docs: https://docs.anilist.co/
 * GraphQL Endpoint: https://graphql.anilist.co
 */

const ANILIST_API_URL = 'https://graphql.anilist.co'

interface AniListResponse<T> {
  data?: T
  errors?: Array<{ message: string; status: number; locations?: Array<{ line: number; column: number }> }>
}

async function anilistFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const payload = JSON.stringify({ query, variables })
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  let json: AniListResponse<T>
  if (api?.fetchJson) {
    const r = await api.fetchJson(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: payload,
      timeoutMs: 15000,
    })
    if (!r?.ok) throw new Error(r?.error || 'AniList proxy failed')
    json = r.json
  } else {
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: payload,
    })
    if (!res.ok) throw new Error(`AniList API error: ${res.status}`)
    json = await res.json()
  }
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join(', '))
  return json.data as T
}

export interface AniListMedia {
  id: number
  idMal?: number
  title: {
    romaji: string
    english?: string
    native: string
    userPreferred?: string
  }
  description?: string
  coverImage: {
    large: string
    medium: string
    color?: string
  }
  bannerImage?: string
  format?: string
  status: string
  episodes?: number
  duration?: number
  chapters?: number
  volumes?: number
  countryOfOrigin?: string
  genres: string[]
  tags: Array<{ name: string; description?: string; category?: string; rank?: number; isGeneralSpoiler?: boolean; isMediaSpoiler?: boolean; isAdult?: boolean }>
  averageScore?: number
  meanScore?: number
  popularity?: number
  favourites?: number
  startDate?: { year?: number; month?: number; day?: number }
  endDate?: { year?: number; month?: number; day?: number }
  season?: string
  seasonYear?: number
  type: 'ANIME' | 'MANGA'
  formatType?: string
  source?: string
  trailer?: { id: string; site: string; thumbnail?: string }
  studios?: { nodes: Array<{ id: number; name: string; isAnimationStudio?: boolean }> }
  relations?: any
  characters?: any
  staff?: any
  recommendations?: any
  nextAiringEpisode?: { airingAt: number; timeUntilAiring: number; episode: number }
  externalLinks?: any
}

export interface AniListSearchResult {
  Page: {
    pageInfo: { total: number; currentPage: number; lastPage: number; hasNextPage: boolean; perPage: number }
    media: AniListMedia[]
  }
}

export interface AniListPageResult {
  Page: {
    pageInfo: { total: number; currentPage: number; lastPage: number; hasNextPage: boolean; perPage: number }
    media: AniListMedia[]
  }
}

export interface AniListMediaResponse {
  Media: AniListMedia
}

const anilistApi = {
  /**
   * Search anime/manga
   */
  search: async (query: string, type?: 'ANIME' | 'MANGA', page = 1, perPage = 20): Promise<{ media: AniListMedia[]; pageInfo: AniListSearchResult['Page']['pageInfo'] }> => {
    const queryStr = `
      query ($search: String, $type: MediaType, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage lastPage hasNextPage perPage }
          media(search: $search, type: $type, sort: [POPULARITY_DESC, SEARCH_MATCH]) {
            id
            title { romaji english native }
            coverImage { large medium color }
            bannerImage
            type
            format
            status
            episodes
            duration
            chapters
            volumes
            genres
            averageScore
            popularity
            startDate { year month day }
            endDate { year month day }
            season
            seasonYear
            nextAiringEpisode { airingAt timeUntilAiring episode }
          }
        }
      }
    `
    const data = await anilistFetch<AniListSearchResult>(queryStr, { search: query, type, page, perPage })
    return { media: data.Page?.media || [], pageInfo: data.Page?.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 20 } }
  },

  /**
   * Get popular/trending anime/manga
   */
  getPopular: async (type: 'ANIME' | 'MANGA' = 'ANIME', page = 1, perPage = 20): Promise<{ media: AniListMedia[]; pageInfo: AniListSearchResult['Page']['pageInfo'] }> => {
    const queryStr = `
      query ($type: MediaType, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage lastPage hasNextPage perPage }
          media(type: $type, sort: [TRENDING_DESC, POPULARITY_DESC]) {
            id
            title { romaji english native }
            coverImage { large medium color }
            bannerImage
            type
            format
            status
            episodes
            duration
            chapters
            volumes
            genres
            averageScore
            popularity
            startDate { year month day }
            endDate { year month day }
            season
            seasonYear
            nextAiringEpisode { airingAt timeUntilAiring episode }
          }
        }
      }
    `
    const data = await anilistFetch<AniListSearchResult>(queryStr, { type, page, perPage })
    return { media: data.Page?.media || [], pageInfo: data.Page?.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 20 } }
  },

  /**
   * Get trending anime/manga
   */
  getTrending: async (type: 'ANIME' | 'MANGA' = 'ANIME', page = 1, perPage = 20): Promise<{ media: AniListMedia[]; pageInfo: AniListSearchResult['Page']['pageInfo'] }> => {
    return anilistApi.getPopular(type, page, perPage)
  },

  /**
   * Get top rated anime/manga
   */
  getTopRated: async (type: 'ANIME' | 'MANGA' = 'ANIME', page = 1, perPage = 20): Promise<{ media: AniListMedia[]; pageInfo: AniListSearchResult['Page']['pageInfo'] }> => {
    const queryStr = `
      query ($type: MediaType, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage lastPage hasNextPage perPage }
          media(type: $type, sort: [SCORE_DESC, POPULARITY_DESC]) {
            id
            title { romaji english native }
            coverImage { large medium color }
            bannerImage
            type
            format
            status
            episodes
            duration
            chapters
            volumes
            genres
            averageScore
            popularity
            startDate { year month day }
            endDate { year month day }
            season
            seasonYear
          }
        }
      }
    `
    const data = await anilistFetch<AniListSearchResult>(queryStr, { type, page, perPage })
    return { media: data.Page?.media || [], pageInfo: data.Page?.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 20 } }
  },

  /**
   * Get media by genre
   */
  getByGenre: async (genre: string, type?: 'ANIME' | 'MANGA', page = 1, perPage = 24): Promise<{ media: AniListMedia[]; pageInfo: AniListSearchResult['Page']['pageInfo'] }> => {
    const queryStr = `
      query ($genre: String, $type: MediaType, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage lastPage hasNextPage perPage }
          media(genre: $genre, type: $type, sort: [POPULARITY_DESC]) {
            id
            title { romaji english native }
            coverImage { large medium color }
            bannerImage
            type
            format
            status
            episodes
            duration
            chapters
            volumes
            genres
            averageScore
            popularity
            startDate { year month day }
            endDate { year month day }
            season
            seasonYear
          }
        }
      }
    `
    const data = await anilistFetch<AniListSearchResult>(queryStr, { genre, type, page, perPage })
    return { media: data.Page?.media || [], pageInfo: data.Page?.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 24 } }
  },

  /**
   * Get media details by ID
   */
  getMediaDetails: async (id: number): Promise<AniListMedia | null> => {
    const queryStr = `
      query ($id: Int) {
        Media(id: $id) {
          id
          idMal
          title { romaji english native userPreferred }
          description
          coverImage { large medium color }
          bannerImage
          format
          status
          episodes
          duration
          chapters
          volumes
          countryOfOrigin
          genres
          tags { name description category rank isGeneralSpoiler isMediaSpoiler isAdult }
          averageScore
          meanScore
          popularity
          favourites
          startDate { year month day }
          endDate { year month day }
          season
          seasonYear
          type
          format
          source
          trailer { id site thumbnail }
          studios { nodes { id name isAnimationStudio } }
          relations { edges { relationType node { id title { romaji english } type format status episodes chapters volumes coverImage { large } } } }
          characters { edges { node { id name { full native } image { large } } role } }
          staff { edges { node { id name { full native } image { large } primaryOccupations } role } }
          recommendations { edges { node { id title { romaji english } coverImage { large } type format status averageScore } rating } }
          nextAiringEpisode { airingAt timeUntilAiring episode }
          externalLinks { url site type language color icon notes isDisabled }
        }
      }
    `
    try {
      const data = await anilistFetch<AniListMediaResponse>(queryStr, { id })
      return data.Media || null
    } catch {
      return null
    }
  },

  /**
   * Get airing schedule
   */
  getAiringSchedule: async (page = 1, perPage = 50): Promise<{ media: AniListMedia[]; pageInfo: AniListSearchResult['Page']['pageInfo'] }> => {
    const queryStr = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage lastPage hasNextPage perPage }
          media(type: ANIME, status: RELEASING, sort: [NEXT_AIRING_DESC]) {
            id
            title { romaji english native }
            coverImage { large medium color }
            bannerImage
            type
            format
            status
            episodes
            duration
            genres
            averageScore
            popularity
            startDate { year month day }
            endDate { year month day }
            season
            seasonYear
            nextAiringEpisode { airingAt timeUntilAiring episode }
          }
        }
      }
    `
    const data = await anilistFetch<AniListSearchResult>(queryStr, { page, perPage })
    return { media: data.Page?.media || [], pageInfo: data.Page?.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 50 } }
  },

  /**
   * Get media by season
   */
  getBySeason: async (season: string, seasonYear: number, type: 'ANIME' | 'MANGA' = 'ANIME', page = 1, perPage = 24): Promise<{ media: AniListMedia[]; pageInfo: AniListSearchResult['Page']['pageInfo'] }> => {
    const queryStr = `
      query ($season: MediaSeason, $seasonYear: Int, $type: MediaType, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(season: $season, seasonYear: $seasonYear, type: $type, sort: [POPULARITY_DESC]) {
            id
            title { romaji english native }
            coverImage { large medium color }
            bannerImage
            type
            format
            status
            episodes
            duration
            chapters
            volumes
            genres
            averageScore
            popularity
            startDate { year month day }
            endDate { year month day }
            season
            seasonYear
          }
        }
      }
    `
    const data = await anilistFetch<AniListSearchResult>(queryStr, { season, seasonYear, type, page, perPage })
    return { media: data.Page?.media || [], pageInfo: data.Page?.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 24 } }
  },

  /**
   * Get character details
   */
  getCharacter: async (id: number): Promise<any> => {
    const queryStr = `
      query ($id: Int) {
        Character(id: $id) {
          id
          name { full native userPreferred }
          image { large medium }
          description
          gender
          dateOfBirth { year month day }
          age
          bloodType
          favourites
          media { edges { node { id title { romaji english } type coverImage { large } } } }
        }
      }
    `
    const data = await anilistFetch<{ Character: any }>(queryStr, { id })
    return data.Character || null
  },

  searchStaff: async (search: string, page = 1, perPage = 12): Promise<any[]> => {
    const queryStr = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          staff(search: $search, sort: [SEARCH_MATCH, FAVOURITES_DESC]) {
            id name { full native } image { large } primaryOccupations
          }
        }
      }
    `
    const data = await anilistFetch<{ Page: { staff: any[] } }>(queryStr, { search, page, perPage })
    return data.Page?.staff || []
  },

  /**
   * Get staff details
   */
  getStaff: async (id: number): Promise<any> => {
    const queryStr = `
      query ($id: Int) {
        Staff(id: $id) {
          id
          name { full native userPreferred }
          image { large medium }
          description
          gender
          primaryOccupations
          favourites
          media { edges { node { id title { romaji english } type coverImage { large } } } }
        }
      }
    `
    const data = await anilistFetch<{ Staff: any }>(queryStr, { id })
    return data.Staff || null
  },

  /**
   * Get studio details
   */
  getStudio: async (id: number): Promise<any> => {
    const queryStr = `
      query ($id: Int) {
        Studio(id: $id) {
          id
          name
          isAnimationStudio
          siteUrl
          favourites
          media { edges { node { id title { romaji english } type coverImage { large } } } }
        }
      }
    `
    const data = await anilistFetch<{ Studio: any }>(queryStr, { id })
    return data.Studio || null
  },
}

export { anilistApi as anilist, anilistFetch }