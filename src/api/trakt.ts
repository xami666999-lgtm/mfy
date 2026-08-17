/**
 * Lightweight Trakt helpers (optional).
 * Requires a user-provided access token from Settings / Wizard.
 */

const TRAKT_BASE = 'https://api.trakt.tv'
const CLIENT_ID = '' // optional public client id if you register an app

export interface TraktHistoryItem {
  watched_at: string
  type: 'movie' | 'episode'
  movie?: { title: string; ids: { tmdb?: number; imdb?: string } }
  episode?: { season: number; number: number; title: string }
  show?: { title: string; ids: { tmdb?: number; imdb?: string } }
}

async function traktFetch(path: string, token: string, options: RequestInit = {}) {
  if (!token) throw new Error('Trakt token required')
  const res = await fetch(`${TRAKT_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': CLIENT_ID || token,
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`Trakt ${res.status}`)
  if (res.status === 204) return null
  return res.json()
}

export const trakt = {
  async getHistory(token: string, limit = 20): Promise<TraktHistoryItem[]> {
    try {
      return (await traktFetch(`/users/me/history?limit=${limit}`, token)) || []
    } catch (e) {
      console.error('[trakt] history', e)
      return []
    }
  },

  async getWatchlist(token: string) {
    try {
      return (await traktFetch('/users/me/watchlist', token)) || []
    } catch {
      return []
    }
  },

  async scrobbleStart(token: string, body: object) {
    try {
      await traktFetch('/scrobble/start', token, { method: 'POST', body: JSON.stringify(body) })
    } catch (e) {
      console.warn('[trakt] scrobble start', e)
    }
  },

  async scrobbleStop(token: string, body: object) {
    try {
      await traktFetch('/scrobble/stop', token, { method: 'POST', body: JSON.stringify(body) })
    } catch (e) {
      console.warn('[trakt] scrobble stop', e)
    }
  },
}
