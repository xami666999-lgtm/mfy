import { tmdb } from '../api/tmdb'
import { useStore, type WatchlistItem } from '../store'
import type { WatchHistoryItem } from '../types'

const BASE = 'https://api.nuvio.tv'
const KEY = 'sb_publishable_1Clq8rlTVACkdcZuqr6_AD__xUUC_EN'
const SAVE = 'mfy-nuvio-session'
const REFRESH = 'mfy-nuvio-refresh'

async function nuvio(path: string, body: unknown, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.msg || data?.message || data?.error_description || 'Nuvio did not answer.')
  return data
}

export async function nuvioLogin(email: string, password: string) {
  const data = await nuvio('/auth/v1/token?grant_type=password', { email: email.trim(), password })
  const token = String(data?.access_token || '')
  if (!token) throw new Error('Nuvio login did not return a session.')
  try {
    localStorage.setItem(SAVE, token)
    if (data?.refresh_token) localStorage.setItem(REFRESH, String(data.refresh_token))
  } catch {}
  return token
}

async function nuvioToken() {
  let token = ''
  let refresh = ''
  try {
    token = localStorage.getItem(SAVE) || ''
    refresh = localStorage.getItem(REFRESH) || ''
  } catch {}
  if (refresh) {
    const data = await nuvio('/auth/v1/token?grant_type=refresh_token', { refresh_token: refresh }).catch(() => null)
    if (data?.access_token) {
      token = String(data.access_token)
      try {
        localStorage.setItem(SAVE, token)
        if (data.refresh_token) localStorage.setItem(REFRESH, String(data.refresh_token))
      } catch {}
    }
  }
  if (!token) throw new Error('Sign in to Nuvio once so new titles can copy over.')
  return token
}

export async function syncNuvioLibrary() {
  const token = await nuvioToken()
  const profiles = await nuvio('/rest/v1/rpc/sync_pull_profiles', {}, token).catch(() => [])
  const profileId = Number(profiles?.[0]?.profile_index || profiles?.[0]?.id || 1)
  const rows = await nuvio('/rest/v1/rpc/sync_pull_library', { p_profile_id: profileId, p_limit: 500, p_offset: 0 }, token)
  const items = Array.isArray(rows) ? rows : rows?.items || []
  return addNuvioItems(items)
}

function tmdbId(contentId: string) {
  const raw = String(contentId || '')
  const hit = raw.match(/tmdb:(\d+)/i) || raw.match(/^(\d+)$/)
  return hit ? Number(hit[1]) : 0
}

export async function importNuvioLibrary(email: string, password: string) {
  const token = await nuvioLogin(email, password)
  const profiles = await nuvio('/rest/v1/rpc/sync_pull_profiles', {}, token).catch(() => [])
  const profileId = Number(profiles?.[0]?.profile_index || profiles?.[0]?.id || 1)
  const rows = await nuvio('/rest/v1/rpc/sync_pull_library', { p_profile_id: profileId, p_limit: 500, p_offset: 0 }, token)
  const items = Array.isArray(rows) ? rows : rows?.items || []
  if (!items.length) throw new Error('That Nuvio library is empty.')
  const added = await addNuvioItems(items)
  try { localStorage.setItem('mfy-nuvio-email', email.trim()) } catch {}
  return added
}

async function addNuvioItems(items: any[]) {
  const store = useStore.getState()
  let added = 0
  for (const item of items.slice(0, 400)) {
    const series = String(item?.content_type || '') === 'series'
    let id = tmdbId(item?.content_id)
    let title = String(item?.name || '')
    let poster = null as string | null
    if (!id && title) {
      const data = series ? await tmdb.searchTV(title).catch(() => null) : await tmdb.searchMovies(title).catch(() => null)
      const hit = data?.results?.[0]
      id = Number(hit?.id || 0)
      title = String(hit?.title || hit?.name || title)
      poster = hit?.poster_path || null
    }
    if (!id) continue
    const entry: WatchlistItem = { mediaId: id, mediaType: series ? 'tv' : 'movie', title, posterPath: poster, addedAt: new Date().toISOString() }
    store.addToWatchlist(entry)
    const watched = Boolean(item?.watched) || Number(item?.progress || 0) > 0
    if (watched) {
      const row: WatchHistoryItem = {
        id: `nuvio-${series ? 'tv' : 'movie'}-${id}`,
        mediaId: id,
        mediaType: series ? 'tv' : 'movie',
        title,
        posterPath: poster,
        progress: Number(item?.progress || 1),
        duration: 2400,
        watchedAt: new Date().toISOString(),
        profileId: store.currentProfile?.id || 'default',
        completed: Boolean(item?.watched),
      }
      store.upsertHistory(row)
    }
    added += 1
  }
  return added
}
