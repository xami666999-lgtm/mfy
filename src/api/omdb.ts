/**
 * OMDb — optional ratings enrichment (IMDb score + Rotten Tomatoes when available).
 * Get a free key at https://www.omdbapi.com/apikey.aspx
 */

let runtimeOmdbKey = ''

export function setRuntimeOmdbKey(key: string) {
  runtimeOmdbKey = (key || '').trim()
}

function resolveKey(): string {
  if (runtimeOmdbKey) return runtimeOmdbKey
  try {
    return (import.meta as any).env?.VITE_OMDB_API_KEY || ''
  } catch {
    return ''
  }
}

export interface OmdbRatings {
  imdbRating: string | null
  imdbVotes: string | null
  rottenTomatoes: string | null
  metascore: string | null
  rated: string | null
}

export async function fetchOmdbByImdbId(imdbId: string): Promise<OmdbRatings | null> {
  const key = resolveKey()
  if (!key || !imdbId) return null
  try {
    const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${encodeURIComponent(key)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data.Response === 'False') return null
    let rt: string | null = null
    if (Array.isArray(data.Ratings)) {
      const found = data.Ratings.find((r: any) => /rotten/i.test(r.Source || ''))
      if (found?.Value) rt = found.Value
    }
    return {
      imdbRating: data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : null,
      imdbVotes: data.imdbVotes && data.imdbVotes !== 'N/A' ? data.imdbVotes : null,
      rottenTomatoes: rt,
      metascore: data.Metascore && data.Metascore !== 'N/A' ? data.Metascore : null,
      rated: data.Rated && data.Rated !== 'N/A' ? data.Rated : null,
    }
  } catch {
    return null
  }
}
