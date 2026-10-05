import { tmdb } from '../api/tmdb'
import { useStore, type WatchlistItem } from '../store'
import type { WatchHistoryItem } from '../types'

const STREMIO = 'https://api.strem.io/api'
const KEY = 'mfy-stremio-auth'

export function savedStremioKey() {
  try { return localStorage.getItem(KEY) || '' } catch { return '' }
}

async function stremio(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${STREMIO}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.error) throw new Error(data?.error?.message || data?.error || 'Stremio did not answer.')
  return data?.result ?? data
}

export async function stremioLogin(email: string, password: string) {
  const result = await stremio('login', { email: email.trim(), password })
  const authKey = String(result?.authKey || '')
  if (!authKey) throw new Error('Stremio login did not return a library key.')
  try { localStorage.setItem(KEY, authKey) } catch {}
  return authKey
}

async function matchTitle(title: string, series: boolean) {
  const data = series ? await tmdb.searchTV(title) : await tmdb.searchMovies(title)
  const rows = data?.results || []
  const want = title.toLowerCase()
  const hit = rows.find((row: any) => String(row.title || row.name || '').toLowerCase() === want) || rows[0]
  if (!hit?.id) return null
  return {
    mediaId: Number(hit.id),
    mediaType: series ? 'tv' as const : 'movie' as const,
    title: String(hit.title || hit.name || title),
    posterPath: hit.poster_path || null,
  }
}

export async function importStremioLibrary(authKey?: string) {
  const key = (authKey || savedStremioKey()).trim()
  if (!key) throw new Error('Sign in to Stremio or paste the auth key.')
  try { localStorage.setItem(KEY, key) } catch {}
  const result = await stremio('datastoreGet', { authKey: key, collection: 'libraryItem', all: true })
  const items = Array.isArray(result) ? result : []
  if (!items.length) throw new Error('That Stremio library is empty.')
  const store = useStore.getState()
  let added = 0
  for (const item of items.slice(0, 400)) {
    const title = String(item?.name || '').trim()
    if (!title || item?.removed) continue
    const series = String(item?.type || '') === 'series'
    const match = await matchTitle(title, series).catch(() => null)
    if (!match) continue
    const watched = Boolean(item?.state?.watched) || Number(item?.state?.timesWatched || 0) > 0
    if (watched) {
      const row: WatchHistoryItem = {
        id: `stremio-${match.mediaType}-${match.mediaId}`,
        mediaId: match.mediaId,
        mediaType: match.mediaType,
        title: match.title,
        posterPath: match.posterPath,
        progress: 2400,
        duration: 2400,
        season: series ? Number(item?.state?.season) || 1 : undefined,
        episode: series ? Number(item?.state?.episode) || 1 : undefined,
        watchedAt: new Date().toISOString(),
        profileId: store.currentProfile?.id || 'default',
        completed: true,
        seriesCompleted: watched,
      }
      store.upsertHistory(row)
    } else {
      const entry: WatchlistItem = { ...match, addedAt: new Date().toISOString() }
      store.addToWatchlist(entry)
    }
    added += 1
  }
  if (!added) throw new Error('Stremio answered, but none of those titles matched here.')
  try { localStorage.setItem('mfy-stremio-library', String(added)) } catch {}
  return added
}
