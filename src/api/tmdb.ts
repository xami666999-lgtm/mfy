import { cachedFetch } from '../lib/cache'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const POSTER_URL = `${TMDB_IMAGE_BASE}/w500`
export const BACKDROP_URL = `${TMDB_IMAGE_BASE}/original`
export const PROFILE_URL = `${TMDB_IMAGE_BASE}/w185`
export const STILL_URL = `${TMDB_IMAGE_BASE}/w300`

// Baked-in default key (project is private/for known users); may be overridden via
// env (VITE_TMDB_API_KEY) or by a user-stored key in Settings.
export const DEFAULT_TMDB_API_KEY = '15fdef3642df31491f4e1cfc08782dc6'

/** Prefer env var, fall back to user-stored key, then the baked default */
function getApiKey(): string {
  const fromEnv = (import.meta as any).env?.VITE_TMDB_API_KEY
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.length > 8) {
    return fromEnv
  }
  try {
    const stored = (window as any).__mfyTmdbKey || ''
    if (stored && stored.length > 8) return stored
  } catch {
    // ignore
  }
  return DEFAULT_TMDB_API_KEY
}

/** Call once after electron store is loaded so subsequent requests work */
export function setRuntimeTmdbKey(key: string) {
  ;(window as any).__mfyTmdbKey = key || ''
}

/**
 * Quick sanity check against the TMDB API. Used at startup so a stale/revoked
 * user-stored key can never brick the catalog — if it fails we fall back to the
 * baked default key instead of showing empty pages.
 */
export async function isTmdbKeyValid(key: string): Promise<boolean> {
  if (!key || key.length < 8) return false
  try {
    const res = await fetch(`${TMDB_BASE}/movie/550?api_key=${encodeURIComponent(key)}`)
    if (!res.ok) return false
    const data = await res.json()
    return Boolean(data && typeof data.id === 'number')
  } catch {
    return false
  }
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

  getCollection: (collectionId: number) =>
    tmdbFetch(`/collection/${collectionId}`, {}, {
      cacheKey: `collection:${collectionId}`,
      ttlMs: 24 * 60 * 60 * 1000,
    }),

  /** Search collections/franchises */
  searchCollection: (query: string) =>
    tmdbFetch('/search/collection', { query }, {
      cacheKey: `search:collection:${query.toLowerCase().trim()}`,
      ttlMs: 10 * 60 * 1000,
    }),

  /** Get collection/franchise details with parts */
  getCollectionDetail: (collectionId: number) =>
    tmdbFetch(`/collection/${collectionId}`, {}, {
      cacheKey: `collection:${collectionId}`,
      ttlMs: 24 * 60 * 60 * 1000,
    }),

  /** Get trailers/videos for a movie or TV show */
  getVideos: (mediaType: 'movie' | 'tv', id: number) =>
    tmdbFetch(`/${mediaType}/${id}/videos`, {}, {
      cacheKey: `videos:${mediaType}:${id}`,
      ttlMs: 60 * 60 * 1000,
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

  /** Popular people (actors/directors) — used as avatar choices for profiles */
  getPopularPeople: (page = 1) =>
    tmdbFetch(`/person/popular`, { page: String(page) }, {
      cacheKey: `person:popular:${page}`,
      ttlMs: 24 * 60 * 60 * 1000,
    }),

  /** Search people (actors/directors) */
  searchPerson: (query: string) =>
    tmdbFetch('/search/person', { query }, {
      cacheKey: `search:person:${query.toLowerCase().trim()}`,
      ttlMs: 10 * 60 * 1000,
    }),

  /** Get person details with their known for works */
  getPersonDetail: (id: number) =>
    tmdbFetch(`/person/${id}`, { append_to_response: 'movie_credits,tv_credits,combined_credits' }, {
      cacheKey: `person:${id}`,
      ttlMs: 30 * 60 * 1000,
    }),

  /** Fictional-character portraits — curated list of famous roles for profile avatars */
  getCharacterAvatars: () => {
    const characters: { query: string; label: string }[] = [
      { query: 'Spider-Man', label: 'Spider-Man' },
      { query: 'Batman', label: 'Batman' },
      { query: 'Superman', label: 'Superman' },
      { query: 'Iron Man', label: 'Iron Man' },
      { query: 'Captain America', label: 'Captain America' },
      { query: 'Thor', label: 'Thor' },
      { query: 'Hulk', label: 'Hulk' },
      { query: 'Black Panther', label: 'Black Panther' },
      { query: 'Wonder Woman', label: 'Wonder Woman' },
      { query: 'Joker', label: 'Joker' },
      { query: 'Deadpool', label: 'Deadpool' },
      { query: 'Wolverine', label: 'Wolverine' },
      { query: 'John Wick', label: 'John Wick' },
      { query: 'Neo', label: 'Neo' },
      { query: 'Jack Sparrow', label: 'Jack Sparrow' },
      { query: 'James Bond', label: 'James Bond' },
      { query: 'Indiana Jones', label: 'Indiana Jones' },
      { query: 'Darth Vader', label: 'Darth Vader' },
      { query: 'Yoda', label: 'Yoda' },
      { query: 'Harry Potter', label: 'Harry Potter' },
      { query: 'Gandalf', label: 'Gandalf' },
      { query: 'Terminator', label: 'Terminator' },
      { query: 'Rocky Balboa', label: 'Rocky' },
      { query: 'Jurassic Park', label: 'Jurassic Park' },
    ]
    return Promise.all(characters.map((c) => tmdbFetch(`/search/person`, { query: c.query }, { cacheKey: `person:search:${c.query}`, ttlMs: 7 * 24 * 60 * 60 * 1000 })))
      .then((results) =>
        results
          .map((res, i) => {
            const hit = res?.results?.[0]
            return hit?.profile_path ? { path: hit.profile_path, name: characters[i].label } : null
          })
          .filter((x): x is { path: string; name: string } => Boolean(x))
      )
      .catch(() => [])
  },
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
