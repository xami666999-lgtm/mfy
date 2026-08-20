import { cachedFetch } from '../lib/cache'

const MDBLIST_BASE = 'https://api.mdblist.com/v1'

export interface MdblistRating {
  source: string
  value: number | null
  score: number | null
  votes: number | null
  url: string | null
}

export interface MdblistResult {
  title: string | null
  year: number | null
  type: string | null
  imdb_id: string | null
  tmdb_id: number | null
  trakt_id: number | null
  tvdb_id: number | null
  ratings: MdblistRating[]
}

let runtimeKey = ''

export function setRuntimeMdblistKey(key: string) {
  runtimeKey = key || ''
}

function getKey(): string {
  return runtimeKey || (import.meta as any).env?.VITE_MDBLIST_API_KEY || ''
}

/**
 * Fetch MDBList ratings for a title by TMDB id. MDBList aggregates scores from
 * IMDb, TMDB, Trakt, Metacritic, Rotten Tomatoes, Letterboxd, etc.
 */
export async function fetchMdblistRatings(mediaType: 'movie' | 'tv', tmdbId: number): Promise<MdblistResult | null> {
  const key = getKey()
  if (!key || !tmdbId) return null
  const type = mediaType === 'movie' ? 'movie' : 'show'
  const url = `${MDBLIST_BASE}/items/${type}/${tmdbId}?apikey=${encodeURIComponent(key)}`
  try {
    const data = await cachedFetch(`mdblist:${type}:${tmdbId}`, () => fetch(url).then((r) => {
      if (!r.ok) throw new Error(`MDBList ${r.status}`)
      return r.json()
    }), 6 * 60 * 60 * 1000)
    return data || null
  } catch {
    return null
  }
}