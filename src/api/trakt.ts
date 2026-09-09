/**
 * Trakt scrobble + history. User pastes Client ID (from trakt.tv/oauth/applications)
 * and Access Token in Settings. Then play/pause/finish syncs to that Trakt account.
 */

const TRAKT_BASE = 'https://api.trakt.tv'

export function traktClientId() {
  try { return String(localStorage.getItem('mfy-trakt-client') || '').trim() } catch { return '' }
}

export function traktToken() {
  try {
    return String((window as any).__mfyTrakt || localStorage.getItem('mfy-trakt-token') || '').trim()
  } catch { return '' }
}

async function call(path: string, token: string, options: { method?: string; body?: any } = {}) {
  if (!token) return null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'trakt-api-version': '2',
    'trakt-api-key': traktClientId() || token,
    Authorization: `Bearer ${token}`,
  }
  const init = { method: options.method || 'GET', headers, body: options.body ? JSON.stringify(options.body) : undefined, timeoutMs: 12000 }
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  try {
    if (api?.fetchJson) {
      const r = await api.fetchJson(`${TRAKT_BASE}${path}`, init)
      if (r?.ok === false) return null
      return r?.json ?? r
    }
    const res = await fetch(`${TRAKT_BASE}${path}`, init as RequestInit)
    if (!res.ok) return null
    if (res.status === 204) return null
    return await res.json()
  } catch {
    return null
  }
}

function idsOf(media: any) {
  const tmdb = Number(media?.id || media?.tmdb || 0) || undefined
  const imdb = String(media?.imdb_id || media?.imdb || '').trim() || undefined
  return { ...(tmdb ? { tmdb } : {}), ...(imdb ? { imdb } : {}) }
}

export function scrobbleBody(media: any, progressSec: number, durationSec: number) {
  const dur = Math.max(Number(durationSec) || 0, 1)
  const pct = Math.max(1, Math.min(99, (Number(progressSec) / dur) * 100))
  const ids = idsOf(media)
  if (!ids.tmdb && !ids.imdb) return null
  const isMovie = media?.type === 'movie' || media?.mediaType === 'movie'
  if (isMovie) return { movie: { ids }, progress: +pct.toFixed(2) }
  return {
    show: { ids },
    episode: { season: Number(media?.season || 1), number: Number(media?.episode || 1) },
    progress: +pct.toFixed(2),
  }
}

let lastSent = 0
export const trakt = {
  async scrobble(media: any, progressSec: number, durationSec: number, done = false) {
    const token = traktToken()
    if (!token) return
    const body = scrobbleBody(media, progressSec, durationSec)
    if (!body) return
    const now = Date.now()
    if (!done && now - lastSent < 20000) return
    lastSent = now
    const path = done || body.progress >= 80 ? '/scrobble/stop' : '/scrobble/start'
    await call(path, token, { method: 'POST', body })
  },
  async getHistory(token?: string, limit = 40) {
    return (await call(`/users/me/history?limit=${limit}`, token || traktToken())) || []
  },
}
