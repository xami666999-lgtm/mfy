import { cachedFetch } from '../lib/cache'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const POSTER_URL = `${TMDB_IMAGE_BASE}/w500`
export const BACKDROP_URL = `${TMDB_IMAGE_BASE}/original`
export const PROFILE_URL = `${TMDB_IMAGE_BASE}/w185`
export const STILL_URL = `${TMDB_IMAGE_BASE}/w300`

/** Prefer env var, fall back to user-stored key from electron-store */
function getApiKey(): string {
  const fromEnv = (import.meta as any).env?.VITE_TMDB_API_KEY
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.length > 8) {
    return fromEnv
  }
  try {
    return (window as any).__mfyTmdbKey || ''
  } catch {
    return ''
  }
}

/** Call once after electron store is loaded so subsequent requests work */
export function setRuntimeTmdbKey(key: string) {
  ;(window as any).__mfyTmdbKey = key || ''
}

export class TmdbError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TmdbError'
    this.status = status
  }
}

async function tmdbFetch(
  endpoint: string,
  params: Record<string, string> = {},
  options: { cacheKey?: string; ttlMs?: number; skipCache?: boolean } = {}
): Promise<any> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.warn('[TMDB] No API key configured')
    return null
  }

  const language = (import.meta as any).env?.VITE_TMDB_LANGUAGE || 'en-US'
  const searchParams = new URLSearchParams({
    api_key: apiKey,
    language,
    ...params,
  })

  const url = `${TMDB_BASE}${endpoint}?${searchParams}`
  const cacheKey = options.cacheKey || `tmdb:${endpoint}:${searchParams.toString()}`

  const doFetch = async () => {
    try {
      const res = await fetch(url)
      if (!res.ok) {
        throw new TmdbError(`TMDB request failed (${res.status})`, res.status)
      }
      return await res.json()
    } catch (err) {
      if (err instanceof TmdbError) throw err
      console.error('[TMDB] Network error:', err)
      throw new TmdbError('Network error while contacting TMDB')
    }
  }

  if (options.skipCache) {
    return doFetch()
  }

  try {
    return await cachedFetch(cacheKey, doFetch, options.ttlMs)
  } catch (err) {
    console.error('[TMDB]', err)
    return null
  }
}

export const tmdb = {
  getTrending: (mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week') =>
    tmdbFetch(`/trending/${mediaType}/${timeWindow}`, {}, { cacheKey: `trending:${mediaType}:${timeWindow}` }),

  getPopular: (mediaType: 'movie' | 'tv') =>
    tmdbFetch(`/${mediaType}/popular`, {}, { cacheKey: `popular:${mediaType}` }),

  getTopRated: (mediaType: 'movie' | 'tv') =>
    tmdbFetch(`/${mediaType}/top_rated`, {}, { cacheKey: `top:${mediaType}` }),

  getNowPlaying: () =>
    tmdbFetch('/movie/now_playing', {}, { cacheKey: 'now_playing' }),

  getOnTheAir: () =>
    tmdbFetch('/tv/on_the_air', {}, { cacheKey: 'on_the_air' }),

  getUpcoming: () =>
    tmdbFetch('/movie/upcoming', {}, { cacheKey: 'upcoming' }),

  getMovieDetail: (id: number) =>
    tmdbFetch(`/movie/${id}`, { append_to_response: 'credits,videos,similar,recommendations' }, {
      cacheKey: `movie:${id}`,
      ttlMs: 30 * 60 * 1000,
    }),

  getTVDetail: (id: number) =>
    tmdbFetch(`/tv/${id}`, { append_to_response: 'credits,videos,similar,recommendations' }, {
      cacheKey: `tv:${id}`,
      ttlMs: 30 * 60 * 1000,
    }),

  getSeasonDetail: (tvId: number, seasonNumber: number) =>
    tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`, {}, {
      cacheKey: `season:${tvId}:${seasonNumber}`,
      ttlMs: 30 * 60 * 1000,
    }),

  searchMulti: (query: string) =>
    tmdbFetch('/search/multi', { query }, {
      cacheKey: `search:multi:${query.toLowerCase().trim()}`,
      ttlMs: 10 * 60 * 1000,
    }),

  searchMovies: (query: string) =>
    tmdbFetch('/search/movie', { query }, {
      cacheKey: `search:movie:${query.toLowerCase().trim()}`,
      ttlMs: 10 * 60 * 1000,
    }),

  searchTV: (query: string) =>
    tmdbFetch('/search/tv', { query }, {
      cacheKey: `search:tv:${query.toLowerCase().trim()}`,
      ttlMs: 10 * 60 * 1000,
    }),

  getMovieGenres: () =>
    tmdbFetch('/genre/movie/list', {}, { cacheKey: 'genres:movie', ttlMs: 24 * 60 * 60 * 1000 }),

  getTVGenres: () =>
    tmdbFetch('/genre/tv/list', {}, { cacheKey: 'genres:tv', ttlMs: 24 * 60 * 60 * 1000 }),

  discoverMovies: (params: Record<string, string> = {}) =>
    tmdbFetch('/discover/movie', params, {
      cacheKey: `discover:movie:${JSON.stringify(params)}`,
    }),

  discoverTV: (params: Record<string, string> = {}) =>
    tmdbFetch('/discover/tv', params, {
      cacheKey: `discover:tv:${JSON.stringify(params)}`,
    }),

  getWatchProviders: (mediaType: 'movie' | 'tv', id: number) =>
    tmdbFetch(`/${mediaType}/${id}/watch/providers`, {}, {
      cacheKey: `providers:${mediaType}:${id}`,
      ttlMs: 60 * 60 * 1000,
    }),

  getExternalIds: (mediaType: 'movie' | 'tv', id: number) =>
    tmdbFetch(`/${mediaType}/${id}/external_ids`, {}, {
      cacheKey: `ext:${mediaType}:${id}`,
      ttlMs: 24 * 60 * 60 * 1000,
    }),

  /** Popular titles available on a given watch provider (TMDB provider id) */
  discoverByProvider: (mediaType: 'movie' | 'tv', providerId: number, page = 1) =>
    tmdbFetch(`/discover/${mediaType}`, {
      with_watch_providers: String(providerId),
      watch_region: 'US',
      sort_by: 'popularity.desc',
      page: String(page),
    }, {
      cacheKey: `prov:${mediaType}:${providerId}:${page}`,
    }),
}


export async function getCatalogPage(
  mediaType: 'movie' | 'tv',
  page = 1,
  extra: Record<string, string> = {}
) {
  return mediaType === 'movie'
    ? tmdb.discoverMovies({ page: String(page), ...extra })
    : tmdb.discoverTV({ page: String(page), ...extra })
}

/** Safe poster URL helper */
export function posterSrc(path: string | null | undefined, size: 'w185' | 'w342' | 'w500' = 'w500'): string {
  if (!path) return ''
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function backdropSrc(path: string | null | undefined): string {
  if (!path) return ''
  return `${TMDB_IMAGE_BASE}/original${path}`
}
